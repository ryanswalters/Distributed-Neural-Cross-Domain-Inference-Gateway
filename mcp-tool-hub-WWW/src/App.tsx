import { useState, useMemo, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Tool, ToolFormData, ToolCategory, ToolStatus, ToolExportData, GeneratedToolSpec } from '@/types/tool'
import { ToolCard } from '@/components/ToolCard'
import { ToolFormDialog } from '@/components/ToolFormDialog'
import { ToolDetailDialog } from '@/components/ToolDetailDialog'
import { EmptyState } from '@/components/EmptyState'
import { HowItWorks } from '@/components/HowItWorks'
import { MCPServerLibrary } from '@/components/MCPServerLibrary'
import { UsageAnalytics } from '@/components/UsageAnalytics'
import { AIToolGenerator } from '@/components/AIToolGenerator'
import { NeedDetector } from '@/components/NeedDetector'
import { AIGeneratedToolView } from '@/components/AIGeneratedToolView'
import { WorkflowPage } from '@/components/WorkflowPage'
import { ToolExecutor } from '@/components/ToolExecutor'
import { AuthProvider, useAuth } from '@/components/AuthProvider'
import { AuthGuard } from '@/components/AuthGuard'
import { UserProfile } from '@/components/UserProfile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, MagnifyingGlass, X, Lightbulb, SquaresFour, Books, Star, ChartBar, Download, Upload, Sparkle, Lightning } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { runtime } from '@/lib/middleware-runtime'

