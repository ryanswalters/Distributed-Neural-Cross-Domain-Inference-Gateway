import { Tool } from '@/types/tool'
import { telemetry } from './runtime-telemetry'

/**
 * Sandboxed Execution Environment
 * Provides isolated execution contexts for tools to prevent crashes and security issues
 */
export interface SandboxConfig {
  timeout: number // Maximum execution time in milliseconds
  memoryLimit?: number // Memory limit in MB (browser only)
  allowNetwork: boolean // Whether to allow network requests
  allowFileSystem: boolean // Whether to allow file system access
  allowEval: boolean // Whether to allow eval/Function constructors
  allowedDomains?: string[] // Whitelist of allowed domains for network requests
}

export interface SandboxResult {
  success: boolean
  result?: any
  error?: string
  executionTime: number
  memoryUsed?: number
  logs: string[]
}

export interface SandboxMessage {
  type: 'execute' | 'result' | 'error' | 'log' | 'heartbeat'
  id: string
  payload?: any
}

/**
 * Base Sandbox Executor Interface
 */
export abstract class SandboxExecutor {
  protected config: SandboxConfig

  constructor(config: Partial<SandboxConfig> = {}) {
    this.config = {
      timeout: 30000, // 30 seconds default
      allowNetwork: false,
      allowFileSystem: false,
      allowEval: false,
      ...config
    }
  }

  abstract execute(tool: Tool, inputs: Record<string, any>): Promise<SandboxResult>
  abstract terminate(): Promise<void>
  abstract isHealthy(): boolean

  protected validateTool(tool: Tool): void {
    if (!tool.generatedCode && !tool.endpoint) {
      throw new Error('Tool must have either generated code or endpoint')
    }

    if (tool.isAiGenerated && tool.generatedCode) {
      if (!this.config.allowEval) {
        throw new Error('Tool requires eval execution but sandbox does not allow it')
      }
    }

    if (tool.endpoint && !this.config.allowNetwork) {
      throw new Error('Tool requires network access but sandbox does not allow it')
    }
  }
}

/**
 * Web Worker Sandbox Executor
 * Runs tool execution in a separate Web Worker for complete isolation
 */
export class WebWorkerSandbox extends SandboxExecutor {
  private worker: Worker | null = null
  private activeExecutions: Map<string, { resolve: Function; reject: Function; startTime: number }> = new Map()
  private workerReady = false
  private healthCheckInterval: NodeJS.Timeout | null = null

  constructor(config: Partial<SandboxConfig> = {}) {
    super(config)
    this.initializeWorker()
  }

  private initializeWorker(): void {
    try {
      // Create a blob URL for the worker code
      const workerCode = this.getWorkerCode()
      const blob = new Blob([workerCode], { type: 'application/javascript' })
      const workerUrl = URL.createObjectURL(blob)
      
      this.worker = new Worker(workerUrl)
      this.setupWorkerListeners()
      
      // Start health checks
      this.startHealthChecks()
      
      console.log('[WebWorkerSandbox] Worker initialized successfully')
    } catch (error) {
      console.error('[WebWorkerSandbox] Failed to initialize worker:', error)
      throw new Error('Web Worker sandbox initialization failed')
    }
  }

