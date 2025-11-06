import { Tool } from '@/types/tool'
import { RuntimeCore, RuntimeContext, WorkflowStep, Workflow } from './runtime-core'
import { telemetry } from './runtime-telemetry'
import { WorkflowSchemaParser, DeclarativeWorkflow } from './workflow-schema'

declare global {
  interface Window {
    spark: any;
  }
}

export class RuntimeExecutor extends RuntimeCore {
  /**
   * Register a workflow from a declarative YAML/JSON definition
   */
  registerDeclarativeWorkflow(definition: string, format: 'yaml' | 'json' = 'yaml'): Workflow {
    console.groupCollapsed(`[RuntimeExecutor] Registering declarative workflow`)
    console.log(`[DIAGNOSTIC] Format: ${format}, definition length: ${definition.length}`)
    
    let declarativeWorkflow: DeclarativeWorkflow
    
    try {
      if (format === 'yaml') {
        declarativeWorkflow = WorkflowSchemaParser.parseYAML(definition)
      } else {
        declarativeWorkflow = WorkflowSchemaParser.parseJSON(definition)
      }
      
      console.log(`[DIAGNOSTIC] Parsed workflow: ${declarativeWorkflow.name} with ${Object.keys(declarativeWorkflow.steps).length} steps`)
    } catch (error) {
      console.error(`[RuntimeExecutor] Failed to parse declarative workflow:`, error)
      console.groupEnd()
      throw error
    }

    const runtimeWorkflow = WorkflowSchemaParser.convertToRuntimeWorkflow(declarativeWorkflow)
    
    this.registerWorkflow(runtimeWorkflow)
    
    console.log(`[DIAGNOSTIC] Successfully registered workflow: ${runtimeWorkflow.id}`)
    console.groupEnd()
    
    return runtimeWorkflow
  }

  /**
   * Generate a workflow template for users
   */
  generateWorkflowTemplate(): string {
    return WorkflowSchemaParser.generateTemplate()
  }

