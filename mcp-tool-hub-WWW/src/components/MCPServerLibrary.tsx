import { useState, useMemo, useEffect } from 'react'
import { MCPServerTemplate, HealthStatus } from '@/types/mcp-server'
import { mcpServerLibrary } from '@/lib/mcp-library'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  GithubLogo,
  MagnifyingGlass,
  Plus,
  Book,
  LockKey,
  Desktop,
  CheckCircle,
  Star,
  Users,
  Buildings,
  Warning,
  Copy,
  Calendar,
  Tag,
  ChartBar,
  CircleNotch,
  XCircle,
  Question,
  FirstAid,
} from '@phosphor-icons/react'
import { Tool, ToolFormData } from '@/types/tool'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface MCPServerLibraryProps {
  onAddTool: (data: ToolFormData) => void
}

const categoryIcons = {
  official: Star,
  community: Users,
  commercial: Buildings,
}

const categoryColors = {
  official: 'bg-blue-100 text-blue-700 border-blue-300',
  community: 'bg-green-100 text-green-700 border-green-300',
  commercial: 'bg-purple-100 text-purple-700 border-purple-300',
}

const difficultyColors = {
  beginner: 'bg-green-50 text-green-700 border-green-200',
  intermediate: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  advanced: 'bg-red-50 text-red-700 border-red-200',
}