  private getWorkerCode(): string {
    return `
      const sandboxConfig = ${JSON.stringify(this.config)};
      let executionContext = {};

      self.addEventListener('message', async (event) => {
        const { type, id, payload } = event.data;

        try {
          switch (type) {
            case 'execute':
              await handleExecute(id, payload);
              break;
            case 'terminate':
              self.close();
              break;
            case 'ping':
              self.postMessage({ type: 'pong', id });
              break;
          }
        } catch (error) {
          self.postMessage({
            type: 'error',
            id,
            payload: {
              error: error.message,
              stack: error.stack
            }
          });
        }
      });

      async function handleExecute(id, { tool, inputs }) {
        const startTime = Date.now();
        const logs = [];

        // Setup console redirection
        const originalConsole = {
          log: console.log,
          error: console.error,
          warn: console.warn,
          info: console.info
        };

        const sandboxConsole = {
          log: (...args) => {
            logs.push('[LOG] ' + args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' '));
          },
          error: (...args) => {
            logs.push('[ERROR] ' + args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' '));
          },
          warn: (...args) => {
            logs.push('[WARN] ' + args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' '));
          },
          info: (...args) => {
            logs.push('[INFO] ' + args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' '));
          }
        };

        // Redirect console to capture logs
        console.log = sandboxConsole.log;
        console.error = sandboxConsole.error;
        console.warn = sandboxConsole.warn;
        console.info = sandboxConsole.info;

        try {
          let result;

          if (tool.isAiGenerated && tool.generatedCode) {
            // Execute generated code in sandbox
            const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
            const handler = new AsyncFunction('params', 'context', 'console', tool.generatedCode);
            
            result = await handler(inputs, {
              sessionId: \`worker-\${id}\`,
              toolId: tool.id,
              log: (msg) => logs.push(\`[TOOL] \${msg}\`)
            }, sandboxConsole);
          } else if (tool.endpoint && sandboxConfig.allowNetwork) {
            // Execute endpoint call
            const headers = {
              'Content-Type': 'application/json'
            };

            if (tool.apiKey) {
              headers['Authorization'] = \`Bearer \${tool.apiKey}\`;
            }

            const response = await fetch(tool.endpoint, {
              method: 'POST',
              headers,
              body: JSON.stringify(inputs)
            });

            if (!response.ok) {
              throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
            }

            result = await response.json();
          } else {
            throw new Error('No valid execution method available');
          }

          const executionTime = Date.now() - startTime;

          self.postMessage({
            type: 'result',
            id,
            payload: {
              success: true,
              result,
              executionTime,
              logs
            }
          });

        } catch (error) {
          const executionTime = Date.now() - startTime;
          
          self.postMessage({
            type: 'result',
            id,
            payload: {
              success: false,
              error: error.message,
              executionTime,
              logs
            }
          });
        } finally {
          // Restore original console
          console.log = originalConsole.log;
          console.error = originalConsole.error;
          console.warn = originalConsole.warn;
          console.info = originalConsole.info;
        }
      }

      // Signal that worker is ready
      self.postMessage({ type: 'ready' });
    `
  }

  private setupWorkerListeners(): void {
    if (!this.worker) return

    this.worker.onmessage = (event) => {
      const { type, id, payload } = event.data

      switch (type) {
        case 'ready':
          this.workerReady = true
          console.log('[WebWorkerSandbox] Worker reported ready')
          break

        case 'result':
          this.handleExecutionResult(id, payload)
          break

        case 'error':
          this.handleExecutionError(id, payload)
          break

        case 'pong':
          // Health check response - worker is alive
          break
      }
    }

    this.worker.onerror = (error) => {
      console.error('[WebWorkerSandbox] Worker error:', error)
      this.workerReady = false
      
      // Reject all active executions
      for (const [executionId, { reject }] of this.activeExecutions) {
        reject(new Error('Worker crashed during execution'))
        this.activeExecutions.delete(executionId)
      }
    }
  }

  private handleExecutionResult(id: string, payload: any): void {
    const execution = this.activeExecutions.get(id)
    if (!execution) return

    const { resolve } = execution
    this.activeExecutions.delete(id)

    resolve(payload)
  }

  private handleExecutionError(id: string, payload: any): void {
    const execution = this.activeExecutions.get(id)
    if (!execution) return

    const { reject } = execution
    this.activeExecutions.delete(id)

    reject(new Error(payload.error || 'Unknown worker error'))
  }

  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(() => {
      if (this.worker && this.workerReady) {
        this.worker.postMessage({ type: 'ping', id: 'health-check' })
      }
    }, 10000) // Check every 10 seconds
  }

  async execute(tool: Tool, inputs: Record<string, any>): Promise<SandboxResult> {
    if (!this.worker || !this.workerReady) {
      throw new Error('Sandbox worker is not ready')
    }

    this.validateTool(tool)

    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const startTime = Date.now()

    return new Promise((resolve, reject) => {
      // Set timeout
      const timeoutId = setTimeout(() => {
        this.activeExecutions.delete(executionId)
        reject(new Error(`Execution timeout after ${this.config.timeout}ms`))
      }, this.config.timeout)

      // Store execution context
      this.activeExecutions.set(executionId, {
        resolve: (result: SandboxResult) => {
          clearTimeout(timeoutId)
          resolve(result)
        },
        reject: (error: Error) => {
          clearTimeout(timeoutId)
          reject(error)
        },
        startTime
      })

      // Send execution command to worker
      this.worker!.postMessage({
        type: 'execute',
        id: executionId,
        payload: { tool, inputs }
      })
    })
  }

  async terminate(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }

    if (this.worker) {
      // Reject all active executions
      for (const [executionId, { reject }] of this.activeExecutions) {
        reject(new Error('Sandbox terminated during execution'))
      }
      this.activeExecutions.clear()

      // Terminate worker
      this.worker.postMessage({ type: 'terminate' })
      this.worker.terminate()
      this.worker = null
      this.workerReady = false
    }
  }

  isHealthy(): boolean {
    return this.workerReady && this.worker !== null
  }
}

/**
 * IFrame Sandbox Executor (Alternative isolation method)
 * Uses iframe for DOM isolation when needed
 */
