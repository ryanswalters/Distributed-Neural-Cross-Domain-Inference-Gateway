import { Tool } from '@/types/tool'

declare global {
  interface Window {
    spark: any;
  }
}

export interface RuntimeContext {
  toolId: string
  sessionId: string
  inputs: Record<string, any>
  outputs: Record<string, any>
  errors: Array<{ stage: string; error: string; timestamp: number }>
  startTime: number
  executionLog: Array<{ timestamp: number; stage: string; data: any }>
}

export interface WorkflowStep {
  id: string
  type: 'web-api' | 'file-op' | 'ai-call' | 'transform' | 'conditional'
  toolId?: string
  config: Record<string, any>
  dependsOn?: string[]
}

export interface Workflow {
  id: string
  name: string
  description: string
  steps: WorkflowStep[]
  context: Record<string, any>
}

export class MiddlewareRuntime {
  private contexts: Map<string, RuntimeContext> = new Map()
  private workflows: Map<string, Workflow> = new Map()
  private registeredTools: Map<string, Tool> = new Map()

  registerTool(tool: Tool): void {
    this.registeredTools.set(tool.id, tool)
    console.log(`[Runtime] Tool registered: ${tool.name} (${tool.id})`)
  }

  unregisterTool(toolId: string): void {
    this.registeredTools.delete(toolId)
    console.log(`[Runtime] Tool unregistered: ${toolId}`)
  }

  async executeTool(toolId: string, inputs: Record<string, any>): Promise<any> {
    const tool = this.registeredTools.get(toolId)
    if (!tool) {
      throw new Error(`Tool ${toolId} not registered in runtime`)
    }

    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const context: RuntimeContext = {
      toolId,
      sessionId,
      inputs,
      outputs: {},
      errors: [],
      startTime: Date.now(),
      executionLog: []
    }

    this.contexts.set(sessionId, context)

    try {
      context.executionLog.push({
        timestamp: Date.now(),
        stage: 'start',
        data: { toolId, inputs }
      })

      let result: any

      if (tool.isAiGenerated && tool.generatedCode) {
        result = await this.executeGeneratedCode(tool, inputs, context)
      } else if (tool.endpoint) {
        result = await this.executeEndpoint(tool, inputs, context)
      } else {
        throw new Error('Tool has no executable endpoint or code')
      }

      context.outputs = result
      context.executionLog.push({
        timestamp: Date.now(),
        stage: 'complete',
        data: { result, duration: Date.now() - context.startTime }
      })

      return result
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      context.errors.push({
        stage: 'execution',
        error: errorMsg,
        timestamp: Date.now()
      })
      context.executionLog.push({
        timestamp: Date.now(),
        stage: 'error',
        data: { error: errorMsg }
      })
      throw error
    }
  }

  private async executeGeneratedCode(
    tool: Tool,
    inputs: Record<string, any>,
    context: RuntimeContext
  ): Promise<any> {
    context.executionLog.push({
      timestamp: Date.now(),
      stage: 'execute-generated-code',
      data: { tool: tool.name }
    })

    try {
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor
      const handler = new AsyncFunction('params', 'context', 'spark', tool.generatedCode!)
      
      const result = await handler(inputs, {
        sessionId: context.sessionId,
        toolId: tool.id,
        log: (msg: string) => {
          context.executionLog.push({
            timestamp: Date.now(),
            stage: 'log',
            data: { message: msg }
          })
        }
      }, window.spark)

      return result
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      throw new Error(`Generated code execution failed: ${errorMsg}`)
    }
  }

