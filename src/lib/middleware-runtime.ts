import { RuntimeExecutor } from './runtime-executor'

// Re-export all types for backward compatibility
export type { RuntimeContext, WorkflowStep, Workflow } from './runtime-core'

// Export the runtime instance
export const runtime = new RuntimeExecutor()

// Export the main class for direct usage if needed
export { RuntimeExecutor as MiddlewareRuntime }