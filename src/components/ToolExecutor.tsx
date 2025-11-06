import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Play, ArrowsClockwise, CheckCircle, Warning, Code, ChartLine, Sparkle } from '@phosphor-icons/react'
import { Tool } from '@/types/tool'
import { runtime } from '@/lib/middleware-runtime'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface ToolExecutorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tool: Tool | null
  onToolUpdated: (tool: Tool) => void
}

export function ToolExecutor({ open, onOpenChange, tool, onToolUpdated }: ToolExecutorProps) {
  const [executing, setExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState<any>(null)
  const [executionLog, setExecutionLog] = useState<Array<{ timestamp: number; stage: string; data: any }>>([])
  const [refactorDirective, setRefactorDirective] = useState('')
  const [refactoring, setRefactoring] = useState(false)
  const [testInputs, setTestInputs] = useState<string>('{}')

  const handleExecute = async () => {
    if (!tool) return

    setExecuting(true)
    setExecutionResult(null)
    setExecutionLog([])

    try {
      runtime.registerTool(tool)

      let inputs = {}
      try {
        inputs = JSON.parse(testInputs)
      } catch (e) {
        toast.error('Invalid JSON in test inputs')
        setExecuting(false)
        return
      }

      const result = await runtime.executeTool(tool.id, inputs)
      setExecutionResult(result)

      const logs = runtime.getExecutionLog(result.sessionId || '')
      if (logs) {
        setExecutionLog(logs)
      }

      toast.success('Tool executed successfully!')
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Execution failed'
      setExecutionResult({ error: errorMsg })
      toast.error(errorMsg)
    } finally {
      setExecuting(false)
    }
  }

  const handleSelfCorrect = async () => {
    if (!tool || !refactorDirective.trim()) {
      toast.error('Please provide refactoring instructions')
      return
    }

    setRefactoring(true)

    try {
      runtime.registerTool(tool)

      const refactoredTool = await runtime.selfCorrect(tool.id, refactorDirective)
      
      onToolUpdated(refactoredTool)
      setRefactorDirective('')
      
      toast.success('Tool refactored successfully!')
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Self-correction failed'
      toast.error(errorMsg)
    } finally {
      setRefactoring(false)
    }
  }

  const handleClose = () => {
    setExecutionResult(null)
    setExecutionLog([])
    setRefactorDirective('')
    onOpenChange(false)
  }

  if (!tool) return null

  const hasExecutableCode = tool.isAiGenerated && tool.generatedCode

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-teal-500">
              <Play size={24} weight="fill" className="text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Runtime Executor</DialogTitle>
              <DialogDescription>
                Execute and self-correct tool: {tool.name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="execute" className="flex-1 overflow-hidden flex flex-col">
          <TabsList>
            <TabsTrigger value="execute">Execute</TabsTrigger>
            <TabsTrigger value="logs">Execution Logs</TabsTrigger>
            {hasExecutableCode && <TabsTrigger value="refactor">Self-Correct</TabsTrigger>}
          </TabsList>

          <TabsContent value="execute" className="flex-1 overflow-y-auto space-y-4">
            <Card className="p-4 bg-muted/50">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{tool.name}</h4>
                  <Badge variant={tool.isAiGenerated ? 'default' : 'secondary'}>
                    {tool.isAiGenerated ? 'AI Generated' : 'Manual'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{tool.description}</p>
              </div>
            </Card>

            {hasExecutableCode ? (
              <>
                <div className="space-y-2">
                  <Label>Test Inputs (JSON)</Label>
                  <Textarea
                    value={testInputs}
                    onChange={(e) => setTestInputs(e.target.value)}
                    placeholder='{"param1": "value1", "param2": "value2"}'
                    rows={5}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Provide inputs matching the tool's expected parameters
                  </p>
                </div>

                <Button
                  onClick={handleExecute}
                  disabled={executing}
                  className="w-full"
                >
                  {executing ? (
                    <>
                      <ArrowsClockwise size={18} className="mr-2 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play size={18} weight="fill" className="mr-2" />
                      Execute Tool
                    </>
                  )}
                </Button>

                <AnimatePresence>
                  {executionResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <Card className={`p-4 ${executionResult.error ? 'border-destructive' : 'border-green-500'}`}>
                        <div className="flex items-start gap-3">
                          {executionResult.error ? (
                            <Warning size={24} className="text-destructive shrink-0" />
                          ) : (
                            <CheckCircle size={24} className="text-green-500 shrink-0" weight="fill" />
                          )}
                          <div className="flex-1 space-y-2">
                            <h4 className="font-medium">
                              {executionResult.error ? 'Execution Failed' : 'Execution Complete'}
                            </h4>
                            <ScrollArea className="h-48">
                              <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                                {JSON.stringify(executionResult, null, 2)}
                              </pre>
                            </ScrollArea>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <Card className="p-6 text-center border-dashed">
                <Warning size={32} className="text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  This tool has no executable code. AI-generated tools can be executed directly.
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="logs" className="flex-1 overflow-y-auto">
            {executionLog.length === 0 ? (
              <Card className="p-8 text-center border-dashed">
                <ChartLine size={32} className="text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  Execute the tool to see detailed execution logs
                </p>
              </Card>
            ) : (
              <div className="space-y-2">
                {executionLog.map((log, index) => (
                  <Card key={index} className="p-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {log.stage}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {hasExecutableCode && (
            <TabsContent value="refactor" className="flex-1 overflow-y-auto space-y-4">
              <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                <div className="flex items-start gap-3">
                  <Sparkle size={24} className="text-purple-500 shrink-0" weight="fill" />
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">Self-Correction Mode</h4>
                    <p className="text-sm text-muted-foreground">
                      Tell the AI how to improve this tool. It will analyze the current implementation
                      and refactor it automatically while preserving functionality.
                    </p>
                  </div>
                </div>
              </Card>

              <div className="space-y-2">
                <Label>Current Implementation</Label>
                <ScrollArea className="h-48">
                  <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                    {tool.generatedCode}
                  </pre>
                </ScrollArea>
              </div>

              <div className="space-y-2">
                <Label>Refactoring Directive</Label>
                <Textarea
                  value={refactorDirective}
                  onChange={(e) => setRefactorDirective(e.target.value)}
                  placeholder="e.g., Add persistence using spark.kv for caching. Improve security by validating all inputs. Add retry logic for failed API calls."
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Examples: "Add error handling and input validation", "Refactor for persistence and security",
                  "Add caching layer", "Improve performance with batching"
                </p>
              </div>

              <Button
                onClick={handleSelfCorrect}
                disabled={refactoring || !refactorDirective.trim()}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {refactoring ? (
                  <>
                    <ArrowsClockwise size={18} className="mr-2 animate-spin" />
                    Refactoring...
                  </>
                ) : (
                  <>
                    <Sparkle size={18} weight="fill" className="mr-2" />
                    Self-Correct Tool
                  </>
                )}
              </Button>

              {tool.description.includes('Refactored:') && (
                <Card className="p-4 bg-green-50 border-green-200">
                  <div className="flex items-start gap-3">
                    <CheckCircle size={20} className="text-green-600 shrink-0" weight="fill" />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm mb-1">Previously Refactored</h4>
                      <p className="text-xs text-muted-foreground">
                        {tool.description.split('Refactored:')[1]}
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </TabsContent>
          )}
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
