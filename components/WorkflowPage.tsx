import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Plus, Trash, ArrowRight, Play, Sparkle, GlobeHemisphereWest, File, Brain, Lightning, CircleNotch, CheckCircle, Warning, X, ArrowLeft, FloppyDisk, TestTube } from '@phosphor-icons/react'
import { Workflow, WorkflowStep, runtime } from '@/lib/middleware-runtime'
import { Tool } from '@/types/tool'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface WorkflowPageProps {
  tools: Tool[]
}

const stepTypeIcons = {
  'web-api': GlobeHemisphereWest,
  'file-op': File,
  'ai-call': Brain,
  'transform': Lightning,
  'conditional': Lightning
}

const stepTypeColors: Record<string, string> = {
  'web-api': 'bg-blue-500',
  'file-op': 'bg-green-500',
  'ai-call': 'bg-purple-500',
  'transform': 'bg-orange-500',
  'conditional': 'bg-yellow-500'
}

type ViewMode = 'list' | 'builder'

export function WorkflowPage({ tools }: WorkflowPageProps) {
  const [workflows, setWorkflows] = useKV<Workflow[]>('workflows', [])
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null)
  const [workflowName, setWorkflowName] = useState('')
  const [workflowDescription, setWorkflowDescription] = useState('')
  const [steps, setSteps] = useState<WorkflowStep[]>([])
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null)
  const [executing, setExecuting] = useState<string | null>(null)
  const [testExecuting, setTestExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState<any>(null)
  const [workflowResults, setWorkflowResults] = useState<Map<string, any>>(new Map())

  const startNewWorkflow = () => {
    setEditingWorkflow(null)
    setWorkflowName('')
    setWorkflowDescription('')
    setSteps([])
    setEditingStepIndex(null)
    setExecutionResult(null)
    setViewMode('builder')
  }

  const editWorkflow = (workflow: Workflow) => {
    setEditingWorkflow(workflow)
    setWorkflowName(workflow.name)
    setWorkflowDescription(workflow.description)
    setSteps([...workflow.steps])
    setEditingStepIndex(null)
    setExecutionResult(null)
    setViewMode('builder')
  }

  const cancelBuilder = () => {
    setViewMode('list')
    setEditingWorkflow(null)
    setWorkflowName('')
    setWorkflowDescription('')
    setSteps([])
    setEditingStepIndex(null)
    setExecutionResult(null)
  }

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

    if (editingWorkflow) {
      const updatedWorkflow: Workflow = {
        ...editingWorkflow,
        name: workflowName,
        description: workflowDescription,
        steps
      }
      runtime.registerWorkflow(updatedWorkflow)
      setWorkflows((current) =>
        (current || []).map(w => w.id === editingWorkflow.id ? updatedWorkflow : w)
      )
      toast.success('Workflow updated successfully!')
    } else {
      const workflow: Workflow = {
        id: `workflow-${Date.now()}`,
        name: workflowName,
        description: workflowDescription,
        steps,
        context: {}
      }
      runtime.registerWorkflow(workflow)
      setWorkflows((current) => [...(current || []), workflow])
      toast.success('Workflow created successfully!')
    }

    setViewMode('list')
    cancelBuilder()
  }

  const testWorkflow = async () => {
    if (steps.length === 0) {
      toast.error('No steps to test')
      return
    }

    setTestExecuting(true)
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
      toast.success('Test executed successfully!')
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Execution failed'
      toast.error(errorMsg)
      setExecutionResult({ error: errorMsg })
    } finally {
      setTestExecuting(false)
    }
  }

  const executeWorkflow = async (workflow: Workflow) => {
    setExecuting(workflow.id)
    
    try {
      runtime.registerWorkflow(workflow)
      const result = await runtime.executeWorkflow(workflow.id, {})
      
      const newResults = new Map(workflowResults)
      newResults.set(workflow.id, { success: true, data: result })
      setWorkflowResults(newResults)
      toast.success(`Workflow "${workflow.name}" completed!`)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Execution failed'
      const newResults = new Map(workflowResults)
      newResults.set(workflow.id, { success: false, error: errorMsg })
      setWorkflowResults(newResults)
      toast.error(`Workflow failed: ${errorMsg}`)
    } finally {
      setExecuting(null)
    }
  }

  const deleteWorkflow = (id: string) => {
    setWorkflows((current) => (current || []).filter(w => w.id !== id))
    const newResults = new Map(workflowResults)
    newResults.delete(id)
    setWorkflowResults(newResults)
    toast.success('Workflow deleted')
  }

  if (viewMode === 'builder') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={cancelBuilder}>
              <ArrowLeft size={20} />
            </Button>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500">
                <Lightning size={24} weight="fill" className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">
                  {editingWorkflow ? 'Edit Workflow' : 'Build Workflow'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Chain web APIs, file operations, and AI calls into automated workflows
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={cancelBuilder}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={testWorkflow}
              disabled={testExecuting || steps.length === 0}
            >
              {testExecuting ? (
                <>
                  <CircleNotch size={16} className="mr-1 animate-spin" />
                  Testing
                </>
              ) : (
                <>
                  <TestTube size={16} className="mr-1" />
                  Test Run
                </>
              )}
            </Button>
            <Button onClick={saveWorkflow} disabled={!workflowName.trim() || steps.length === 0}>
              <FloppyDisk size={16} className="mr-1" weight="fill" />
              Save Workflow
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Workflow Name *</Label>
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
              </div>
            </Card>

            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Workflow Steps</Label>
                  <div className="flex gap-2 flex-wrap">
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

                <Separator />

                <AnimatePresence mode="popLayout">
                  {steps.length === 0 ? (
                    <Card className="p-12 text-center border-dashed bg-muted/30">
                      <p className="text-muted-foreground">
                        Add steps to build your workflow using the buttons above
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
                              className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                                editingStepIndex === index ? 'ring-2 ring-primary shadow-md' : ''
                              }`}
                              onClick={() => setEditingStepIndex(index)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                                    <Icon size={20} className="text-primary" weight="fill" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium">{step.id}</span>
                                      <Badge variant="outline" className="text-xs">
                                        {step.type}
                                      </Badge>
                                    </div>
                                    {Object.keys(step.config).length > 0 ? (
                                      <p className="text-xs text-muted-foreground">
                                        {Object.keys(step.config).length} configuration{Object.keys(step.config).length !== 1 ? 's' : ''} set
                                      </p>
                                    ) : (
                                      <p className="text-xs text-amber-600">Not configured</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {index < steps.length - 1 && (
                                    <ArrowRight size={20} className="text-muted-foreground" />
                                  )}
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
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
            </Card>

            {executionResult && (
              <Card className={`p-6 ${executionResult.error ? 'border-destructive bg-destructive/5' : 'border-green-500 bg-green-50'}`}>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {executionResult.error ? (
                      <Warning size={20} className="text-destructive" weight="fill" />
                    ) : (
                      <CheckCircle size={20} className="text-green-500" weight="fill" />
                    )}
                    <Label className="text-base">
                      {executionResult.error ? 'Test Failed' : 'Test Passed'}
                    </Label>
                  </div>
                  <ScrollArea className="max-h-64">
                    <pre className="text-xs bg-background p-4 rounded overflow-auto">
                      {JSON.stringify(executionResult, null, 2)}
                    </pre>
                  </ScrollArea>
                </div>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-6">
              <Label className="text-base mb-4 block">Step Configuration</Label>
              
              {editingStepIndex !== null && steps[editingStepIndex] ? (
                <StepEditor
                  step={steps[editingStepIndex]}
                  onChange={(updates) => updateStep(editingStepIndex, updates)}
                  tools={tools}
                />
              ) : (
                <Card className="p-8 text-center border-dashed bg-muted/30">
                  <p className="text-sm text-muted-foreground">
                    Select a step from the left to configure it
                  </p>
                </Card>
              )}
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Workflows</h2>
          <p className="text-sm text-muted-foreground">
            Automate complex tasks by chaining tools and AI together
          </p>
        </div>
        <Button onClick={startNewWorkflow} className="flex items-center gap-2">
          <Plus size={20} weight="bold" />
          Build Workflow
        </Button>
      </div>

      {!workflows || workflows.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <div className="max-w-md mx-auto space-y-4">
            <div className="flex justify-center">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500">
                <Lightning size={48} weight="fill" className="text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first automated workflow to chain together API calls, file operations, and AI processing
              </p>
              <Button onClick={startNewWorkflow} className="flex items-center gap-2 mx-auto">
                <Plus size={18} weight="bold" />
                Build Your First Workflow
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {workflows.map((workflow) => {
              const result = workflowResults.get(workflow.id)
              const isExecuting = executing === workflow.id

              return (
                <motion.div
                  key={workflow.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                >
                  <Card className="p-6 hover:shadow-md transition-shadow">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-1">{workflow.name}</h3>
                          <p className="text-sm text-muted-foreground">{workflow.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => executeWorkflow(workflow)}
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
                            variant="outline"
                            onClick={() => editWorkflow(workflow)}
                            disabled={isExecuting}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteWorkflow(workflow.id)}
                            disabled={isExecuting}
                          >
                            <Trash size={16} />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {workflow.steps.length} step{workflow.steps.length !== 1 ? 's' : ''}
                        </Badge>
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
                        <Card className={`p-4 ${result.success ? 'border-green-500 bg-green-50' : 'border-destructive bg-destructive/5'}`}>
                          <div className="flex items-start gap-3">
                            {result.success ? (
                              <CheckCircle size={20} className="text-green-500 shrink-0 mt-0.5" weight="fill" />
                            ) : (
                              <Warning size={20} className="text-destructive shrink-0 mt-0.5" weight="fill" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-medium">
                                  {result.success ? 'Execution Successful' : 'Execution Failed'}
                                </h4>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  onClick={() => {
                                    const newResults = new Map(workflowResults)
                                    newResults.delete(workflow.id)
                                    setWorkflowResults(newResults)
                                  }}
                                >
                                  <X size={14} />
                                </Button>
                              </div>
                              <ScrollArea className="max-h-48">
                                <pre className="text-xs bg-background/50 p-3 rounded overflow-auto">
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
      )}
    </div>
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
    <ScrollArea className="h-[600px] pr-4">
      <div className="space-y-4">
        {step.type === 'web-api' && (
          <>
            <div className="space-y-2">
              <Label>URL *</Label>
              <Input
                placeholder="https://api.example.com/endpoint"
                value={step.config.url || ''}
                onChange={(e) => updateConfig('url', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Use {'{{'} and {'}}'}  for variables: {'{{step.step-1.fieldName}}'}
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
                  <SelectItem value="PATCH">PATCH</SelectItem>
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
            <div className="space-y-2">
              <Label>Body (JSON, optional)</Label>
              <Textarea
                placeholder='{"key": "value"}'
                value={step.config.body ? JSON.stringify(step.config.body, null, 2) : ''}
                onChange={(e) => {
                  try {
                    updateConfig('body', JSON.parse(e.target.value))
                  } catch {
                    updateConfig('body', e.target.value)
                  }
                }}
                rows={4}
              />
            </div>
          </>
        )}

        {step.type === 'file-op' && (
          <>
            <div className="space-y-2">
              <Label>Operation *</Label>
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
                  <Label>GitHub Repo URL *</Label>
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
                  <p className="text-xs text-muted-foreground">
                    Leave empty to fetch directory listing
                  </p>
                </div>
              </>
            )}
            {(step.config.operation === 'store' || step.config.operation === 'retrieve') && (
              <div className="space-y-2">
                <Label>Key *</Label>
                <Input
                  placeholder="my-data-key"
                  value={step.config.key || ''}
                  onChange={(e) => updateConfig('key', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Use variables like {'{{step.step-1.result}}'}
                </p>
              </div>
            )}
            {step.config.operation === 'store' && (
              <div className="space-y-2">
                <Label>Content to Store</Label>
                <Textarea
                  placeholder='{{step.step-1.content}}'
                  value={step.config.content || ''}
                  onChange={(e) => updateConfig('content', e.target.value)}
                  rows={4}
                />
              </div>
            )}
          </>
        )}

        {step.type === 'ai-call' && (
          <>
            <div className="space-y-2">
              <Label>Prompt Template *</Label>
              <Textarea
                placeholder="Analyze this data: {{step.step-1.content}}"
                value={step.config.promptTemplate || ''}
                onChange={(e) => updateConfig('promptTemplate', e.target.value)}
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                Reference previous step outputs with {'{{step.stepId.field}}'}
              </p>
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
                className="rounded"
              />
              <Label htmlFor="json-mode" className="cursor-pointer">
                JSON Mode (returns structured data)
              </Label>
            </div>
          </>
        )}

        {step.type === 'transform' && (
          <>
            <div className="space-y-2">
              <Label>Input Variable *</Label>
              <Input
                placeholder="{{step.step-1.data}}"
                value={step.config.input || ''}
                onChange={(e) => updateConfig('input', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Transform Function *</Label>
              <Textarea
                placeholder="return input.toUpperCase()"
                value={step.config.transformFn || ''}
                onChange={(e) => updateConfig('transformFn', e.target.value)}
                rows={8}
              />
              <p className="text-xs text-muted-foreground">
                JavaScript function body. Available: input, context, results
              </p>
              <div className="p-3 bg-muted rounded text-xs space-y-1">
                <p className="font-medium">Example:</p>
                <code className="block">return input.toUpperCase()</code>
                <code className="block">return JSON.parse(input)</code>
                <code className="block">return input.split(',').map(x =&gt; x.trim())</code>
              </div>
            </div>
          </>
        )}

        <Separator />

        <div className="space-y-2">
          <Label>Step ID *</Label>
          <Input
            value={step.id}
            onChange={(e) => onChange({ id: e.target.value })}
            placeholder="unique-step-id"
          />
          <p className="text-xs text-muted-foreground">
            Must be unique. Used to reference this step's output in other steps.
          </p>
        </div>
      </div>
    </ScrollArea>
  )
}
