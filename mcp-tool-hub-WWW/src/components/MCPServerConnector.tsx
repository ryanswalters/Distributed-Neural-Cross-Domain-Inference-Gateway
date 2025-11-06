import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PlayCircle, CircleNotch, CheckCircle, XCircle, Plug } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'

interface MCPTool {
  name: string
  description?: string
  inputSchema?: Record<string, unknown>
}

interface MCPServerInfo {
  serverInfo?: {
    name?: string
    version?: string
  }
  capabilities?: Record<string, unknown>
  tools?: MCPTool[]
}

interface MCPServerConnectorProps {
  initialEndpoint?: string
}

export function MCPServerConnector({ initialEndpoint = '' }: MCPServerConnectorProps) {
  const [endpoint, setEndpoint] = useState(initialEndpoint)
  const [isLoading, setIsLoading] = useState(false)
  const [serverInfo, setServerInfo] = useState<MCPServerInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedTool, setSelectedTool] = useState<MCPTool | null>(null)
  const [toolArgs, setToolArgs] = useState('')
  const [toolResult, setToolResult] = useState<unknown | null>(null)

  const handleConnect = async () => {
    if (!endpoint.trim()) {
      toast.error('Please enter an MCP server endpoint')
      return
    }

    setIsLoading(true)
    setError(null)
    setServerInfo(null)

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: {
              name: 'MCP Tool Hub',
              version: '1.0.0',
            },
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error.message || 'MCP server returned an error')
      }

      const info: MCPServerInfo = data.result || {}
      
      const toolsResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/list',
          params: {},
        }),
      })

      if (toolsResponse.ok) {
        const toolsData = await toolsResponse.json()
        if (toolsData.result?.tools) {
          info.tools = toolsData.result.tools
        }
      }

      setServerInfo(info)
      toast.success('Connected to MCP server')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect to MCP server'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCallTool = async () => {
    if (!selectedTool) return

    setIsLoading(true)
    setToolResult(null)

    try {
      let args = {}
      if (toolArgs.trim()) {
        try {
          args = JSON.parse(toolArgs)
        } catch (e) {
          throw new Error('Invalid JSON in arguments')
        }
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 3,
          method: 'tools/call',
          params: {
            name: selectedTool.name,
            arguments: args,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error.message || 'Tool call failed')
      }

      setToolResult(data.result)
      toast.success('Tool executed successfully')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Tool call failed'
      toast.error(message)
      setToolResult({ error: message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="mcp-endpoint">MCP Server Endpoint</Label>
        <div className="flex gap-2">
          <Input
            id="mcp-endpoint"
            placeholder="http://localhost:3000/mcp"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleConnect} disabled={isLoading} className="flex items-center gap-2">
            {isLoading ? (
              <CircleNotch size={18} className="animate-spin" />
            ) : (
              <Plug size={18} weight="fill" />
            )}
            Connect
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Examples: http://localhost:3000/mcp (local) or https://mcp.cloudflare.com (if available)
        </p>
      </div>

      {error && (
        <Card className="p-4 border-destructive bg-destructive/5">
          <div className="flex items-start gap-2">
            <XCircle size={20} className="text-destructive flex-shrink-0 mt-0.5" weight="fill" />
            <div>
              <p className="font-medium text-destructive">Connection Error</p>
              <p className="text-sm text-destructive/90 mt-1">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {serverInfo && (
        <Card className="p-4">
          <div className="flex items-start gap-2 mb-4">
            <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" weight="fill" />
            <div className="flex-1">
              <p className="font-medium">Connected to MCP Server</p>
              {serverInfo.serverInfo?.name && (
                <p className="text-sm text-muted-foreground">
                  {serverInfo.serverInfo.name}
                  {serverInfo.serverInfo.version && ` v${serverInfo.serverInfo.version}`}
                </p>
              )}
            </div>
          </div>

          {serverInfo.capabilities && Object.keys(serverInfo.capabilities).length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">Capabilities</p>
              <div className="flex flex-wrap gap-2">
                {Object.keys(serverInfo.capabilities).map((cap) => (
                  <Badge key={cap} variant="secondary">
                    {String(cap)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {serverInfo.tools && serverInfo.tools.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Available Tools ({serverInfo.tools.length})</p>
              <div className="space-y-2 max-h-64 overflow-auto">
                {serverInfo.tools.map((tool) => (
                  <button
                    key={tool.name}
                    onClick={() => {
                      setSelectedTool(tool)
                      setToolArgs(
                        tool.inputSchema
                          ? JSON.stringify(
                              Object.fromEntries(
                                Object.keys((tool.inputSchema as any).properties || {}).map((k) => [k, ''])
                              ),
                              null,
                              2
                            )
                          : ''
                      )
                      setToolResult(null)
                    }}
                    className="w-full text-left p-3 rounded-md border hover:bg-muted transition-colors"
                  >
                    <p className="font-medium text-sm">{tool.name}</p>
                    {tool.description && (
                      <p className="text-xs text-muted-foreground mt-1">{tool.description}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {selectedTool && (
        <Card className="p-4">
          <div className="space-y-4">
            <div>
              <p className="font-medium mb-1">{selectedTool.name}</p>
              {selectedTool.description && (
                <p className="text-sm text-muted-foreground">{selectedTool.description}</p>
              )}
            </div>

            {selectedTool.inputSchema && (
              <div className="space-y-2">
                <Label htmlFor="tool-args">Arguments (JSON)</Label>
                <Textarea
                  id="tool-args"
                  value={toolArgs}
                  onChange={(e) => setToolArgs(e.target.value)}
                  rows={6}
                  className="font-mono text-sm"
                  placeholder="{}"
                />
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Show schema
                  </summary>
                  <pre className="mt-2 p-2 bg-muted rounded overflow-auto">
                    {JSON.stringify(selectedTool.inputSchema, null, 2)}
                  </pre>
                </details>
              </div>
            )}

            <Button onClick={handleCallTool} disabled={isLoading} className="w-full flex items-center gap-2">
              {isLoading ? (
                <CircleNotch size={18} className="animate-spin" />
              ) : (
                <PlayCircle size={18} weight="fill" />
              )}
              Call Tool
            </Button>
          </div>
        </Card>
      )}

      {(toolResult !== null) && (
        <Card className="p-4">
          <p className="font-medium mb-2">Tool Result</p>
          <div className="bg-muted rounded-md p-3 max-h-96 overflow-auto">
            <pre className="text-xs font-mono">
              {(() => {
                try {
                  return typeof toolResult === 'string' 
                    ? toolResult 
                    : JSON.stringify(toolResult, null, 2)
                } catch {
                  return String(toolResult)
                }
              })()}
            </pre>
          </div>
        </Card>
      )}
    </div>
  )
}
