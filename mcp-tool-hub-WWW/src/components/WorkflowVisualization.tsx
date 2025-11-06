import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, ArrowDown, GitBranch, CheckCircle, Circle } from '@phosphor-icons/react'
import { WorkflowStep } from '@/lib/middleware-runtime'

interface WorkflowVisualizationProps {
  steps: WorkflowStep[]
  executionPath?: string[]
  skippedSteps?: string[]
  currentStep?: string
}

const stepTypeColors: Record<string, string> = {
  'web-api': 'bg-blue-500',
  'file-op': 'bg-green-500',
  'ai-call': 'bg-purple-500',
  'transform': 'bg-orange-500',
  'conditional': 'bg-yellow-500'
}

export function WorkflowVisualization({ 
  steps, 
  executionPath = [], 
  skippedSteps = [],
  currentStep 
}: WorkflowVisualizationProps) {
  const isExecuted = (stepId: string) => executionPath.includes(stepId)
  const isSkipped = (stepId: string) => skippedSteps.includes(stepId)
  const isCurrent = (stepId: string) => currentStep === stepId

  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const executed = isExecuted(step.id)
        const skipped = isSkipped(step.id)
        const current = isCurrent(step.id)
        const isConditional = step.type === 'conditional'

        return (
          <div key={step.id} className="relative">
            <div className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
              current ? 'border-primary bg-primary/5 shadow-md' :
              executed ? 'border-green-500 bg-green-50' :
              skipped ? 'border-gray-300 bg-gray-100 opacity-60' :
              'border-border'
            }`}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                executed ? 'bg-green-500' :
                current ? 'bg-primary' :
                skipped ? 'bg-gray-400' :
                stepTypeColors[step.type]
              }`}>
                {executed ? (
                  <CheckCircle size={18} weight="fill" className="text-white" />
                ) : (
                  <Circle size={18} weight={current ? 'fill' : 'regular'} className="text-white" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`font-medium text-sm ${
                    skipped ? 'text-gray-500' : 'text-foreground'
                  }`}>
                    {step.id}
                  </span>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      isConditional ? 'border-yellow-500 text-yellow-700' : ''
                    }`}
                  >
                    {step.type}
                  </Badge>
                  {executed && (
                    <Badge variant="default" className="text-xs bg-green-500">
                      Executed
                    </Badge>
                  )}
                  {skipped && (
                    <Badge variant="secondary" className="text-xs">
                      Skipped
                    </Badge>
                  )}
                  {current && (
                    <Badge variant="default" className="text-xs animate-pulse">
                      Running...
                    </Badge>
                  )}
                </div>
                {Object.keys(step.config).length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {step.config.url || step.config.promptTemplate || step.config.operation || step.config.condition || 'Configured'}
                  </p>
                )}
              </div>

              {isConditional && (
                <GitBranch size={20} className="text-yellow-600" weight="fill" />
              )}
            </div>

            {isConditional && step.config.branchType === 'simple' && (
              <div className="ml-12 mt-2 space-y-2">
                {step.config.thenStepId && (
                  <div className={`flex items-center gap-2 text-xs p-2 rounded border ${
                    executed && step.config.thenStepId ? 'border-green-500 bg-green-50' : 'border-border'
                  }`}>
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-muted-foreground">Then →</span>
                    <span className="font-medium">{step.config.thenStepId}</span>
                  </div>
                )}
                {step.config.elseStepId && (
                  <div className={`flex items-center gap-2 text-xs p-2 rounded border ${
                    executed && step.config.elseStepId ? 'border-red-500 bg-red-50' : 'border-border'
                  }`}>
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-muted-foreground">Else →</span>
                    <span className="font-medium">{step.config.elseStepId}</span>
                  </div>
                )}
              </div>
            )}

            {isConditional && step.config.branchType === 'multiple' && step.config.branches && (
              <div className="ml-12 mt-2 space-y-1">
                {step.config.branches.map((branch: any, branchIndex: number) => (
                  <div 
                    key={branchIndex}
                    className={`flex items-center gap-2 text-xs p-2 rounded border ${
                      executed && branch.nextStepId ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      branch.isDefault ? 'bg-gray-500' : 'bg-blue-500'
                    }`} />
                    <span className="text-muted-foreground">
                      {branch.label || `Branch ${branchIndex + 1}`} →
                    </span>
                    <span className="font-medium">{branch.nextStepId}</span>
                  </div>
                ))}
              </div>
            )}

            {index < steps.length - 1 && (
              <div className="flex justify-center py-1">
                <ArrowDown 
                  size={16} 
                  className={
                    executed ? 'text-green-500' :
                    current ? 'text-primary' :
                    'text-muted-foreground'
                  }
                  weight="bold"
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