  /**
   * Validate a workflow definition without registering it
   */
  validateWorkflowDefinition(definition: string, format: 'yaml' | 'json' = 'yaml'): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    try {
      if (format === 'yaml') {
        WorkflowSchemaParser.parseYAML(definition)
      } else {
        WorkflowSchemaParser.parseJSON(definition)
      }
      return { valid: true, errors: [] }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error))
      return { valid: false, errors }
    }
  }
  async executeTool(toolId: string, inputs: Record<string, any>): Promise<any> {
    console.groupCollapsed(`[RuntimeExecutor] Executing tool: ${toolId}`)
    console.table({ toolId, inputs, timestamp: new Date().toISOString() })

    // Check circuit breaker first
    console.log(`[DIAGNOSTIC] Checking circuit breaker for tool: ${toolId}`)
    if (!this.checkCircuitBreaker(toolId)) {
      const error = new Error(`Circuit breaker open for tool ${toolId}`)
      console.error('[CircuitBreaker] Tool execution blocked:', error.message)
      console.groupEnd()
      throw error
    }
    console.log(`[DIAGNOSTIC] Circuit breaker check passed for tool: ${toolId}`)

    const tool = this.getTool(toolId)
    if (!tool) {
      const error = new Error(`Tool ${toolId} not registered in runtime`)
      console.error('[RuntimeExecutor] Tool not found:', error.message)
      console.groupEnd()
      throw error
    }

    const context = this.createContext(toolId, inputs)
    
    try {
      context.executionLog.push({
        timestamp: Date.now(),
        stage: 'start',
        data: { toolId, inputs, toolName: tool.name }
      })

      let result: any

      if (tool.isAiGenerated && tool.generatedCode) {
        console.log(`[RuntimeExecutor] Executing AI-generated code for: ${tool.name}`)
        result = await this.executeGeneratedCode(tool, inputs, context)
      } else if (tool.endpoint) {
        console.log(`[RuntimeExecutor] Calling endpoint: ${tool.endpoint}`)
        result = await this.executeEndpoint(tool, inputs, context)
      } else {
        const error = new Error('Tool has no executable endpoint or code')
        console.error('[RuntimeExecutor] No execution method:', error.message)
        throw error
      }

      context.outputs = result
      const duration = Date.now() - context.startTime
      
      context.executionLog.push({
        timestamp: Date.now(),
        stage: 'complete',
        data: { result, duration }
      })

      // Update circuit breaker on success
      console.log(`[DIAGNOSTIC] Updating circuit breaker for successful execution: ${toolId}`)
      this.updateCircuitBreaker(toolId, true)
      
      // Record telemetry event
      telemetry.recordEvent({
        type: 'tool_execution',
        sessionId: context.sessionId,
        toolId,
        duration,
        success: true,
        metadata: {
          toolName: tool.name,
          outputKeys: Object.keys(result || {}),
          executionType: tool.isAiGenerated ? 'generated_code' : 'endpoint'
        }
      })
      
      console.table({
        success: true,
        duration: `${duration}ms`,
        outputKeys: Object.keys(result || {})
      })
      console.groupEnd()

      return result
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      const duration = Date.now() - context.startTime
      
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

      // Update circuit breaker on failure
      console.log(`[DIAGNOSTIC] Updating circuit breaker for failed execution: ${toolId}`)
      this.updateCircuitBreaker(toolId, false)
      
      // Record telemetry event for failure
      telemetry.recordEvent({
        type: 'tool_execution',
        sessionId: context.sessionId,
        toolId,
        duration,
        success: false,
        error: errorMsg,
        metadata: {
          toolName: tool.name,
          executionType: tool.isAiGenerated ? 'generated_code' : 'endpoint'
        }
      })
      
      console.error('[RuntimeExecutor] Execution failed:', errorMsg)
      console.groupEnd()
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
      data: { tool: tool.name, codeLength: tool.generatedCode?.length }
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

    console.log(`[RuntimeExecutor] Making API call to: ${tool.endpoint}`)
    const startTime = Date.now()

    const response = await fetch(tool.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(inputs)
    })

    const duration = Date.now() - startTime
    console.log(`[RuntimeExecutor] API call completed in ${duration}ms, status: ${response.status}`)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  }

  async executeWorkflow(workflowId: string, initialInputs: Record<string, any>): Promise<any> {
    console.groupCollapsed(`[RuntimeExecutor] DIAGNOSTIC: Starting workflow execution`)
    console.log(`[DIAGNOSTIC] workflowId: ${workflowId}`)
    console.log(`[DIAGNOSTIC] initialInputs keys: ${Object.keys(initialInputs)}`)
    
    const workflow = this.getWorkflow(workflowId)
    if (!workflow) {
      console.error(`[DIAGNOSTIC] Workflow ${workflowId} not found in registry`)
      console.groupEnd()
      throw new Error(`Workflow ${workflowId} not found`)
    }

    console.log(`[DIAGNOSTIC] Workflow found: ${workflow.name} with ${workflow.steps?.length || 0} steps`)
    console.table({
      workflowId,
      steps: workflow.steps?.length || 0,
      initialInputs: Object.keys(initialInputs),
      hasContext: !!workflow.context
    })

    const workflowStartTime = Date.now()
    console.log(`[DIAGNOSTIC] Workflow start time: ${workflowStartTime}`)
    
    const workflowContext = { ...workflow.context, ...initialInputs }
    const stepResults: Map<string, any> = new Map()

    for (const step of workflow.steps) {
      console.groupCollapsed(`[Workflow] Executing step: ${step.id} (${step.type})`)
      
      if (step.dependsOn) {
        const allDependenciesMet = step.dependsOn.every(depId => stepResults.has(depId))
        if (!allDependenciesMet) {
          const error = new Error(`Step ${step.id} dependencies not met`)
          console.error('[Workflow] Dependency check failed:', error.message)
          console.groupEnd()
          throw error
        }
        console.log(`[Workflow] Dependencies met: ${step.dependsOn.join(', ')}`)
      }

      let stepResult: any
      const stepStartTime = Date.now()

      try {
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

        const stepDuration = Date.now() - stepStartTime
        console.log(`[Workflow] Step completed in ${stepDuration}ms`)
        console.table({ stepId: step.id, type: step.type, duration: `${stepDuration}ms` })

      } catch (error) {
        console.error(`[Workflow] Step ${step.id} failed:`, error)
        console.groupEnd()
        throw error
      }

      stepResults.set(step.id, stepResult)
      workflowContext[step.id] = stepResult
      console.groupEnd()
    }

    const workflowDuration = Date.now() - workflowStartTime
    console.log(`[DIAGNOSTIC] Workflow completed in ${workflowDuration}ms`)
    
    const workflowResult = {
      workflowId,
      completedAt: Date.now(),
      results: Object.fromEntries(stepResults)
    }

    // Record workflow telemetry
    telemetry.recordEvent({
      type: 'workflow_execution',
      sessionId: `workflow-${workflowId}-${Date.now()}`,
      workflowId,
      duration: workflowDuration,
      success: true,
      metadata: {
        workflowName: workflow.name,
        totalSteps: workflow.steps.length,
        stepTypes: workflow.steps.map(step => step.type)
      }
    })

    console.table({
      workflowCompleted: true,
      totalSteps: workflow.steps.length,
      resultKeys: Object.keys(workflowResult.results),
      duration: `${workflowDuration}ms`
    })
    console.groupEnd()

    return workflowResult
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

    console.log(`[WebAPI] ${method} ${resolvedUrl}`)

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
      
      console.log(`[FileOp] Fetching from: ${resolvedRepoUrl}/${resolvedFilePath}`)

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
  
    private hashCode(str: string): string {
      let hash = 0
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32-bit integer
      }
      return Math.abs(hash).toString(36)
    }

  private async executeAiCallStep(
    step: WorkflowStep,
    context: Record<string, any>,
    results: Map<string, any>
  ): Promise<any> {
    const { promptTemplate, model = 'gpt-4o', jsonMode = false } = step.config

    const resolvedPrompt = this.interpolate(promptTemplate, context, results)
    
    console.log(`[AICall] Using model: ${model}, jsonMode: ${jsonMode}`)
    
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
    
    console.log(`[Transform] Applying transformation function`)
    
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

    console.log(`[Conditional] Condition result: ${conditionMet}`)

    if (conditionMet && thenStep) {
      return { branch: 'then', condition: conditionMet, value: thenStep }
    } else if (!conditionMet && elseStep) {
      return { branch: 'else', condition: conditionMet, value: elseStep }
    }

    return { branch: 'none', condition: conditionMet }
  }

  async selfCorrect(toolId: string, directive: string): Promise<Tool> {
    const tool = this.getTool(toolId)
    if (!tool || !tool.isAiGenerated || !tool.generatedCode) {
      throw new Error('Can only self-correct AI-generated tools')
    }

    console.groupCollapsed(`[SelfCorrection] Starting for tool: ${tool.name}`)
    console.log(`[SelfCorrection] Directive: ${directive}`)

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

    console.table({
      toolId: tool.id,
      changes: parsed.refactoredTool.changes,
      securityImprovements: parsed.refactoredTool.securityImprovements,
      newFeatures: parsed.refactoredTool.newFeatures
    })
    console.groupEnd()

    return refactoredTool
  }
}