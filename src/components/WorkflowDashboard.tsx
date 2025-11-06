import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Play, Trash, ArrowRight, CircleNotch, CheckCircle, Warning } from '@phosphor-icons/react'
import { Workflow, runtime } from '@/lib/middleware-runtime'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

const stepTypeColors: Record<string, string> = {
  'web-api': 'bg-blue-500',
  'file-op': 'bg-green-500',
  'ai-call': 'bg-purple-500',
  'transform': 'bg-orange-500',
  'conditional': 'bg-yellow-500'
}

export function WorkflowDashboard() {
  const [workflows, setWorkflows] = useKV<Workflow[]>('workflows', [])
  const [executing, setExecuting] = useState<string | null>(null)
  const [results, setResults] = useState<Map<string, any>>(new Map())

  const handleExecute = async (workflow: Workflow) => {
    setExecuting(workflow.id)
    
    try {
      runtime.registerWorkflow(workflow)
      
      const result = await runtime.executeWorkflow(workflow.id, {})
      
      setResults(new Map(results.set(workflow.id, { success: true, data: result })))
      toast.success(`Workflow "${workflow.name}" completed successfully!`)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Execution failed'
      setResults(new Map(results.set(workflow.id, { success: false, error: errorMsg })))
      toast.error(`Workflow failed: ${errorMsg}`)
    } finally {
      setExecuting(null)
    }
  }

  const handleDelete = (id: string) => {
    setWorkflows((current) => (current || []).filter(w => w.id !== id))
    results.delete(id)
    setResults(new Map(results))
    toast.success('Workflow deleted')
  }

  if (!workflows || workflows.length === 0) {
    return (
      <Card className="p-12 text-center border-dashed">
        <p className="text-muted-foreground">
          No workflows created yet. Build your first workflow to see it here.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {workflows.map((workflow) => {
          const result = results.get(workflow.id)
          const isExecuting = executing === workflow.id

          return (
            <motion.div
              key={workflow.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
            >
              <Card className="p-5">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">{workflow.name}</h3>
                      <p className="text-sm text-muted-foreground">{workflow.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleExecute(workflow)}
                        disabled={isExecuting}
                      >
                        {isExecuting ? (
                          <>
                            <CircleNotch size={16} className="mr-1 animate-spin" />
                            Running
                          </>
                        ) : (
                          <>
                            <Play size={16} weight="fill" className="mr-1" />
                            Run
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(workflow.id)}
                        disabled={isExecuting}
                      >
                        <Trash size={16} />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {workflow.steps.map((step, index) => (
                      <div key={step.id} className="flex items-center gap-2">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${stepTypeColors[step.type]}`} />
                          {step.id}
                        </Badge>
                        {index < workflow.steps.length - 1 && (
                          <ArrowRight size={14} className="text-muted-foreground" />
                        )}
                      </div>
                    ))}
                  </div>

                  {result && (
                    <Card className={`p-3 ${result.success ? 'border-green-500 bg-green-50' : 'border-destructive bg-destructive/5'}`}>
                      <div className="flex items-start gap-2">
                        {result.success ? (
                          <CheckCircle size={20} className="text-green-500 shrink-0" weight="fill" />
                        ) : (
                          <Warning size={20} className="text-destructive shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium mb-1">
                            {result.success ? 'Execution Successful' : 'Execution Failed'}
                          </h4>
                          <ScrollArea className="max-h-32">
                            <pre className="text-xs bg-background/50 p-2 rounded overflow-auto">
                              {JSON.stringify(result.success ? result.data : { error: result.error }, null, 2)}
                            </pre>
                          </ScrollArea>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              </Card>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
