import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Workflow, WorkflowStep } from '@/lib/middleware-runtime'
import { GitBranch, Brain, GlobeHemisphereWest, Lightning } from '@phosphor-icons/react'

export const workflowTemplates: Array<{
  name: string
  description: string
  category: string
  icon: React.ReactNode
  workflow: Omit<Workflow, 'id'>
}> = [
  {
    name: 'Conditional API Response Handler',
    description: 'Fetch data from an API and route processing based on response status',
    category: 'API Automation',
    icon: <GitBranch size={24} weight="fill" />,
    workflow: {
      name: 'Conditional API Response Handler',
      description: 'Demonstrates conditional branching based on API response status',
      steps: [
        {
          id: 'fetch-data',
          type: 'web-api',
          config: {
            url: 'https://api.github.com/repos/facebook/react',
            method: 'GET',
            headers: {}
          }
        },
        {
          id: 'check-status',
          type: 'conditional',
          config: {
            branchType: 'simple',
            condition: 'step("fetch-data").stargazers_count > 200000',
            thenStepId: 'high-stars-handler',
            elseStepId: 'low-stars-handler'
          }
        },
        {
          id: 'high-stars-handler',
          type: 'transform',
          config: {
            input: '{{step.fetch-data.name}}',
            transformFn: 'return "🌟 Popular repo: " + input + " with " + results["fetch-data"].stargazers_count + " stars!"'
          }
        },
        {
          id: 'low-stars-handler',
          type: 'transform',
          config: {
            input: '{{step.fetch-data.name}}',
            transformFn: 'return "📦 Growing repo: " + input + " with " + results["fetch-data"].stargazers_count + " stars"'
          }
        }
      ],
      context: {}
    }
  },
  {
    name: 'Multi-Branch Data Router',
    description: 'Route data to different AI analysis based on content type',
    category: 'Data Processing',
    icon: <Lightning size={24} weight="fill" />,
    workflow: {
      name: 'Multi-Branch Data Router',
      description: 'Demonstrates multiple conditional branches for different data types',
      steps: [
        {
          id: 'input-data',
          type: 'transform',
          config: {
            input: 'sample',
            transformFn: 'return { type: "code", content: "function hello() { return \\"world\\"; }" }'
          }
        },
        {
          id: 'route-by-type',
          type: 'conditional',
          config: {
            branchType: 'multiple',
            branches: [
              {
                label: 'Code Analysis',
                condition: 'step("input-data").type === "code"',
                nextStepId: 'analyze-code',
                isDefault: false
              },
              {
                label: 'Text Summary',
                condition: 'step("input-data").type === "text"',
                nextStepId: 'summarize-text',
                isDefault: false
              },
              {
                label: 'JSON Validation',
                condition: 'step("input-data").type === "json"',
                nextStepId: 'validate-json',
                isDefault: false
              },
              {
                label: 'Default Handler',
                condition: 'true',
                nextStepId: 'default-handler',
                isDefault: true
              }
            ]
          }
        },
        {
          id: 'analyze-code',
          type: 'ai-call',
          config: {
            promptTemplate: 'Analyze this code and suggest improvements: {{step.input-data.content}}',
            model: 'gpt-4o-mini',
            jsonMode: false
          }
        },
        {
          id: 'summarize-text',
          type: 'ai-call',
          config: {
            promptTemplate: 'Summarize this text in one sentence: {{step.input-data.content}}',
            model: 'gpt-4o-mini',
            jsonMode: false
          }
        },
        {
          id: 'validate-json',
          type: 'transform',
          config: {
            input: '{{step.input-data.content}}',
            transformFn: 'try { JSON.parse(input); return { valid: true } } catch(e) { return { valid: false, error: e.message } }'
          }
        },
        {
          id: 'default-handler',
          type: 'transform',
          config: {
            input: '{{step.input-data.type}}',
            transformFn: 'return "Unknown type: " + input'
          }
        }
      ],
      context: {}
    }
  },
  {
    name: 'Smart API Fallback Chain',
    description: 'Try multiple APIs with fallback logic when primary fails',
    category: 'Reliability',
    icon: <GlobeHemisphereWest size={24} weight="fill" />,
    workflow: {
      name: 'Smart API Fallback Chain',
      description: 'Demonstrates error handling with conditional fallback to backup APIs',
      steps: [
        {
          id: 'try-primary-api',
          type: 'web-api',
          config: {
            url: 'https://api.github.com/users/octocat',
            method: 'GET'
          }
        },
        {
          id: 'check-primary-success',
          type: 'conditional',
          config: {
            branchType: 'simple',
            condition: 'step("try-primary-api").login !== undefined',
            thenStepId: 'process-primary',
            elseStepId: 'try-fallback-api'
          }
        },
        {
          id: 'process-primary',
          type: 'transform',
          config: {
            input: '{{step.try-primary-api.login}}',
            transformFn: 'return "✅ Primary API success: " + input'
          }
        },
        {
          id: 'try-fallback-api',
          type: 'web-api',
          config: {
            url: 'https://api.github.com/repos/facebook/react',
            method: 'GET'
          }
        },
        {
          id: 'process-fallback',
          type: 'transform',
          config: {
            input: '{{step.try-fallback-api.name}}',
            transformFn: 'return "⚠️ Fallback API used: " + input'
          }
        }
      ],
      context: {}
    }
  }
]

interface WorkflowTemplatesProps {
  onSelectTemplate: (workflow: Omit<Workflow, 'id'>) => void
}

export function WorkflowTemplates({ onSelectTemplate }: WorkflowTemplatesProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {workflowTemplates.map((template, index) => (
        <Card key={index} className="p-5 hover:shadow-lg transition-shadow">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                {template.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm mb-1">{template.name}</h3>
                <Badge variant="secondary" className="text-xs mb-2">
                  {template.category}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  {template.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <GitBranch size={14} />
              <span>{template.workflow.steps.length} steps</span>
              <span>•</span>
              <span>
                {template.workflow.steps.filter(s => s.type === 'conditional').length} branches
              </span>
            </div>

            <Button 
              size="sm" 
              className="w-full"
              onClick={() => onSelectTemplate(template.workflow)}
            >
              Use Template
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
