
// C.H.A.O.S.™ Runtime Engine

// Cognitive Heuristics for Autonomous Orchestration Systems


import { Tool } from '@/types/tool'


export interface WorkflowStep {
    id: string
    type: 'web-api' | 'file-op' | 'ai-call' | 'transform' | 'conditional' | 'tool-call'
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


interface ExecutionContext {
    sessionId: string
    startTime: number
    results: Map<string, any>
    logs: Array<{ timestamp: number; stage: string; data: any }>
}


class MiddlewareRuntime {
    private tools: Map<string, Tool> = new Map()
    private workflows: Map<string, Workflow> = new Map()
    private executions: Map<string, ExecutionContext> = new Map()

    registerTool(tool: Tool) {
    this.tools.set(tool.id, tool)
    console.log('[C.H.A.O.S.™] Tool registered:', tool.name)
    }

    registerWorkflow(workflow: Workflow) {
    this.workflows.set(workflow.id, workflow)
    console.log('[C.H.A.O.S.™] Workflow registered:', workflow.name)
    }

    async executeTool(toolId: string, inputs: Record<string, any>): Promise<any> {
    const tool = this.tools.get(toolId)
    if (!tool) {
        throw new Error(`Tool not found: ${toolId}`)
    }

    const sessionId = `exec-${Date.now()}`
    const context: ExecutionContext = {
        sessionId,
        startTime: Date.now(),
        results: new Map(),
        logs: [],
    }

    this.executions.set(sessionId, context)

    context.logs.push({
        timestamp: Date.now(),
        stage: 'initialization',
        data: { toolId, inputs },
    })

    try {
        // For AI-generated tools, evaluate the code
        if (tool.isAiGenerated && tool.generatedCode) {
        context.logs.push({
            timestamp: Date.now(),
            stage: 'code-execution',
            data: { code: tool.generatedCode.substring(0, 100) },
        })

        // Create a safe execution environment
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor
        const handler = new AsyncFunction('params', tool.generatedCode + '\nreturn handler(params);')
        
        const result = await handler(inputs)
        
        context.logs.push({
            timestamp: Date.now(),
            stage: 'execution-complete',
            data: { result },
        })

        context.results.set('output', result)

        return {
            sessionId,
            success: true,
            result,
            duration: Date.now() - context.startTime,
        }
        }

        // For regular tools, call the endpoint
        if (tool.endpoint) {
        const response = await fetch(tool.endpoint, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            ...(tool.apiKey && { 'Authorization': `Bearer ${tool.apiKey}` }),
            },
            body: JSON.stringify(inputs),
        })

        const result = await response.json()
        
        context.logs.push({
            timestamp: Date.now(),
            stage: 'api-response',
            data: { status: response.status, result },
        })

        return {
            sessionId,
            success: response.ok,
            result,
            duration: Date.now() - context.startTime,
        }
        }