export class IFrameSandbox extends SandboxExecutor {
  private iframe: HTMLIFrameElement | null = null
  private messageHandlers: Map<string, Function> = new Map()

  constructor(config: Partial<SandboxConfig> = {}) {
    super({ ...config, allowEval: true }) // IFrame allows eval by nature
    this.initializeIFrame()
  }

  private initializeIFrame(): void {
    this.iframe = document.createElement('iframe')
    this.iframe.style.display = 'none'
    this.iframe.sandbox.add('allow-scripts') // Minimal permissions
    document.body.appendChild(this.iframe)

    // Setup message listener
    window.addEventListener('message', this.handleMessage.bind(this))

    console.log('[IFrameSandbox] IFrame initialized successfully')
  }

  private handleMessage(event: MessageEvent): void {
    if (event.source !== this.iframe?.contentWindow) return

    const { type, id, payload } = event.data
    const handler = this.messageHandlers.get(id)

    if (handler) {
      handler(payload)
      this.messageHandlers.delete(id)
    }
  }

  async execute(tool: Tool, inputs: Record<string, any>): Promise<SandboxResult> {
    if (!this.iframe) {
      throw new Error('IFrame sandbox is not initialized')
    }

    this.validateTool(tool)

    const executionId = `iframe-exec-${Date.now()}`
    const startTime = Date.now()

    return new Promise((resolve, reject) => {
      // Set timeout
      const timeoutId = setTimeout(() => {
        this.messageHandlers.delete(executionId)
        reject(new Error(`Execution timeout after ${this.config.timeout}ms`))
      }, this.config.timeout)

      // Store handler
      this.messageHandlers.set(executionId, (result: SandboxResult) => {
        clearTimeout(timeoutId)
        resolve(result)
      })

      // Send execution command to iframe
      this.iframe!.contentWindow!.postMessage({
        type: 'execute',
        id: executionId,
        payload: { tool, inputs }
      }, '*')
    })
  }

  async terminate(): Promise<void> {
    if (this.iframe) {
      this.iframe.remove()
      this.iframe = null
      this.messageHandlers.clear()
    }
  }

  isHealthy(): boolean {
    return this.iframe !== null
  }
}

/**
 * Process-based Sandbox (Node.js/Server-side)
 * For environments where Web Workers aren't available
 */
export class ProcessSandbox extends SandboxExecutor {
  private childProcess: any = null
  private isNode = typeof process !== 'undefined' && process.versions?.node

  constructor(config: Partial<SandboxConfig> = {}) {
    super(config)
    
    if (!this.isNode) {
      throw new Error('ProcessSandbox is only available in Node.js environments')
    }
  }

  async execute(tool: Tool, inputs: Record<string, any>): Promise<SandboxResult> {
    this.validateTool(tool)

    // In a real implementation, this would spawn a child process
    // For now, we'll simulate the behavior
    const startTime = Date.now()
    const logs: string[] = []

    try {
      let result

      if (tool.isAiGenerated && tool.generatedCode) {
        // Execute in isolated context (simulated)
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor
        const handler = new AsyncFunction('params', 'context', 'console', tool.generatedCode)
        
        // Redirect console to capture logs
        const originalConsoleLog = console.log
        console.log = (...args) => {
          logs.push('[LOG] ' + args.join(' '))
          originalConsoleLog.apply(console, args)
        }

        try {
          result = await handler(inputs, {
            sessionId: `process-${Date.now()}`,
            toolId: tool.id,
            log: (msg: string) => logs.push(`[TOOL] ${msg}`)
          }, console)
        } finally {
          console.log = originalConsoleLog
        }
      } else if (tool.endpoint) {
        // Execute endpoint call
        const response = await fetch(tool.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(tool.apiKey && { Authorization: `Bearer ${tool.apiKey}` })
          },
          body: JSON.stringify(inputs)
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        result = await response.json()
      } else {
        throw new Error('No valid execution method available')
      }

      const executionTime = Date.now() - startTime

      return {
        success: true,
        result,
        executionTime,
        logs
      }
    } catch (error) {
      const executionTime = Date.now() - startTime

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime,
        logs
      }
    }
  }

  async terminate(): Promise<void> {
    // Clean up any child processes
    if (this.childProcess) {
      // In real implementation, kill child process
      this.childProcess = null
    }
  }

  isHealthy(): boolean {
    return this.isNode
  }
}

/**
 * Sandbox Manager - Orchestrates multiple sandbox types
 */
export class SandboxManager {
  private sandboxes: Map<string, SandboxExecutor> = new Map()
  private defaultSandboxType: 'worker' | 'iframe' | 'process' = 'worker'

  constructor() {
    this.initializeDefaultSandbox()
  }

