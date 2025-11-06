import { Workflow, WorkflowStep } from './runtime-core'

/**
 * Declarative Workflow Schema for YAML/JSON definitions
 * Enables workflow definition without code
 */
export interface DeclarativeWorkflow {
  version: '1.0'
  name: string
  description: string
  metadata?: {
    author?: string
    tags?: string[]
    version?: string
    timeout?: number
    retryPolicy?: 'none' | 'linear' | 'exponential'
  }
  inputs?: {
    [key: string]: {
      type: 'string' | 'number' | 'boolean' | 'array' | 'object'
      required?: boolean
      description?: string
      default?: any
      validation?: {
        pattern?: string
        min?: number
        max?: number
        enum?: any[]
      }
    }
  }
  steps: {
    [stepId: string]: DeclarativeStep
  }
  outputs?: {
    [key: string]: string // References to step outputs
  }
}

export interface DeclarativeStep {
  type: 'web-api' | 'file-op' | 'ai-call' | 'transform' | 'conditional' | 'tool-call'
  description?: string
  dependsOn?: string[]
  config: StepConfig
  retry?: {
    attempts: number
    delay: number
    backoff?: 'linear' | 'exponential'
  }
  timeout?: number
}

export type StepConfig = 
  | WebApiStepConfig
  | FileOpStepConfig
  | AiCallStepConfig
  | TransformStepConfig
  | ConditionalStepConfig
  | ToolCallStepConfig

export interface WebApiStepConfig {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
  query?: Record<string, string>
  responseType?: 'json' | 'text' | 'blob'
}

export interface FileOpStepConfig {
  operation: 'fetch' | 'store' | 'retrieve' | 'list'
  repoUrl?: string
  filePath?: string
  content?: any
  key?: string
  storage?: 'local' | 'session' | 'indexeddb'
}

export interface AiCallStepConfig {
  promptTemplate: string
  model?: string
  jsonMode?: boolean
  temperature?: number
  maxTokens?: number
}

export interface TransformStepConfig {
  input: string
  transformFn: string
  outputType?: 'string' | 'number' | 'boolean' | 'array' | 'object'
}

export interface ConditionalStepConfig {
  condition: string
  thenStep?: string // Reference to another step
  elseStep?: string // Reference to another step
  thenResult?: any
  elseResult?: any
}

export interface ToolCallStepConfig {
  toolId: string
  inputs: Record<string, string> // Values can use {{variable}} syntax
}

/**
 * Parser for declarative workflow definitions
 */
