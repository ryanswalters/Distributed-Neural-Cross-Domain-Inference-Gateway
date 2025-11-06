import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Code, Sparkle, Copy, CheckCircle } from '@phosphor-icons/react'
import { Tool } from '@/types/tool'
import { toast } from 'sonner'
import { useState } from 'react'

interface AIGeneratedToolViewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tool: Tool | null
}

export function AIGeneratedToolView({ open, onOpenChange, tool }: AIGeneratedToolViewProps) {
  const [copied, setCopied] = useState(false)

  if (!tool || !tool.isAiGenerated) {
    return null
  }

  const handleCopyCode = () => {
    if (tool.generatedCode) {
      navigator.clipboard.writeText(tool.generatedCode)
      setCopied(true)
      toast.success('Code copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <Sparkle size={20} weight="fill" className="text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl">{tool.name}</DialogTitle>
              <DialogDescription>AI-Generated Tool</DialogDescription>
            </div>
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
              AI Generated
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="code">Generated Code</TabsTrigger>
            <TabsTrigger value="prompt">Generation Prompt</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
              <p className="text-sm">{tool.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Category</h4>
                <Badge variant="secondary" className="capitalize">
                  {tool.category}
                </Badge>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                <Badge variant={tool.status === 'enabled' ? 'default' : 'secondary'}>
                  {tool.status}
                </Badge>
              </div>
            </div>

            {tool.endpoint && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Endpoint</h4>
                <div className="p-3 rounded-md bg-muted font-mono text-sm">
                  {tool.endpoint}
                </div>
              </div>
            )}

            {tool.parameters && Object.keys(tool.parameters).length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Parameters</h4>
                <div className="p-3 rounded-md bg-muted space-y-2">
                  {Object.entries(tool.parameters).map(([key, value]) => (
                    <div key={key} className="text-sm">
                      <span className="font-mono font-medium">{key}</span>
                      <span className="text-muted-foreground">: {value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tool.tags && tool.tags.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {tool.tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Created</h4>
              <p className="text-sm">
                {new Date(tool.createdAt).toLocaleString()}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="code" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code size={18} className="text-muted-foreground" />
                <h4 className="text-sm font-medium">Implementation Code</h4>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyCode}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <CheckCircle size={16} weight="fill" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copy Code
                  </>
                )}
              </Button>
            </div>

            <ScrollArea className="h-[400px] w-full rounded-md border">
              <div className="p-4 font-mono text-xs bg-muted/30">
                <pre className="whitespace-pre-wrap">{tool.generatedCode || 'No code available'}</pre>
              </div>
            </ScrollArea>

            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> This code is AI-generated and should be reviewed before deployment to production.
                Test thoroughly and adjust as needed for your specific use case.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="prompt" className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Original Request</h4>
              <div className="p-4 rounded-md bg-muted">
                <p className="text-sm whitespace-pre-wrap">
                  {tool.generationPrompt || 'No generation prompt available'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
              <p className="text-sm text-purple-900">
                This tool was automatically generated based on the request above. You can regenerate it with different
                parameters or modify the code directly to suit your needs.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