  private initializeDefaultSandbox(): void {
    try {
      if (typeof Worker !== 'undefined') {
        this.defaultSandboxType = 'worker'
        this.sandboxes.set('default', new WebWorkerSandbox({
          timeout: 30000,
          allowNetwork: true,
          allowFileSystem: false,
          allowEval: true
        }))
      } else if (typeof document !== 'undefined') {
        this.defaultSandboxType = 'iframe'
        this.sandboxes.set('default', new IFrameSandbox({
          timeout: 30000,
          allowNetwork: true
        }))
      } else {
        this.defaultSandboxType = 'process'
        this.sandboxes.set('default', new ProcessSandbox({
          timeout: 30000,
          allowNetwork: true
        }))
      }

      console.log(`[SandboxManager] Initialized default sandbox: ${this.defaultSandboxType}`)
    } catch (error) {
      console.error('[SandboxManager] Failed to initialize default sandbox:', error)
    }
  }

  async executeTool(tool: Tool, inputs: Record<string, any>, sandboxId: string = 'default'): Promise<SandboxResult> {
    const sandbox = this.sandboxes.get(sandboxId)
    if (!sandbox) {
      throw new Error(`Sandbox ${sandboxId} not found`)
    }

    if (!sandbox.isHealthy()) {
      throw new Error(`Sandbox ${sandboxId} is not healthy`)
    }

    const startTime = Date.now()
    
    try {
      console.groupCollapsed(`[SandboxManager] Executing tool in sandbox: ${tool.name}`)
      console.log(`[DIAGNOSTIC] Sandbox: ${sandboxId}, Tool: ${tool.id}`)

      const result = await sandbox.execute(tool, inputs)
      const totalTime = Date.now() - startTime

      // Record telemetry
      telemetry.recordEvent({
        type: 'sandbox_execution',
        sessionId: `sandbox-${sandboxId}-${Date.now()}`,
        toolId: tool.id,
        duration: totalTime,
        success: result.success,
        error: result.error,
        metadata: {
          sandboxType: sandbox.constructor.name,
          executionTime: result.executionTime,
          logCount: result.logs.length
        }
      })

      console.table({
        success: result.success,
        executionTime: result.executionTime,
        totalTime,
        logCount: result.logs.length,
        sandbox: sandboxId
      })

      if (result.logs.length > 0) {
        console.log('[SandboxManager] Execution logs:')
        result.logs.forEach(log => console.log('  ' + log))
      }

      console.groupEnd()

      return result
    } catch (error) {
      const totalTime = Date.now() - startTime

      // Record failure telemetry
      telemetry.recordEvent({
        type: 'sandbox_execution',
        sessionId: `sandbox-${sandboxId}-${Date.now()}`,
        toolId: tool.id,
        duration: totalTime,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          sandboxType: sandbox.constructor.name
        }
      })

      console.error('[SandboxManager] Sandbox execution failed:', error)
      console.groupEnd()

      throw error
    }
  }

  createSandbox(sandboxId: string, type: 'worker' | 'iframe' | 'process', config: Partial<SandboxConfig> = {}): void {
    let sandbox: SandboxExecutor

    switch (type) {
      case 'worker':
        sandbox = new WebWorkerSandbox(config)
        break
      case 'iframe':
        sandbox = new IFrameSandbox(config)
        break
      case 'process':
        sandbox = new ProcessSandbox(config)
        break
      default:
        throw new Error(`Unknown sandbox type: ${type}`)
    }

    this.sandboxes.set(sandboxId, sandbox)
    console.log(`[SandboxManager] Created sandbox ${sandboxId} of type ${type}`)
  }

  async terminateSandbox(sandboxId: string): Promise<void> {
    const sandbox = this.sandboxes.get(sandboxId)
    if (sandbox) {
      await sandbox.terminate()
      this.sandboxes.delete(sandboxId)
      console.log(`[SandboxManager] Terminated sandbox ${sandboxId}`)
    }
  }

  getSandboxHealth(sandboxId: string): boolean {
    const sandbox = this.sandboxes.get(sandboxId)
    return sandbox ? sandbox.isHealthy() : false
  }

  getAllSandboxes(): { id: string; type: string; healthy: boolean }[] {
    return Array.from(this.sandboxes.entries()).map(([id, sandbox]) => ({
      id,
      type: sandbox.constructor.name,
      healthy: sandbox.isHealthy()
    }))
  }

  async terminateAll(): Promise<void> {
    const terminationPromises = Array.from(this.sandboxes.keys()).map(id => 
      this.terminateSandbox(id)
    )
    await Promise.all(terminationPromises)
    console.log('[SandboxManager] All sandboxes terminated')
  }
}

// Export singleton instance
export const sandboxManager = new SandboxManager()