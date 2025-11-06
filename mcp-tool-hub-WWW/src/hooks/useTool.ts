
import { useState, useEffect } from 'react'
import { Tool, ToolFormData } from '@/types/tool'
import { storage } from '@/lib/storage'
import { runtime } from '@/lib/middleware-runtime'
import { toast } from 'sonner'


export function useTools() {
    const [tools, setTools] = useState<Tool[]>([])
    const [loading, setLoading] = useState(true)

    const loadTools = async () => {
    try {
        const data = await storage.getTools()
        setTools(data)
        // Auto-register all tools in runtime
        data.forEach(tool => runtime.registerTool(tool))
    } catch (error) {
        console.error('Failed to load tools:', error)
        toast.error('Failed to load tools')
    } finally {
        setLoading(false)
    }
    }

    useEffect(() => {
    loadTools()
    }, [])

    const addTool = async (formData: ToolFormData) => {
    try {
        const newTool: Tool = {
        id: `tool-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        status: formData.endpoint ? 'enabled' : 'needs-config',
        endpoint: formData.endpoint,
        apiKey: formData.apiKey,
        parameters: formData.parameters ? JSON.parse(formData.parameters) : undefined,
        tags: formData.tags || [],
        isFavorite: formData.isFavorite || false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0
        }

        await storage.saveTool(newTool)
        runtime.registerTool(newTool)
        setTools(prev => [...prev, newTool])
        toast.success('Tool added successfully')
        return newTool
    } catch (error) {
        console.error('Failed to add tool:', error)
        toast.error('Failed to add tool')
        throw error
    }
    }

    const updateTool = async (id: string, formData: ToolFormData) => {
    try {
        const existing = tools.find(t => t.id === id)
        if (!existing) throw new Error('Tool not found')

        const updated: Tool = {
        ...existing,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        endpoint: formData.endpoint,
        apiKey: formData.apiKey,
        parameters: formData.parameters ? JSON.parse(formData.parameters) : undefined,
        tags: formData.tags || [],
        isFavorite: formData.isFavorite || false,
        updatedAt: Date.now()
        }

        await storage.saveTool(updated)
        runtime.registerTool(updated)
        setTools(prev => prev.map(t => t.id === id ? updated : t))
        toast.success('Tool updated successfully')
        return updated
    } catch (error) {
        console.error('Failed to update tool:', error)
        toast.error('Failed to update tool')
        throw error
    }
    }

    const deleteTool = async (id: string) => {
    try {
        await storage.deleteTool(id)
        runtime.unregisterTool(id)
        setTools(prev => prev.filter(t => t.id !== id))
        toast.success('Tool deleted successfully')
    } catch (error) {
        console.error('Failed to delete tool:', error)
        toast.error('Failed to delete tool')
        throw error
    }
    }

    const addGeneratedTool = async (spec: any, prompt: string) => {
    try {
        const user = await window.spark.user().catch(() => null)

        const newTool: Tool = {
        id: `tool-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: spec.name,
        description: spec.description,
        category: spec.category,
        status: 'enabled',
        endpoint: spec.endpoint,
        parameters: spec.parameters,
        tags: spec.tags || [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        isAiGenerated: true,
        generatedCode: spec.code,
        generationPrompt: prompt,
        createdBy: user?.login,
        createdByAvatar: user?.avatar_url
        }

        await storage.saveTool(newTool)
        runtime.registerTool(newTool)
        setTools(prev => [...prev, newTool])
        toast.success('AI-generated tool deployed successfully')
        return newTool
    } catch (error) {
        console.error('Failed to add generated tool:', error)
        toast.error('Failed to deploy tool')
        throw error
    }
    }

    const replaceToolAfterRefactor = async (updatedTool: Tool) => {
    try {
        await storage.saveTool(updatedTool)
        runtime.registerTool(updatedTool)
        setTools(prev => prev.map(t => t.id === updatedTool.id ? updatedTool : t))
        toast.success('Tool refactored successfully')
    } catch (error) {
        console.error('Failed to update refactored tool:', error)
        toast.error('Failed to save refactored tool')
        throw error
    }
    }

    const incrementUsage = async (id: string) => {
    const tool = tools.find(t => t.id === id)
    if (!tool) return

    const updated = {
        ...tool,
        usageCount: (tool.usageCount || 0) + 1,
        lastUsedAt: Date.now()
    }

    await storage.saveTool(updated)
    setTools(prev => prev.map(t => t.id === id ? updated : t))
    }

    return {
    tools,
    loading,
    addTool,
    updateTool,
    deleteTool,
    addGeneratedTool,
    replaceToolAfterRefactor,
    incrementUsage,
    reload: loadTools
    }
}