  private async executeEndpoint(
    tool: Tool,
    inputs: Record<string, any>,
    context: RuntimeContext
  ): Promise<any> {
    context.executionLog.push({
      timestamp: Date.now(),
      stage: 'execute-endpoint',
      data: { endpoint: tool.endpoint }
    })

    if (!tool.endpoint) {
      throw new Error('No endpoint configured')
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (tool.apiKey) {
      headers['Authorization'] = `Bearer ${tool.apiKey}`
    }

    const response = await fetch(tool.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(inputs)
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  }

  async executeWorkflow(workflowId: string, initialInputs: Record<string, any>): Promise<any> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`)
    }

    const workflowContext = { ...workflow.context, ...initialInputs }
    const stepResults: Map<string, any> = new Map()

    console.log(`[Workflow] Starting: ${workflow.name}`)

    for (const step of workflow.steps) {
      if (step.dependsOn) {
        const allDependenciesMet = step.dependsOn.every(depId => stepResults.has(depId))
        if (!allDependenciesMet) {
          throw new Error(`Step ${step.id} dependencies not met`)
        }
      }

      console.log(`[Workflow] Executing step: ${step.id} (${step.type})`)

      let stepResult: any

      switch (step.type) {
        case 'web-api':
          stepResult = await this.executeWebApiStep(step, workflowContext, stepResults)
          break
        case 'file-op':
          stepResult = await this.executeFileOpStep(step, workflowContext, stepResults)
          break
        case 'ai-call':
          stepResult = await this.executeAiCallStep(step, workflowContext, stepResults)
          break
        case 'transform':
          stepResult = await this.executeTransformStep(step, workflowContext, stepResults)
          break
        case 'conditional':
          stepResult = await this.executeConditionalStep(step, workflowContext, stepResults)
          break
        default:
          throw new Error(`Unknown step type: ${step.type}`)
      }

      stepResults.set(step.id, stepResult)
      workflowContext[step.id] = stepResult
    }

    return {
      workflowId,
      completedAt: Date.now(),
      results: Object.fromEntries(stepResults)
    }
  }

  private async executeWebApiStep(
    step: WorkflowStep,
    context: Record<string, any>,
    results: Map<string, any>
  ): Promise<any> {
    const { url, method = 'GET', headers = {}, body } = step.config

    const resolvedUrl = this.interpolate(url, context, results)
    const resolvedHeaders = this.interpolateObject(headers, context, results)
    const resolvedBody = body ? this.interpolateObject(body, context, results) : undefined

    const response = await fetch(resolvedUrl, {
      method,
      headers: resolvedHeaders,
      body: resolvedBody ? JSON.stringify(resolvedBody) : undefined
    })

    if (!response.ok) {
      throw new Error(`Web API call failed: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  private async executeFileOpStep(
    step: WorkflowStep,
    context: Record<string, any>,
    results: Map<string, any>
  ): Promise<any> {
    const { operation, repoUrl, filePath, content } = step.config

    if (operation === 'fetch') {
      const resolvedRepoUrl = this.interpolate(repoUrl, context, results)
      const resolvedFilePath = this.interpolate(filePath || '', context, results)
      
      const match = resolvedRepoUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
      if (!match) {
        throw new Error('Invalid GitHub repository URL')
      }

      const [, owner, repo] = match
      const path = resolvedFilePath || ''
      
      const apiUrl = `https://api.github.com/repos/${owner}/${repo.replace('.git', '')}/contents/${path}`
      const response = await fetch(apiUrl)
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`)
      }

      const data = await response.json()
      
      if (Array.isArray(data)) {
        return { type: 'directory', files: data }
      } else if (data.content) {
        return {
          type: 'file',
          content: atob(data.content),
          path: data.path,
          sha: data.sha
        }
      }

      return data
    }

    if (operation === 'store') {
      const key = this.interpolate(step.config.key, context, results)
      const value = this.interpolateObject(content, context, results)
      await window.spark.kv.set(key, value)
      return { stored: true, key }
    }

    if (operation === 'retrieve') {
      const key = this.interpolate(step.config.key, context, results)
      const value = await window.spark.kv.get(key)
      return value
    }

    throw new Error(`Unknown file operation: ${operation}`)
  }

  private async executeAiCallStep(
    step: WorkflowStep,
    context: Record<string, any>,
    results: Map<string, any>
  ): Promise<any> {
    const { promptTemplate, model = 'gpt-4o', jsonMode = false } = step.config

    const resolvedPrompt = this.interpolate(promptTemplate, context, results)
    
    const response = await window.spark.llm(resolvedPrompt, model, jsonMode)
    
    return jsonMode ? JSON.parse(response) : response
  }

  private async executeTransformStep(
    step: WorkflowStep,
    context: Record<string, any>,
    results: Map<string, any>
  ): Promise<any> {
    const { transformFn, input } = step.config

    const inputValue = this.interpolate(input, context, results)
    
    const fn = new Function('input', 'context', 'results', transformFn)
    return fn(inputValue, context, Object.fromEntries(results))
  }

  private async executeConditionalStep(
    step: WorkflowStep,
    context: Record<string, any>,
    results: Map<string, any>
  ): Promise<any> {
    const { condition, thenStep, elseStep } = step.config

    const conditionFn = new Function('context', 'results', `return ${condition}`)
    const conditionMet = conditionFn(context, Object.fromEntries(results))

    if (conditionMet && thenStep) {
      return { branch: 'then', condition: conditionMet, value: thenStep }
    } else if (!conditionMet && elseStep) {
      return { branch: 'else', condition: conditionMet, value: elseStep }
    }

    return { branch: 'none', condition: conditionMet }
  }

  private interpolate(template: string, context: Record<string, any>, results: Map<string, any>): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
      const trimmedPath = path.trim()
      
      if (trimmedPath.startsWith('step.')) {
        const stepId = trimmedPath.substring(5).split('.')[0]
        const stepResult = results.get(stepId)
        if (stepResult === undefined) {
          throw new Error(`Step ${stepId} not found in results`)
        }
        
        const nestedPath = trimmedPath.substring(5 + stepId.length + 1)
        return nestedPath ? this.getNestedValue(stepResult, nestedPath) : stepResult
      }
      
      return this.getNestedValue(context, trimmedPath)
    })
  }

  private interpolateObject(obj: any, context: Record<string, any>, results: Map<string, any>): any {
    if (typeof obj === 'string') {
      return this.interpolate(obj, context, results)
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.interpolateObject(item, context, results))
    }
    
    if (obj && typeof obj === 'object') {
      const result: Record<string, any> = {}
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.interpolateObject(value, context, results)
      }
      return result
    }
    
    return obj
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  registerWorkflow(workflow: Workflow): void {
    this.workflows.set(workflow.id, workflow)
    console.log(`[Runtime] Workflow registered: ${workflow.name}`)
  }

  getContext(sessionId: string): RuntimeContext | undefined {
    return this.contexts.get(sessionId)
  }

  getExecutionLog(sessionId: string): Array<{ timestamp: number; stage: string; data: any }> {
    return this.contexts.get(sessionId)?.executionLog || []
  }

  clearContext(sessionId: string): void {
    this.contexts.delete(sessionId)
  }

  async selfCorrect(toolId: string, directive: string): Promise<Tool> {
    const tool = this.registeredTools.get(toolId)
    if (!tool || !tool.isAiGenerated || !tool.generatedCode) {
      throw new Error('Can only self-correct AI-generated tools')
    }

    const correctionPrompt = `You are refactoring an AI-generated tool. Here is the current implementation:

Tool Name: ${tool.name}
Description: ${tool.description}
Current Code:
\`\`\`javascript
${tool.generatedCode}
\`\`\`

Refactoring Directive: ${directive}

Generate an improved version that:
1. Addresses the directive completely
2. Maintains the original functionality
3. Improves error handling, security, and performance
4. Adds any necessary persistence if mentioned
5. Returns valid, executable JavaScript code

Return ONLY valid JSON with this structure:
{
  "refactoredTool": {
    "code": "// Complete refactored implementation",
    "changes": "Brief description of what was changed and why",
    "securityImprovements": "List of security enhancements made",
    "newFeatures": ["feature1", "feature2"]
  }
}`

    const response = await window.spark.llm(correctionPrompt, 'gpt-4o', true)
    const parsed = JSON.parse(response)

    if (!parsed.refactoredTool) {
      throw new Error('Invalid self-correction response')
    }

    const refactoredTool: Tool = {
      ...tool,
      generatedCode: parsed.refactoredTool.code,
      description: `${tool.description}\n\nRefactored: ${parsed.refactoredTool.changes}`,
      updatedAt: Date.now()
    }

    this.registeredTools.set(toolId, refactoredTool)

    return refactoredTool
  }
}

export const runtime = new MiddlewareRuntime()
