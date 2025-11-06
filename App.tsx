import { useState } from 'react'
import { Toaster } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ToolCard } from '@/components/ToolCard'
import { ToolFormDialog } from '@/components/ToolFormDialog'
import { ToolDetailDialog } from '@/components/ToolDetailDialog'
import { ToolExecutor } from '@/components/ToolExecutor'
import { AIToolGenerator } from '@/components/AIToolGenerator'
import { MCPServerLibrary } from '@/components/MCPServerLibrary'
import { UsageAnalytics } from '@/components/UsageAnalytics'
import { NeedDetector } from '@/components/NeedDetector'
import { EmptyState } from '@/components/EmptyState'
import { WorkflowPage } from '@/components/WorkflowPage'
import { Tool, ToolFormData, ToolStatus, GeneratedToolSpec } from '@/types/tool'
import { Plus, Sparkle, Cube, ChartLine, GitBranch, Gear } from '@phosphor-icons/react'


function App() {
    const [tools, setTools] = useState<Tool[]>([])
    const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
    const [editingTool, setEditingTool] = useState<Tool | null>(null)
    const [executingTool, setExecutingTool] = useState<Tool | null>(null)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [isExecutorOpen, setIsExecutorOpen] = useState(false)
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false)
    const [activeTab, setActiveTab] = useState('tools')

    const handleSaveTool = (data: ToolFormData) => {
    if (editingTool) {
        setTools(tools.map(t => 
        t.id === editingTool.id 
            ? { ...t, ...data, parameters: data.parameters ? JSON.parse(data.parameters) : {} }
            : t
        ))
    } else {
        const newTool: Tool = {
        id: `tool-${Date.now()}`,
        ...data,
        parameters: data.parameters ? JSON.parse(data.parameters) : {},
        status: 'enabled',
        createdAt: Date.now(),
        usageCount: 0,
        }
        setTools([...tools, newTool])
    }
    setEditingTool(null)
    }

    const handleGeneratedTool = (spec: GeneratedToolSpec) => {
    const newTool: Tool = {
        id: `ai-tool-${Date.now()}`,
        name: spec.name,
        description: spec.description,
        category: spec.category,
        endpoint: spec.endpoint || '',
        parameters: spec.parameters || {},
        tags: spec.tags || [],
        status: 'enabled',
        isAiGenerated: true,
        generatedCode: spec.code,
        generationPrompt: spec.testEndpoint || '',
        createdAt: Date.now(),
        usageCount: 0,
    }
    setTools([...tools, newTool])
    }

    const handleDeleteTool = (id: string) => {
    setTools(tools.filter(t => t.id !== id))
    }

    const handleToggleStatus = (id: string, status: ToolStatus) => {
    setTools(tools.map(t => t.id === id ? { ...t, status } : t))
    }

    const handleToggleFavorite = (id: string, isFavorite: boolean) => {
    setTools(tools.map(t => t.id === id ? { ...t, isFavorite } : t))
    }

    const handleToolUpdated = (updatedTool: Tool) => {
    setTools(tools.map(t => t.id === updatedTool.id ? updatedTool : t))
    }

    const handleToolClick = (tool: Tool) => {
    setSelectedTool(tool)
    setIsDetailOpen(true)
    }

    const handleEditClick = (tool: Tool) => {
    setEditingTool(tool)
    setIsFormOpen(true)
    }

    const handleExecuteClick = (tool: Tool) => {
    setExecutingTool(tool)
    setIsExecutorOpen(true)
    }

    return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
        <Toaster position="top-right" />
        
        <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-8">
            <div className="flex items-center justify-between">
            <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Distributed Neural Cross-Domain Inference Gateway™
                </h1>
                <p className="text-muted-foreground mt-2">Powered by C.H.A.O.S.™ | ISO/IEC 42069-AI-9001 Certified</p>
            </div>
            <Badge variant="outline" className="text-sm">
                Gartner-Approved*
            </Badge>
            </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="tools" className="flex items-center gap-2">
                <Cube size={18} />
                Tools
            </TabsTrigger>
            <TabsTrigger value="workflows" className="flex items-center gap-2">
                <GitBranch size={18} />
                Workflows
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2">
                <Gear size={18} />
                MCP Library
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
                <ChartLine size={18} />
                Analytics
            </TabsTrigger>
            </TabsList>

            <TabsContent value="tools" className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                <h2 className="text-2xl font-semibold">Your Tools</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    {tools.length} tool{tools.length !== 1 ? 's' : ''} registered
                </p>
                </div>
                <div className="flex gap-2">
                <Button 
                    onClick={() => setIsGeneratorOpen(true)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                    <Sparkle size={18} weight="fill" className="mr-2" />
                    AI Generate
                </Button>
                <Button onClick={() => { setEditingTool(null); setIsFormOpen(true); }}>
                    <Plus size={18} weight="bold" className="mr-2" />
                    Add Tool
                </Button>
                </div>
            </div>

            {tools.length > 0 && (
                <NeedDetector 
                existingTools={tools.map(t => t.name)}
                onGenerateTool={(need) => {
                    console.log('Generate tool for:', need)
                    setIsGeneratorOpen(true)
                }}
                />
            )}

            {tools.length === 0 ? (
                <EmptyState onAddTool={() => setIsFormOpen(true)} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tools.map(tool => (
                    <ToolCard
                    key={tool.id}
                    tool={tool}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteTool}
                    onClick={handleToolClick}
                    onExecute={tool.isAiGenerated ? () => handleExecuteClick(tool) : undefined}
                    />
                ))}
                </div>
            )}
            </TabsContent>

            <TabsContent value="workflows">
            <WorkflowPage />
            </TabsContent>

            <TabsContent value="library">
            <MCPServerLibrary onAddServer={(server) => console.log('Add server:', server)} />
            </TabsContent>

            <TabsContent value="analytics">
            <UsageAnalytics tools={tools} />
            </TabsContent>
        </Tabs>
        </div>

        <ToolFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSaveTool}
        tool={editingTool || undefined}
        />

        <ToolDetailDialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        tool={selectedTool}
        onEdit={handleEditClick}
        onToggleStatus={handleToggleStatus}
        onToggleFavorite={handleToggleFavorite}
        />

        <ToolExecutor
        open={isExecutorOpen}
        onOpenChange={setIsExecutorOpen}
        tool={executingTool}
        onToolUpdated={handleToolUpdated}
        />

        <AIToolGenerator
        open={isGeneratorOpen}
        onOpenChange={setIsGeneratorOpen}
        onToolGenerated={handleGeneratedTool}
        />
    </div>
    )
}

export default App