import { Tool } from '@/types/tool'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle, Circle, Warning, Gear, Pencil, Flask, GithubLogo, Plug, Star } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { ToolStatus, ToolCategory } from '@/types/tool'
import { EndpointTester } from '@/components/EndpointTester'
import { GitHubFetcher } from '@/components/GitHubFetcher'
import { MCPServerConnector } from '@/components/MCPServerConnector'

interface ToolDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tool: Tool | null
  onEdit: (tool: Tool) => void
  onToggleStatus: (id: string, status: ToolStatus) => void
  onToggleFavorite?: (id: string, isFavorite: boolean) => void
}

const statusConfig: Record<ToolStatus, { icon: typeof CheckCircle; color: string; label: string }> = {
  enabled: { icon: CheckCircle, color: 'text-accent', label: 'Enabled' },
  disabled: { icon: Circle, color: 'text-muted-foreground', label: 'Disabled' },
  'needs-config': { icon: Warning, color: 'text-amber-500', label: 'Needs Config' },
}

const categoryColors: Record<ToolCategory, string> = {
  code: 'bg-blue-100 text-blue-700',
  data: 'bg-green-100 text-green-700',
  web: 'bg-purple-100 text-purple-700',
  productivity: 'bg-orange-100 text-orange-700',
  ai: 'bg-pink-100 text-pink-700',
  system: 'bg-gray-100 text-gray-700',
  other: 'bg-slate-100 text-slate-700',
}

export function ToolDetailDialog({ open, onOpenChange, tool, onEdit, onToggleStatus, onToggleFavorite }: ToolDetailDialogProps) {
  if (!tool) return null

  const StatusIcon = statusConfig[tool.status].icon

  const handleToggleStatus = () => {
    const newStatus: ToolStatus = tool.status === 'enabled' ? 'disabled' : 'enabled'
    onToggleStatus(tool.id, newStatus)
  }

  const handleToggleFavorite = () => {
    onToggleFavorite?.(tool.id, !tool.isFavorite)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-2xl font-semibold">{tool.name}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleFavorite}
                className="hover:bg-amber-100"
              >
                <Star size={20} weight={tool.isFavorite ? 'fill' : 'regular'} className={tool.isFavorite ? 'text-amber-500' : ''} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  onEdit(tool)
                  onOpenChange(false)
                }}
              >
                <Pencil size={20} />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="mcp">
              <Plug size={16} className="mr-2" />
              MCP
            </TabsTrigger>
            <TabsTrigger value="test">
              <Flask size={16} className="mr-2" />
              Test
            </TabsTrigger>
            <TabsTrigger value="github">
              <GithubLogo size={16} className="mr-2" />
              GitHub
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 mt-4">
            <div className="flex items-center gap-3">
              <StatusIcon
                className={cn('flex-shrink-0', statusConfig[tool.status].color)}
                size={24}
                weight="fill"
              />
              <span className="text-sm font-medium">{statusConfig[tool.status].label}</span>
              <Badge variant="secondary" className={cn('ml-auto', categoryColors[tool.category])}>
                {tool.category}
              </Badge>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Description</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{tool.description}</p>
            </div>

            {tool.tags && tool.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {tool.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {(tool.usageCount !== undefined || tool.lastUsedAt) && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                {tool.usageCount !== undefined && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-1">Usage Count</h4>
                    <p className="text-xl font-semibold">{tool.usageCount}</p>
                  </div>
                )}
                {tool.lastUsedAt && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-1">Last Used</h4>
                    <p className="text-sm font-medium">{formatDate(tool.lastUsedAt)}</p>
                  </div>
                )}
              </div>
            )}

            {tool.endpoint && (
              <div>
                <h4 className="text-sm font-medium mb-2">Endpoint</h4>
                <div className="bg-muted px-3 py-2 rounded-md">
                  <code className="text-sm font-mono break-all">{tool.endpoint}</code>
                </div>
              </div>
            )}

            {tool.apiKey && (
              <div>
                <h4 className="text-sm font-medium mb-2">API Key</h4>
                <div className="bg-muted px-3 py-2 rounded-md">
                  <code className="text-sm font-mono">••••••••••••••••</code>
                </div>
              </div>
            )}

            {tool.parameters && Object.keys(tool.parameters).length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Parameters</h4>
                <div className="bg-muted px-3 py-2 rounded-md">
                  <pre className="text-sm font-mono overflow-x-auto">
                    {JSON.stringify(tool.parameters, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            <div className="pt-4 border-t flex gap-2">
              <Button
                onClick={handleToggleStatus}
                variant={tool.status === 'enabled' ? 'outline' : 'default'}
                className="flex-1"
              >
                {tool.status === 'enabled' ? 'Disable Tool' : 'Enable Tool'}
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => {
                  onEdit(tool)
                  onOpenChange(false)
                }}
              >
                <Gear size={16} />
                Configure
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="mcp" className="mt-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect to Model Context Protocol (MCP) servers to discover and use available tools.
              </p>
              <MCPServerConnector initialEndpoint={tool.endpoint || ''} />
            </div>
          </TabsContent>

          <TabsContent value="test" className="mt-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Test your endpoint configuration by sending requests and viewing responses.
              </p>
              <EndpointTester
                initialEndpoint={tool.endpoint || ''}
                initialApiKey={tool.apiKey || ''}
              />
            </div>
          </TabsContent>

          <TabsContent value="github" className="mt-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Fetch files from GitHub repositories to use with your AI tools.
              </p>
              <GitHubFetcher />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