function AppContent() {
  const { user } = useAuth()
  const [tools, setTools] = useKV<Tool[]>('mcp-tools', [])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | null>(null)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [editingTool, setEditingTool] = useState<Tool | undefined>(undefined)
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false)
  const [isAIViewOpen, setIsAIViewOpen] = useState(false)
  const [aiGeneratedPrompt, setAiGeneratedPrompt] = useState('')
  const [isToolExecutorOpen, setIsToolExecutorOpen] = useState(false)
  const [executorTool, setExecutorTool] = useState<Tool | null>(null)

  const categories: ToolCategory[] = ['code', 'data', 'web', 'productivity', 'ai', 'system', 'other']

  useEffect(() => {
    if (tools) {
      tools.forEach(tool => {
        runtime.registerTool(tool)
      })
    }
  }, [tools])

  const filteredTools = useMemo(() => {
    if (!tools) return []
    return tools.filter((tool) => {
      const matchesSearch =
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesCategory = !selectedCategory || tool.category === selectedCategory
      const matchesFavorite = !showFavoritesOnly || tool.isFavorite
      return matchesSearch && matchesCategory && matchesFavorite
    })
  }, [tools, searchQuery, selectedCategory, showFavoritesOnly])

  const handleAddTool = () => {
    setEditingTool(undefined)
    setIsFormOpen(true)
  }

  const handleEditTool = (tool: Tool) => {
    setEditingTool(tool)
    setIsFormOpen(true)
  }

  const handleSaveTool = (data: ToolFormData) => {
    const now = Date.now()

    let parameters: Record<string, string> | undefined
    if (data.parameters) {
      try {
        parameters = JSON.parse(data.parameters)
      } catch (e) {
        toast.error('Invalid JSON in parameters field')
        return
      }
    }

    if (editingTool) {
      setTools((currentTools) =>
        (currentTools || []).map((tool) =>
          tool.id === editingTool.id
            ? {
                ...tool,
                ...data,
                parameters,
                updatedAt: now,
                status: data.endpoint ? 'enabled' : 'needs-config',
              }
            : tool
        )
      )
      toast.success('Tool updated successfully')
    } else {
      const newTool: Tool = {
        id: `tool-${now}`,
        ...data,
        parameters,
        status: data.endpoint ? 'enabled' : 'needs-config',
        createdAt: now,
        updatedAt: now,
        usageCount: 0,
        createdBy: user?.login,
        createdByAvatar: user?.avatarUrl,
      }
      setTools((currentTools) => [...(currentTools || []), newTool])
      toast.success('Tool added successfully')
    }

    setIsFormOpen(false)
    setEditingTool(undefined)
  }

  const handleDeleteTool = (id: string) => {
    setTools((currentTools) => (currentTools || []).filter((tool) => tool.id !== id))
    toast.success('Tool deleted')
  }

  const handleToggleStatus = (id: string, status: ToolStatus) => {
    setTools((currentTools) =>
      (currentTools || []).map((tool) => (tool.id === id ? { ...tool, status, updatedAt: Date.now() } : tool))
    )
    toast.success(`Tool ${status === 'enabled' ? 'enabled' : 'disabled'}`)
  }

  const handleToggleFavorite = (id: string, isFavorite: boolean) => {
    setTools((currentTools) =>
      (currentTools || []).map((tool) => (tool.id === id ? { ...tool, isFavorite } : tool))
    )
    toast.success(isFavorite ? 'Added to favorites' : 'Removed from favorites')
  }

  const handleToolClick = (tool: Tool) => {
    setSelectedTool(tool)
    if (tool.isAiGenerated) {
      setIsAIViewOpen(true)
    } else {
      setIsDetailOpen(true)
    }
    
    setTools((currentTools) =>
      (currentTools || []).map((t) =>
        t.id === tool.id
          ? {
              ...t,
              usageCount: (t.usageCount || 0) + 1,
              lastUsedAt: Date.now(),
            }
          : t
      )
    )
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory(null)
    setShowFavoritesOnly(false)
  }

  const hasActiveFilters = searchQuery || selectedCategory || showFavoritesOnly

  const handleExportTools = () => {
    const exportData: ToolExportData = {
      version: '1.0',
      exportedAt: Date.now(),
      tools: tools || [],
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `mcp-tools-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Tools exported successfully')
  }

  const handleImportTools = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const importData: ToolExportData = JSON.parse(event.target?.result as string)
          
          if (!importData.tools || !Array.isArray(importData.tools)) {
            toast.error('Invalid import file format')
            return
          }

          setTools((currentTools) => {
            const existingIds = new Set((currentTools || []).map(t => t.id))
            const newTools = importData.tools.filter(t => !existingIds.has(t.id))
            return [...(currentTools || []), ...newTools]
          })

          toast.success(`Imported ${importData.tools.length} tool${importData.tools.length !== 1 ? 's' : ''}`)
        } catch (error) {
          toast.error('Failed to import tools')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const handleAIToolGenerated = (toolSpec: GeneratedToolSpec) => {
    const now = Date.now()
    const newTool: Tool = {
      id: `ai-tool-${now}`,
      name: toolSpec.name,
      description: toolSpec.description,
      category: toolSpec.category,
      endpoint: toolSpec.endpoint,
      parameters: toolSpec.parameters,
      tags: toolSpec.tags,
      status: 'enabled',
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
      isAiGenerated: true,
      generatedCode: toolSpec.code,
      generationPrompt: aiGeneratedPrompt,
      createdBy: user?.login,
      createdByAvatar: user?.avatarUrl,
    }

    setTools((currentTools) => [...(currentTools || []), newTool])
    toast.success('AI-generated tool deployed successfully!')
  }

  const handleOpenAIGenerator = (prompt?: string) => {
    if (prompt) {
      setAiGeneratedPrompt(prompt)
    }
    setIsAIGeneratorOpen(true)
  }

  const handleOpenExecutor = (tool: Tool) => {
    setExecutorTool(tool)
    setIsToolExecutorOpen(true)
  }

  const handleToolUpdated = (updatedTool: Tool) => {
    setTools((currentTools) =>
      (currentTools || []).map((tool) =>
        tool.id === updatedTool.id ? updatedTool : tool
      )
    )
    runtime.registerTool(updatedTool)
    toast.success('Tool updated successfully!')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-2">Local MCP & API Hub</h1>
              <p className="text-muted-foreground">
                Connect to MCP servers, manage tools, and test API integrations
              </p>
            </div>
            <UserProfile />
          </div>
        </header>

        <Tabs defaultValue="tools" className="w-full">
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <TabsList>
              <TabsTrigger value="tools" className="flex items-center gap-2">
                <SquaresFour size={18} weight="fill" />
                My Tools
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <ChartBar size={18} weight="fill" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="library" className="flex items-center gap-2">
                <Books size={18} weight="fill" />
                MCP Library
              </TabsTrigger>
              <TabsTrigger value="workflows" className="flex items-center gap-2">
                <Lightning size={18} weight="fill" />
                Workflows
              </TabsTrigger>
              <TabsTrigger value="guide" className="flex items-center gap-2">
                <Lightbulb size={18} weight="fill" />
                How It Works
              </TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportTools} className="flex items-center gap-2">
                <Download size={18} />
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Button variant="outline" onClick={handleImportTools} className="flex items-center gap-2">
                <Upload size={18} />
                <span className="hidden sm:inline">Import</span>
              </Button>
              <Button onClick={() => handleOpenAIGenerator()} className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                <Sparkle size={20} weight="fill" />
                <span className="hidden sm:inline">AI Generate</span>
              </Button>
              <Button onClick={handleAddTool} className="flex items-center gap-2">
                <Plus size={20} weight="bold" />
                <span className="hidden sm:inline">Add Tool</span>
              </Button>
            </div>
          </div>

          <TabsContent value="analytics">
            <UsageAnalytics tools={tools || []} />
          </TabsContent>

          <TabsContent value="library">
            <MCPServerLibrary onAddTool={handleSaveTool} />
          </TabsContent>

          <TabsContent value="workflows">
            <WorkflowPage tools={tools || []} />
          </TabsContent>

          <TabsContent value="guide">
            <HowItWorks />
          </TabsContent>

          <TabsContent value="tools" className="space-y-6">
            <NeedDetector 
              existingTools={tools?.map(t => t.name) || []}
              onGenerateTool={handleOpenAIGenerator}
            />

            <div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <MagnifyingGlass
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={18}
                  />
                  <Input
                    placeholder="Search tools..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant={showFavoritesOnly ? 'default' : 'outline'}
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className="flex items-center gap-2"
                >
                  <Star size={18} weight={showFavoritesOnly ? 'fill' : 'regular'} />
                  Favorites
                </Button>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
                    <X size={16} />
                    Clear Filters
                  </Button>
                )}
              </div>

              <div className="flex gap-2 mt-4 flex-wrap">
                {categories.map((category) => (
                  <Badge
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    className="cursor-pointer capitalize"
                    onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>

            {!tools || tools.length === 0 ? (
              <EmptyState onAddTool={handleAddTool} />
            ) : filteredTools.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No tools match your filters. Try adjusting your search or category.
                </p>
              </div>
            ) : (
              <motion.div
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <AnimatePresence mode="popLayout">
                  {filteredTools.map((tool) => (
                    <motion.div
                      key={tool.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ToolCard
                        tool={tool}
                        onEdit={handleEditTool}
                        onDelete={handleDeleteTool}
                        onClick={handleToolClick}
                        onExecute={tool.isAiGenerated ? () => handleOpenExecutor(tool) : undefined}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}

            <div className="mt-8 text-center text-sm text-muted-foreground">
              {tools && tools.length > 0 && (
                <p>
                  Showing {filteredTools.length} of {tools.length} tool{tools.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <ToolFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSaveTool}
        tool={editingTool}
      />

      <ToolDetailDialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        tool={selectedTool}
        onEdit={handleEditTool}
        onToggleStatus={handleToggleStatus}
        onToggleFavorite={handleToggleFavorite}
      />

      <AIToolGenerator
        open={isAIGeneratorOpen}
        onOpenChange={setIsAIGeneratorOpen}
        onToolGenerated={handleAIToolGenerated}
      />

      <AIGeneratedToolView
        open={isAIViewOpen}
        onOpenChange={setIsAIViewOpen}
        tool={selectedTool}
      />

      <ToolExecutor
        open={isToolExecutorOpen}
        onOpenChange={setIsToolExecutorOpen}
        tool={executorTool}
        onToolUpdated={handleToolUpdated}
      />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AuthGuard>
        <AppContent />
      </AuthGuard>
    </AuthProvider>
  )
}

export default App