export type ToolCategory = 'code' | 'data' | 'web' | 'productivity' | 'ai' |
'system' | 'other'

export type ToolStatus = 'enabled' | 'disabled' | 'needs-config'


export interface Tool {
    id: string
    name: string
    description: string
    category: ToolCategory
    status: ToolStatus
    endpoint?: string
    apiKey?: string
    parameters?: Record<string, any>
    tags?: string[]
    isFavorite?: boolean
    isAiGenerated?: boolean
    generatedCode?: string
    generationPrompt?: string
    createdAt: number
    createdBy?: string
    createdByAvatar?: string
    usageCount?: number
    lastUsedAt?: number
}


export interface ToolFormData {
    name: string
    description: string
    category: ToolCategory
    endpoint?: string
    apiKey?: string
    parameters?: string
    tags?: string[]
    isFavorite?: boolean
}


export interface GeneratedToolSpec {
    name: string
    description: string
    category: ToolCategory
    endpoint?: string
    parameters?: Record<string, any>
    tags?: string[]
    code: string
    testEndpoint?: string
}