import { useState } from 'react'
import { runtime } from '@/lib/middleware-runtime'
import { toast } from 'sonner'


export function useRuntime() {
    const [executing, setExecuting] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    const executeTool = async (toolId: string, inputs: Record<string, any>) => {
    setExecuting(true)
    setError(null)
    setResult(null)

    try {
        const output = await runtime.executeTool(toolId, inputs)
        setResult(output)
        return output
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Execution failed'
        setError(errorMsg)
        toast.error(errorMsg)
        throw err
    } finally {
        setExecuting(false)
    }
    }

    const executeWorkflow = async (workflowId: string, inputs: Record<string, any>) => {
    setExecuting(true)
    setError(null)
    setResult(null)

    try {
        const output = await runtime.executeWorkflow(workflowId, inputs)
        setResult(output)
        return output
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Workflow execution failed'
        setError(errorMsg)
        toast.error(errorMsg)
        throw err
    } finally {
        setExecuting(false)
    }
    }

    const clearResult = () => {
    setResult(null)
    setError(null)
    }

    return {
    executing,
    result,
    error,
    executeTool,
    executeWorkflow,
    clearResult
    }
}