export class WorkflowSchemaParser {
  static parseYAML(yamlContent: string): DeclarativeWorkflow {
    try {
      // In a real implementation, we'd use a YAML parser like 'yaml'
      // For now, we'll simulate parsing and validate structure
      let parsed: any
      
      try {
        // Try to parse as JSON first (YAML is a superset of JSON)
        parsed = JSON.parse(yamlContent)
      } catch {
        // If JSON parsing fails, try to parse as YAML
        // For now, we'll use a simple regex-based YAML parser
        parsed = this.simpleYAMLParser(yamlContent)
      }
      
      return this.validateAndConvert(parsed)
    } catch (error) {
      throw new Error(`Failed to parse workflow YAML: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  static parseJSON(jsonContent: string): DeclarativeWorkflow {
    try {
      const parsed = JSON.parse(jsonContent)
      return this.validateAndConvert(parsed)
    } catch (error) {
      throw new Error(`Failed to parse workflow JSON: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  static convertToRuntimeWorkflow(declarative: DeclarativeWorkflow): Workflow {
    const steps: WorkflowStep[] = []
    
    for (const [stepId, stepDef] of Object.entries(declarative.steps)) {
      const step: WorkflowStep = {
        id: stepId,
        type: stepDef.type,
        config: stepDef.config,
        dependsOn: stepDef.dependsOn
      }
      steps.push(step)
    }

    return {
      id: this.generateWorkflowId(declarative.name),
      name: declarative.name,
      description: declarative.description,
      steps,
      context: declarative.inputs ? this.buildInitialContext(declarative.inputs) : {}
    }
  }

  private static validateAndConvert(parsed: any): DeclarativeWorkflow {
    // Basic validation
    if (!parsed.name) {
      throw new Error('Workflow must have a name')
    }
    if (!parsed.steps || typeof parsed.steps !== 'object') {
      throw new Error('Workflow must have steps object')
    }

    // Validate each step
    for (const [stepId, stepDef] of Object.entries(parsed.steps as Record<string, any>)) {
      this.validateStep(stepId, stepDef)
    }

    // Set defaults
    return {
      version: parsed.version || '1.0',
      name: parsed.name,
      description: parsed.description || '',
      metadata: parsed.metadata,
      inputs: parsed.inputs,
      steps: parsed.steps,
      outputs: parsed.outputs
    }
  }

  private static validateStep(stepId: string, stepDef: any): void {
    if (!stepDef.type) {
      throw new Error(`Step ${stepId} must have a type`)
    }

    const validTypes = ['web-api', 'file-op', 'ai-call', 'transform', 'conditional', 'tool-call']
    if (!validTypes.includes(stepDef.type)) {
      throw new Error(`Step ${stepId} has invalid type: ${stepDef.type}. Must be one of: ${validTypes.join(', ')}`)
    }

    if (!stepDef.config) {
      throw new Error(`Step ${stepId} must have config`)
    }

    // Type-specific validation
    switch (stepDef.type) {
      case 'web-api':
        if (!stepDef.config.url) {
          throw new Error(`Step ${stepId} (web-api) must have url in config`)
        }
        break
      case 'file-op':
        if (!stepDef.config.operation) {
          throw new Error(`Step ${stepId} (file-op) must have operation in config`)
        }
        break
      case 'ai-call':
        if (!stepDef.config.promptTemplate) {
          throw new Error(`Step ${stepId} (ai-call) must have promptTemplate in config`)
        }
        break
      case 'transform':
        if (!stepDef.config.input || !stepDef.config.transformFn) {
          throw new Error(`Step ${stepId} (transform) must have input and transformFn in config`)
        }
        break
      case 'conditional':
        if (!stepDef.config.condition) {
          throw new Error(`Step ${stepId} (conditional) must have condition in config`)
        }
        break
      case 'tool-call':
        if (!stepDef.config.toolId || !stepDef.config.inputs) {
          throw new Error(`Step ${stepId} (tool-call) must have toolId and inputs in config`)
        }
        break
    }
  }

  private static simpleYAMLParser(yamlContent: string): any {
    // Simple YAML parser for basic structures
    // In production, use a proper YAML library
    const lines = yamlContent.split('\n')
    const result: any = {}
    let currentKey = ''
    let currentObj: any = null
    let objStack: any[] = []

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue

      if (trimmed.endsWith(':')) {
        const key = trimmed.slice(0, -1).trim()
        if (!currentObj) {
          currentKey = key
          currentObj = {}
          result[currentKey] = currentObj
        } else {
          // Nested object
          const newObj = {}
          currentObj[key] = newObj
          objStack.push(currentObj)
          currentObj = newObj
        }
      } else if (trimmed.includes(':')) {
        const [key, ...valueParts] = trimmed.split(':')
        const value = valueParts.join(':').trim()
        if (currentObj) {
          currentObj[key.trim()] = this.parseYAMLValue(value)
        } else {
          result[key.trim()] = this.parseYAMLValue(value)
        }
      } else if (trimmed.startsWith('- ')) {
        // Array item
        if (!currentObj) {
          throw new Error('Arrays must be in objects in this simple parser')
        }
        // This is a simplified array handling
      }
    }

    return result
  }

  private static parseYAMLValue(value: string): any {
    if (value === 'true') return true
    if (value === 'false') return false
    if (value === 'null') return null
    if (!isNaN(Number(value))) return Number(value)
    if (value.startsWith('"') && value.endsWith('"')) return value.slice(1, -1)
    if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1)
    return value
  }

  private static generateWorkflowId(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now()
  }

  private static buildInitialContext(inputs: DeclarativeWorkflow['inputs']): Record<string, any> {
    const context: Record<string, any> = {}
    
    if (inputs) {
      for (const [key, inputDef] of Object.entries(inputs)) {
        if (inputDef.default !== undefined) {
          context[key] = inputDef.default
        }
      }
    }
    
    return context
  }

  /**
   * Generate a YAML template for a new workflow
   */
  static generateTemplate(): string {
    return `version: '1.0'
name: 'My Workflow'
description: 'A declarative workflow definition'

metadata:
  author: 'Your Name'
  tags: ['example', 'template']
  timeout: 30000
  retryPolicy: 'exponential'

inputs:
  input1:
    type: 'string'
    required: true
    description: 'Example input parameter'

steps:
  step1:
    type: 'web-api'
    description: 'Call an external API'
    config:
      url: 'https://api.example.com/data'
      method: 'GET'
      headers:
        Authorization: 'Bearer {{apiKey}}'

  step2:
    type: 'transform'
    dependsOn: ['step1']
    config:
      input: '{{step1}}'
      transformFn: 'return input.data.map(item => item.name)'

  step3:
    type: 'ai-call'
    dependsOn: ['step2']
    config:
      promptTemplate: 'Process these items: {{step2}}'
      model: 'gpt-4o'
      jsonMode: true

outputs:
  finalResult: 'step3'
  processedData: 'step2'
`
  }
}