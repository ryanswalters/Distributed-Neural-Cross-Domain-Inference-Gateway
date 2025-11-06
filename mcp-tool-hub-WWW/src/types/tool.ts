export type ToolStatus = 'enabled' | 'disabled' | 'needs-config'

export type ToolCategory = 'code' | 'data' | 'web' | 'productivity' | 'ai' | 'system' | 'other'

export interface Tool {
  id: string
  name: string
  description: string
  category: ToolCategory
  status: ToolStatus
  endpoint?: string
  apiKey?: string
  parameters?: Record<string, string>
  createdAt: number
  updatedAt: number
  tags?: string[]
  isFavorite?: boolean
  usageCount?: number
  lastUsedAt?: number
  isAiGenerated?: boolean
  generatedCode?: string
  generationPrompt?: string
  createdBy?: string
  createdByAvatar?: string
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

export interface ToolExportData {
  version: string
  exportedAt: number
  tools: Tool[]
}

export interface GeneratedToolSpec {
  name: string
  description: string
  category: ToolCategory
  endpoint: string
  parameters: Record<string, string>
  tags: string[]
  code: string
  testEndpoint?: string
}