export function MCPServerLibrary({ onAddTool }: MCPServerLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'official' | 'community' | 'commercial'>('all')
  const [selectedServer, setSelectedServer] = useState<MCPServerTemplate | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [serverHealthMap, setServerHealthMap] = useState<Map<string, { status: HealthStatus; responseTime?: number; checkedAt: number }>>(new Map())

  useEffect(() => {
    mcpServerLibrary.forEach(server => {
      if (server.endpoint && !server.localOnly) {
        checkServerHealth(server.id, server.endpoint)
      }
    })
  }, [])

  const checkServerHealth = async (serverId: string, endpoint: string) => {
    setServerHealthMap(prev => new Map(prev).set(serverId, { status: 'checking', checkedAt: Date.now() }))

    const startTime = performance.now()
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'MCP Health Check', version: '1.0.0' },
          },
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      const responseTime = Math.round(performance.now() - startTime)

      if (response.ok) {
        const data = await response.json()
        if (data.error) {
          setServerHealthMap(prev => new Map(prev).set(serverId, { status: 'unhealthy', responseTime, checkedAt: Date.now() }))
        } else {
          setServerHealthMap(prev => new Map(prev).set(serverId, { status: 'healthy', responseTime, checkedAt: Date.now() }))
        }
      } else {
        setServerHealthMap(prev => new Map(prev).set(serverId, { status: 'unhealthy', responseTime, checkedAt: Date.now() }))
      }
    } catch (error) {
      setServerHealthMap(prev => new Map(prev).set(serverId, { status: 'unhealthy', checkedAt: Date.now() }))
    }
  }

  const getHealthIndicator = (serverId: string) => {
    const health = serverHealthMap.get(serverId)
    if (!health) return { icon: Question, color: 'text-muted-foreground', label: 'Unknown' }

    switch (health.status) {
      case 'healthy':
        return { icon: CheckCircle, color: 'text-green-600', label: 'Healthy', responseTime: health.responseTime }
      case 'unhealthy':
        return { icon: XCircle, color: 'text-red-600', label: 'Unhealthy', responseTime: health.responseTime }
      case 'checking':
        return { icon: CircleNotch, color: 'text-blue-600', label: 'Checking...', spin: true }
      default:
        return { icon: Question, color: 'text-muted-foreground', label: 'Unknown' }
    }
  }

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    mcpServerLibrary.forEach((server) => {
      server.tags?.forEach((tag) => tags.add(tag))
    })
    return Array.from(tags).sort()
  }, [])

  const filteredServers = useMemo(() => {
    return mcpServerLibrary.filter((server) => {
      const matchesSearch =
        server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        server.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        server.features.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase())) ||
        server.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesCategory = selectedCategory === 'all' || server.category === selectedCategory

      const matchesTags = selectedTags.length === 0 || selectedTags.some((tag) => server.tags?.includes(tag))

      return matchesSearch && matchesCategory && matchesTags
    })
  }, [searchQuery, selectedCategory, selectedTags])

  const handleServerClick = (server: MCPServerTemplate) => {
    setSelectedServer(server)
    setIsDetailDialogOpen(true)
  }

  const handleAddServer = () => {
    if (!selectedServer) return

    const toolData: ToolFormData = {
      name: selectedServer.name,
      description: selectedServer.description,
      category: selectedServer.localOnly ? 'system' : 'web',
      endpoint: selectedServer.endpoint,
      apiKey: '',
    }

    onAddTool(toolData)
    setIsDetailDialogOpen(false)
    toast.success(`${selectedServer.name} added to your tools`)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="relative flex-1">
          <MagnifyingGlass
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <Input
            placeholder="Search MCP servers by name, description, features, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {selectedTags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {selectedTags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => toggleTag(tag)}
              >
                {tag} ×
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTags([])}
              className="h-6 text-xs"
            >
              Clear all
            </Button>
          </div>
        )}
      </div>

      <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as typeof selectedCategory)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            All ({mcpServerLibrary.length})
          </TabsTrigger>
          <TabsTrigger value="official">
            Official ({mcpServerLibrary.filter((s) => s.category === 'official').length})
          </TabsTrigger>
          <TabsTrigger value="community">
            Community ({mcpServerLibrary.filter((s) => s.category === 'community').length})
          </TabsTrigger>
          <TabsTrigger value="commercial">
            Commercial ({mcpServerLibrary.filter((s) => s.category === 'commercial').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          {filteredServers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No servers match your filters.</p>
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredServers.map((server) => {
                  const CategoryIcon = categoryIcons[server.category]
                  return (
                    <motion.div
                      key={server.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card
                        className="p-5 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] group h-full flex flex-col"
                        onClick={() => handleServerClick(server)}
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <h3 className="font-semibold text-lg line-clamp-1">{server.name}</h3>
                          <div className="flex gap-1 flex-shrink-0">
                            <Badge className={categoryColors[server.category]} variant="outline">
                              <CategoryIcon size={12} className="mr-1" weight="fill" />
                              {server.category}
                            </Badge>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                          {server.description}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {server.features.slice(0, 3).map((feature, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                          {server.features.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{server.features.length - 3} more
                            </Badge>
                          )}
                        </div>

                        <div className="mt-auto space-y-2">
                          {server.endpoint && !server.localOnly && (() => {
                            const healthInfo = getHealthIndicator(server.id)
                            const HealthIcon = healthInfo.icon
                            return (
                              <div className="flex items-center gap-2 text-xs mb-2 p-2 bg-muted/50 rounded">
                                <FirstAid size={14} className="text-muted-foreground" weight="fill" />
                                <HealthIcon 
                                  size={14} 
                                  className={cn(healthInfo.color, healthInfo.spin && 'animate-spin')}
                                  weight="fill"
                                />
                                <span className={healthInfo.color}>{healthInfo.label}</span>
                                {healthInfo.responseTime && (
                                  <span className="text-muted-foreground ml-auto">{healthInfo.responseTime}ms</span>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 px-2 ml-auto"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (server.endpoint) {
                                      checkServerHealth(server.id, server.endpoint)
                                      toast.info('Rechecking server health...')
                                    }
                                  }}
                                >
                                  Recheck
                                </Button>
                              </div>
                            )
                          })()}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            {server.requiresAuth && (
                              <div className="flex items-center gap-1">
                                <LockKey size={14} />
                                Auth
                              </div>
                            )}
                            {server.localOnly && (
                              <div className="flex items-center gap-1">
                                <Desktop size={14} />
                                Local
                              </div>
                            )}
                            {server.difficulty && (
                              <Badge variant="outline" className={`text-xs ${difficultyColors[server.difficulty]}`}>
                                <ChartBar size={12} className="mr-1" />
                                {server.difficulty}
                              </Badge>
                            )}
                            {server.version && (
                              <div className="flex items-center gap-1 text-xs">
                                v{server.version}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
          {selectedServer && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-3">
                  <DialogTitle className="text-2xl pr-8">{selectedServer.name}</DialogTitle>
                  <div className="flex gap-2 flex-shrink-0">
                    <Badge className={categoryColors[selectedServer.category]} variant="outline">
                      {selectedServer.category}
                    </Badge>
                    {selectedServer.difficulty && (
                      <Badge variant="outline" className={difficultyColors[selectedServer.difficulty]}>
                        {selectedServer.difficulty}
                      </Badge>
                    )}
                  </div>
                </div>
                <DialogDescription className="text-base mt-2">
                  {selectedServer.description}
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-6 py-4">
                  {selectedServer.version && (
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Tag size={16} />
                        <span>Version {selectedServer.version}</span>
                      </div>
                      {selectedServer.lastUpdated && (
                        <div className="flex items-center gap-2">
                          <Calendar size={16} />
                          <span>Updated {selectedServer.lastUpdated}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedServer.installCommand && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        Installation Command
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => copyToClipboard(selectedServer.installCommand!)}
                        >
                          <Copy size={14} />
                        </Button>
                      </h4>
                      <div className="bg-muted px-3 py-2 rounded-md font-mono text-sm break-all">
                        {selectedServer.installCommand}
                      </div>
                    </div>
                  )}

                  {selectedServer.endpoint && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        Endpoint
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => copyToClipboard(selectedServer.endpoint!)}
                        >
                          <Copy size={14} />
                        </Button>
                        {!selectedServer.localOnly && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2"
                            onClick={() => {
                              checkServerHealth(selectedServer.id, selectedServer.endpoint!)
                              toast.info('Checking server health...')
                            }}
                          >
                            <FirstAid size={14} />
                            Check Health
                          </Button>
                        )}
                      </h4>
                      <div className="bg-muted px-3 py-2 rounded-md mb-2">
                        <code className="text-sm font-mono break-all">{selectedServer.endpoint}</code>
                      </div>
                      {!selectedServer.localOnly && (() => {
                        const healthInfo = getHealthIndicator(selectedServer.id)
                        const HealthIcon = healthInfo.icon
                        return (
                          <div className="flex items-center gap-2 text-sm p-2 bg-muted/30 rounded">
                            <HealthIcon 
                              size={16} 
                              className={cn(healthInfo.color, healthInfo.spin && 'animate-spin')}
                              weight="fill"
                            />
                            <span className={healthInfo.color}>{healthInfo.label}</span>
                            {healthInfo.responseTime && (
                              <span className="text-muted-foreground ml-2">Response: {healthInfo.responseTime}ms</span>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-medium mb-3">Features</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedServer.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <CheckCircle size={16} className="text-accent flex-shrink-0" weight="fill" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedServer.tags && selectedServer.tags.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedServer.tags.map((tag, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => {
                              toggleTag(tag)
                              setIsDetailDialogOpen(false)
                            }}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedServer.setupInstructions && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Setup Instructions</h4>
                      <div className="bg-muted p-3 rounded-md">
                        <p className="text-sm leading-relaxed">{selectedServer.setupInstructions}</p>
                      </div>
                    </div>
                  )}

                  {selectedServer.troubleshooting && selectedServer.troubleshooting.length > 0 && (
                    <div>
                      <Accordion type="single" collapsible className="border rounded-md">
                        <AccordionItem value="troubleshooting" className="border-0">
                          <AccordionTrigger className="px-4 hover:no-underline">
                            <div className="flex items-center gap-2">
                              <Warning size={18} className="text-yellow-600" weight="fill" />
                              <span className="text-sm font-medium">Troubleshooting Tips</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <ul className="space-y-2">
                              {selectedServer.troubleshooting.map((tip, idx) => (
                                <li key={idx} className="text-sm text-muted-foreground flex gap-2">
                                  <span className="text-accent">•</span>
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  )}

                  <Separator />

                  <div className="flex flex-wrap gap-3">
                    {selectedServer.githubUrl && (
                      <a
                        href={selectedServer.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <GithubLogo size={16} weight="fill" />
                        View on GitHub
                      </a>
                    )}
                    {selectedServer.documentation && (
                      <a
                        href={selectedServer.documentation}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Book size={16} weight="fill" />
                        Documentation
                      </a>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-2 border-t">
                    {selectedServer.requiresAuth && (
                      <div className="flex items-center gap-1">
                        <LockKey size={14} />
                        Authentication required
                      </div>
                    )}
                    {selectedServer.localOnly && (
                      <div className="flex items-center gap-1">
                        <Desktop size={14} />
                        Must run locally
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>

              <DialogFooter className="border-t pt-4">
                <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                  Close
                </Button>
                <Button onClick={handleAddServer} className="flex items-center gap-2">
                  <Plus size={18} weight="bold" />
                  Add to My Tools
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
