
import { useState, useEffect } from 'react'
import { Workflow } from '@/lib/middleware-runtime'
import { storage } from '@/lib/storage'
import { runtime } from '@/lib/middleware-runtime'
import { toast } from 'sonner'

export function useWorkflows() {
    const [workflows, setWorkflows] = useState<Workflow[]>([])
    const [loading, setLoading] = useState(true)

    const loadWorkflows = async () => {
    try {
        const data = await storage.getWorkflows()
        setWorkflows(data)
        // Auto-register all workflows in runtime
        data.forEach(workflow => runtime.registerWorkflow(workflow))
    } catch (error) {
        console.error('Failed to load workflows:', error)
        toast.error('Failed to load workflows')
    } finally {
        setLoading(false)
    }
    }

    useEffect(() => {
    loadWorkflows()
    }, [])

    const addWorkflow = async (workflow: Workflow) => {
    try {
        await storage.saveWorkflow(workflow)
        runtime.registerWorkflow(workflow)
        setWorkflows(prev => [...prev, workflow])
        toast.success('Workflow saved successfully')
        return workflow
    } catch (error) {
        console.error('Failed to save workflow:', error)
        toast.error('Failed to save workflow')
        throw error
    }
    }

    const updateWorkflow = async (id: string, updates: Partial<Workflow>) => {
    try {
        const existing = workflows.find(w => w.id === id)
        if (!existing) throw new Error('Workflow not found')

        const updated = { ...existing, ...updates }
        await storage.saveWorkflow(updated)
        runtime.registerWorkflow(updated)
        setWorkflows(prev => prev.map(w => w.id === id ? updated : w))
        toast.success('Workflow updated successfully')
        return updated
    } catch (error) {
        console.error('Failed to update workflow:', error)
        toast.error('Failed to update workflow')
        throw error
    }
    }

    const deleteWorkflow = async (id: string) => {
    try {
        await storage.deleteWorkflow(id)
        setWorkflows(prev => prev.filter(w => w.id !== id))
        toast.success('Workflow deleted successfully')
    } catch (error) {
        console.error('Failed to delete workflow:', error)
        toast.error('Failed to delete workflow')
        throw error
    }
    }

    return {
    workflows,
    loading,
    addWorkflow,
    updateWorkflow,
    deleteWorkflow,
    reload: loadWorkflows
    }
}