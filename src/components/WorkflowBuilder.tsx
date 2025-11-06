import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Trash, ArrowRight, Play, Sparkle, GlobeHemisphereWest, File, Brain, Lightning } from '@phosphor-icons/react'
import { Workflow, WorkflowStep, runtime } from '@/lib/middleware-runtime'
import { Tool } from '@/types/tool'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface WorkflowBuilderProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tools: Tool[]
}

const stepTypeIcons = {
  'web-api': GlobeHemisphereWest,
  'file-op': File,
  'ai-call': Brain,
  'transform': Lightning,
  'conditional': Lightning
}

export function WorkflowBuilder({ open, onOpenChange, tools }: WorkflowBuilderProps) {
  const [workflows, setWorkflows] = useKV<Workflow[]>('workflows', [])
  const [workflowName, setWorkflowName] = useState('')
  const [workflowDescription, setWorkflowDescription] = useState('')
  const [steps, setSteps] = useState<WorkflowStep[]>([])
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null)
  const [executing, setExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState<any>(null)

  const addStep = (type: WorkflowStep['type']) => {
    const newStep: WorkflowStep = {
      id: `step-${Date.now()}`,
      type,
      config: {}
    }
    setSteps([...steps, newStep])
    setEditingStepIndex(steps.length)
  }

  const updateStep = (index: number, updates: Partial<WorkflowStep>) => {
    const newSteps = [...steps]
    newSteps[index] = { ...newSteps[index], ...updates }
    setSteps(newSteps)
  }

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index))
    if (editingStepIndex === index) {
      setEditingStepIndex(null)
    }
  }

  const saveWorkflow = () => {
    if (!workflowName.trim()) {
      toast.error('Workflow name is required')
      return
    }

    if (steps.length === 0) {
      toast.error('Add at least one step to the workflow')
      return
    }

    const workflow: Workflow = {
      id: `workflow-${Date.now()}`,
      name: workflowName,
      description: workflowDescription,
      steps,
      context: {}
    }

    runtime.registerWorkflow(workflow)
    setWorkflows((current) => [...(current || []), workflow])
    toast.success('Workflow saved and registered!')
    resetForm()
  }

  const executeWorkflow = async () => {
    if (steps.length === 0) {
      toast.error('No steps to execute')
      return
    }

    setExecuting(true)
    setExecutionResult(null)

    try {
      const tempWorkflow: Workflow = {
        id: `temp-${Date.now()}`,
        name: 'Test Execution',
        description: 'Temporary workflow for testing',
        steps,
        context: {}
      }

      runtime.registerWorkflow(tempWorkflow)

      const result = await runtime.executeWorkflow(tempWorkflow.id, {})
      
      setExecutionResult(result)
      toast.success('Workflow executed successfully!')
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Execution failed'
      toast.error(errorMsg)
      setExecutionResult({ error: errorMsg })
    } finally {
      setExecuting(false)
    }
  }

  const resetForm = () => {
    setWorkflowName('')
    setWorkflowDescription('')
    setSteps([])
    setEditingStepIndex(null)
    setExecutionResult(null)
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500">
              <Lightning size={24} weight="fill" className="text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Workflow Builder</DialogTitle>
              <DialogDescription>
                Chain web APIs, file operations, and AI calls into automated workflows
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 flex-1 overflow-hidden">
          <div className="col-span-2 space-y-4 overflow-y-auto">
            <div className="space-y-2">
              <Label>Workflow Name</Label>
              <Input
                placeholder="e.g., Fetch GitHub file and analyze with AI"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe what this workflow does..."
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Workflow Steps</Label>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => addStep('web-api')}>
                    <GlobeHemisphereWest size={16} className="mr-1" />
                    Web API
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => addStep('file-op')}>
                    <File size={16} className="mr-1" />
                    File Op
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => addStep('ai-call')}>
                    <Brain size={16} className="mr-1" />
                    AI Call
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => addStep('transform')}>
                    <Lightning size={16} className="mr-1" />
                    Transform
                  </Button>
                </div>
              </div>

              <AnimatePresence mode="popLayout">
                {steps.length === 0 ? (
                  <Card className="p-8 text-center border-dashed">
                    <p className="text-muted-foreground">
                      Add steps to build your workflow
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {steps.map((step, index) => {
                      const Icon = stepTypeIcons[step.type]
                      return (
                        <motion.div
                          key={step.id}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                        >
                          <Card
                            className={`p-3 cursor-pointer transition-colors ${
                              editingStepIndex === index ? 'ring-2 ring-primary' : ''
                            }`}
                            onClick={() => setEditingStepIndex(index)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                                  <Icon size={16} className="text-primary" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{step.id}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {step.type}
                                    </Badge>
                                  </div>
                                  {Object.keys(step.config).length > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                      {Object.keys(step.config).length} config{Object.keys(step.config).length !== 1 ? 's' : ''}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {index < steps.length - 1 && (
                                  <ArrowRight size={16} className="text-muted-foreground" />
                                )}
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    removeStep(index)
                                  }}
                                >
                                  <Trash size={16} />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </AnimatePresence>
            </div>

            {executionResult && (
              <Card className="p-4 bg-muted/50">
                <Label className="mb-2 block">Execution Result</Label>
                <pre className="text-xs overflow-auto max-h-48 bg-background p-3 rounded">
                  {JSON.stringify(executionResult, null, 2)}
                </pre>
              </Card>
            )}
          </div>

          <div className="border-l pl-4 overflow-y-auto">
            <Label className="mb-3 block">Step Configuration</Label>
            
            {editingStepIndex !== null && steps[editingStepIndex] ? (
              <StepEditor
                step={steps[editingStepIndex]}
                onChange={(updates) => updateStep(editingStepIndex, updates)}
                tools={tools}
              />
            ) : (
              <Card className="p-6 text-center border-dashed">
                <p className="text-sm text-muted-foreground">
                  Select a step to configure
                </p>
              </Card>
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={executeWorkflow}
              disabled={executing || steps.length === 0}
            >
              <Play size={16} className="mr-1" />
              Test Run
            </Button>
            <Button onClick={saveWorkflow} disabled={!workflowName.trim() || steps.length === 0}>
              <Sparkle size={16} weight="fill" className="mr-1" />
              Save Workflow
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface StepEditorProps {
  step: WorkflowStep
  onChange: (updates: Partial<WorkflowStep>) => void
  tools: Tool[]
}

function StepEditor({ step, onChange, tools }: StepEditorProps) {
  const updateConfig = (key: string, value: any) => {
    onChange({
      config: {
        ...step.config,
        [key]: value
      }
    })
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 pr-4">
        {step.type === 'web-api' && (
          <>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                placeholder="https://api.example.com/endpoint"
                value={step.config.url || ''}
                onChange={(e) => updateConfig('url', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Use {'{{'} and {'}}'}  for variables: {'{{stepId.fieldName}}'}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Method</Label>
              <Select
                value={step.config.method || 'GET'}
                onValueChange={(value) => updateConfig('method', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Headers (JSON)</Label>
              <Textarea
                placeholder='{"Authorization": "Bearer token"}'
                value={step.config.headers ? JSON.stringify(step.config.headers, null, 2) : ''}
                onChange={(e) => {
                  try {
                    updateConfig('headers', JSON.parse(e.target.value))
                  } catch {
                    updateConfig('headers', e.target.value)
                  }
                }}
                rows={3}
              />
            </div>
          </>
        )}

        {step.type === 'file-op' && (
          <>
            <div className="space-y-2">
              <Label>Operation</Label>
              <Select
                value={step.config.operation || 'fetch'}
                onValueChange={(value) => updateConfig('operation', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fetch">Fetch from GitHub</SelectItem>
                  <SelectItem value="store">Store in KV</SelectItem>
                  <SelectItem value="retrieve">Retrieve from KV</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {step.config.operation === 'fetch' && (
              <>
                <div className="space-y-2">
                  <Label>GitHub Repo URL</Label>
                  <Input
                    placeholder="https://github.com/owner/repo"
                    value={step.config.repoUrl || ''}
                    onChange={(e) => updateConfig('repoUrl', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>File Path (optional)</Label>
                  <Input
                    placeholder="path/to/file.txt"
                    value={step.config.filePath || ''}
                    onChange={(e) => updateConfig('filePath', e.target.value)}
                  />
                </div>
              </>
            )}
            {(step.config.operation === 'store' || step.config.operation === 'retrieve') && (
              <div className="space-y-2">
                <Label>Key</Label>
                <Input
                  placeholder="my-data-key"
                  value={step.config.key || ''}
                  onChange={(e) => updateConfig('key', e.target.value)}
                />
              </div>
            )}
          </>
        )}

        {step.type === 'ai-call' && (
          <>
            <div className="space-y-2">
              <Label>Prompt Template</Label>
              <Textarea
                placeholder="Analyze this data: {{step.step-1.content}}"
                value={step.config.promptTemplate || ''}
                onChange={(e) => updateConfig('promptTemplate', e.target.value)}
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <Label>Model</Label>
              <Select
                value={step.config.model || 'gpt-4o'}
                onValueChange={(value) => updateConfig('model', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                  <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="json-mode"
                checked={step.config.jsonMode || false}
                onChange={(e) => updateConfig('jsonMode', e.target.checked)}
              />
              <Label htmlFor="json-mode">JSON Mode</Label>
            </div>
          </>
        )}

        {step.type === 'transform' && (
          <>
            <div className="space-y-2">
              <Label>Input Variable</Label>
              <Input
                placeholder="{{step.step-1.data}}"
                value={step.config.input || ''}
                onChange={(e) => updateConfig('input', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Transform Function</Label>
              <Textarea
                placeholder="return input.toUpperCase()"
                value={step.config.transformFn || ''}
                onChange={(e) => updateConfig('transformFn', e.target.value)}
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                Function receives: input, context, results
              </p>
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label>Step ID</Label>
          <Input
            value={step.id}
            onChange={(e) => onChange({ id: e.target.value })}
            placeholder="unique-step-id"
          />
          <p className="text-xs text-muted-foreground">
            Used to reference this step's output
          </p>
        </div>
      </div>
    </ScrollArea>
  )
}