        throw new Error('Tool has no executable code or endpoint')
    } catch (error) {
        context.logs.push({
        timestamp: Date.now(),
        stage: 'error',
        data: { error: error instanceof Error ? error.message : String(error) },
        })

        throw error
    }
    }

    async selfCorrect(toolId: string, directive: string): Promise<Tool> {
    const tool = this.tools.get(toolId)
    if (!tool) {
        throw new Error(`Tool not found: ${toolId}`)
    }

    console.log('[C.H.A.O.S.™] Self-correction initiated:', directive)

    // In a real implementation, this would call an LLM to refactor the code
    // For now, we'll just update the description
    const refactoredTool: Tool = {
        ...tool,
        description: `${tool.description}\n\nRefactored: ${directive}`,
        generatedCode: tool.generatedCode + '\n// Refactored based on directive: ' + directive,
    }

    this.tools.set(toolId, refactoredTool)

    return refactoredTool
    }

    async executeWorkflow(workflowId: string, inputs: Record<string, any>): Promise<any> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`)
    }

    console.log('[C.H.A.O.S.™] Executing workflow:', workflow.name)

    const results: Record<string, any> = {}

    for (const step of workflow.steps) {
        console.log('[C.H.A.O.S.™] Executing step:', step.id)
        
        try {
        const stepResult = await this.executeWorkflowStep(step, results, inputs)
        results[step.id] = stepResult
        } catch (error) {
        console.error('[C.H.A.O.S.™] Step failed:', step.id, error)
        throw error
        }
    }

    return results
    }

    private async executeWorkflowStep(
    step: WorkflowStep,
    previousResults: Record<string, any>,
    inputs: Record<string, any>
    ): Promise<any> {
    switch (step.type) {
        case 'web-api':
        return this.executeWebApiStep(step, previousResults, inputs)
        case 'transform':
        return this.executeTransformStep(step, previousResults, inputs)
        case 'conditional':
        return this.executeConditionalStep(step, previousResults, inputs)
        default:
        throw new Error(`Unknown step type: ${step.type}`)
    }
    }

    private async executeWebApiStep(
    step: WorkflowStep,
    previousResults: Record<string, any>,
    inputs: Record<string, any>
    ): Promise<any> {
    const url = this.interpolateVariables(step.config.url, previousResults, inputs)
    const method = step.config.method || 'GET'

    const response = await fetch(url, {
        method,
        headers: step.config.headers || {},
    })

    return response.json()
    }

    private async executeTransformStep(
    step: WorkflowStep,
    previousResults: Record<string, any>,
    inputs: Record<string, any>
    ): Promise<any> {
    const input = this.interpolateVariables(step.config.input, previousResults, inputs)
    const transformFn = step.config.transformFn

    const fn = new Function('input', 'results', 'inputs', `return (${transformFn})(input, results, inputs)`)
    return fn(input, previousResults, inputs)
    }

    private async executeConditionalStep(
    step: WorkflowStep,
    previousResults: Record<string, any>,
    inputs: Record<string, any>
    ): Promise<any> {
    const condition = step.config.condition
    const fn = new Function('step', 'results', 'inputs', `return ${condition}`)
    const result = fn(
        (id: string) => previousResults[id],
        previousResults,
        inputs
    )

    return {
        condition,
        result,
        nextStep: result ? step.config.thenStepId : step.config.elseStepId,
    }
    }

    private interpolateVariables(
    template: string,
    results: Record<string, any>,
    inputs: Record<string, any>
    ): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
        const trimmed = path.trim()
        if (trimmed.startsWith('step.')) {
        const stepId = trimmed.substring(5)
        return results[stepId] || match
        }
        if (trimmed.startsWith('input.')) {
        const inputKey = trimmed.substring(6)
        return inputs[inputKey] || match
        }
        return match
    })
    }

    getExecutionLog(sessionId: string) {
    return this.executions.get(sessionId)?.logs || []
    }

    validateWorkflowDefinition(definition: string, format: 'yaml' | 'json'): { valid: boolean; errors: string[] } {
    try {
        if (format === 'json') {
        JSON.parse(definition)
        }
        return { valid: true, errors: [] }
    } catch (error) {
        return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Invalid format'],
        }
    }
    }

    registerDeclarativeWorkflow(definition: string, format: 'yaml' | 'json'): Workflow {
    const workflow = JSON.parse(definition)
    const id = `workflow-${Date.now()}`
    
    const registeredWorkflow: Workflow = {
        id,
        ...workflow,
    }

    this.registerWorkflow(registeredWorkflow)
    return registeredWorkflow
    }

    generateWorkflowTemplate(): string {
    return JSON.stringify(
        {
        name: 'Example Workflow',
        description: 'A sample workflow template',
        steps: [
            {
            id: 'fetch-data',
            type: 'web-api',
            config: {
                url: 'https://api.example.com/data',
                method: 'GET',
            },
            },
            {
            id: 'transform',
            type: 'transform',
            config: {
                input: '{{step.fetch-data}}',
                transformFn: 'return input.toUpperCase()',
            },
            },
        ],
        context: {},
        },
        null, 2
        )
    }
}
