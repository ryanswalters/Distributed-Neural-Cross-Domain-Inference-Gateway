import { Tool } from '@/types/tool'

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

export class RuntimeCore {
  protected contexts: Map<string, RuntimeContext> = new Map()
  protected workflows: Map<string, Workflow> = new Map()
  protected registeredTools: Map<string, Tool> = new Map()
  private toolMetadataCache: Map<string, Tool> = new Map()
  private circuitBreakerStates: Map<string, { failures: number; lastFailure: number; state: 'closed' | 'open' | 'half-open' }> = new Map()

  registerTool(tool: Tool): void {
    this.registeredTools.set(tool.id, tool)
    this.toolMetadataCache.set(tool.id, tool)
    console.groupCollapsed(`[RuntimeCore] Tool registered: ${tool.name}`)
    console.table({ id: tool.id, category: tool.category, hasEndpoint: !!tool.endpoint, isAiGenerated: tool.isAiGenerated })
    console.groupEnd()
  }

  unregisterTool(toolId: string): void {
    this.registeredTools.delete(toolId)
    this.toolMetadataCache.delete(toolId)
    this.circuitBreakerStates.delete(toolId)
    console.log(`[RuntimeCore] Tool unregistered: ${toolId}`)
  }

  getTool(toolId: string): Tool | undefined {
    // Use cached metadata if available
    return this.toolMetadataCache.get(toolId) || this.registeredTools.get(toolId)
  }

  registerWorkflow(workflow: Workflow): void {
    this.workflows.set(workflow.id, workflow)
    console.groupCollapsed(`[RuntimeCore] Workflow registered: ${workflow.name}`)
    console.table({ id: workflow.id, steps: workflow.steps.length, hasContext: Object.keys(workflow.context).length > 0 })
    console.groupEnd()
  }

  getWorkflow(workflowId: string): Workflow | undefined {
    return this.workflows.get(workflowId)
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

  protected checkCircuitBreaker(toolId: string): boolean {
    const state = this.circuitBreakerStates.get(toolId) || { failures: 0, lastFailure: 0, state: 'closed' as const }
    
    if (state.state === 'open') {
      // Check if we should transition to half-open
      const timeSinceLastFailure = Date.now() - state.lastFailure
      if (timeSinceLastFailure > 30000) { // 30 second cooldown
        state.state = 'half-open'
        state.failures = 0
        this.circuitBreakerStates.set(toolId, state)
        return true
      }
      return false
    }
    
    return true
  }

  protected updateCircuitBreaker(toolId: string, success: boolean): void {
    let state = this.circuitBreakerStates.get(toolId) || { failures: 0, lastFailure: 0, state: 'closed' as const }
    
    if (success) {
      state.failures = 0
      state.state = 'closed'
    } else {
      state.failures++
      state.lastFailure = Date.now()
      
      if (state.failures >= 5) { // 5 consecutive failures
        state.state = 'open'
      } else if (state.failures >= 3) { // 3 consecutive failures
        state.state = 'half-open'
      }
    }
    
    this.circuitBreakerStates.set(toolId, state)
    
    if (!success) {
      console.groupCollapsed(`[CircuitBreaker] Tool ${toolId} failure`)
      console.table({ failures: state.failures, state: state.state, lastFailure: new Date(state.lastFailure).toISOString() })
      console.groupEnd()
    }
  }

  protected createContext(toolId: string, inputs: Record<string, any>): RuntimeContext {
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
    return context
  }

  protected interpolate(template: string, context: Record<string, any>, results: Map<string, any>): string {
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

  protected interpolateObject(obj: any, context: Record<string, any>, results: Map<string, any>): any {
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

  protected getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }
}