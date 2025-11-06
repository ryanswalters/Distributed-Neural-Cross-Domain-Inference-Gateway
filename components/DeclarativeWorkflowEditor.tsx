import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useRuntime } from '@/hooks/useRuntime'
import { Workflow } from '@/lib/runtime-core'

interface DeclarativeWorkflowEditorProps {
  onWorkflowRegistered?: (workflow: Workflow) => void
}

export function DeclarativeWorkflowEditor({ onWorkflowRegistered }: DeclarativeWorkflowEditorProps) {
  const { runtime } = useRuntime()
  const [workflowDefinition, setWorkflowDefinition] = useState('')
  const [format, setFormat] = useState<'yaml' | 'json'>('yaml')
  const [validationResult, setValidationResult] = useState<{ valid: boolean; errors: string[] } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastRegisteredWorkflow, setLastRegisteredWorkflow] = useState<Workflow | null>(null)

  const handleValidate = useCallback(async () => {
    if (!runtime || !workflowDefinition.trim()) return

    try {
      const result = runtime.validateWorkflowDefinition(workflowDefinition, format)
      setValidationResult(result)
      
      if (result.valid) {
        console.log('[DeclarativeWorkflowEditor] Workflow definition is valid')
      } else {
        console.warn('[DeclarativeWorkflowEditor] Workflow validation failed:', result.errors)
      }
    } catch (error) {
      console.error('[DeclarativeWorkflowEditor] Validation error:', error)
      setValidationResult({
        valid: false,
        errors: [error instanceof Error ? error.message : String(error)]
      })
    }
  }, [runtime, workflowDefinition, format])

  const handleRegister = useCallback(async () => {
    if (!runtime || !workflowDefinition.trim()) return

    setIsLoading(true)
    try {
      const workflow = runtime.registerDeclarativeWorkflow(workflowDefinition, format)
      setLastRegisteredWorkflow(workflow)
      setValidationResult({ valid: true, errors: [] })
      
      console.log('[DeclarativeWorkflowEditor] Workflow registered successfully:', workflow.id)
      
      if (onWorkflowRegistered) {
        onWorkflowRegistered(workflow)
      }
    } catch (error) {
      console.error('[DeclarativeWorkflowEditor] Failed to register workflow:', error)
      setValidationResult({
        valid: false,
        errors: [error instanceof Error ? error.message : String(error)]
      })
    } finally {
      setIsLoading(false)
    }
  }, [runtime, workflowDefinition, format, onWorkflowRegistered])

  const handleGenerateTemplate = useCallback(() => {
    if (!runtime) return
    
    const template = runtime.generateWorkflowTemplate()
    setWorkflowDefinition(template)
    setValidationResult(null)
    console.log('[DeclarativeWorkflowEditor] Generated workflow template')
  }, [runtime])

  const handleFormatChange = (newFormat: 'yaml' | 'json') => {
    setFormat(newFormat)
    setValidationResult(null)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Declarative Workflow Editor
          <Badge variant="outline" className="ml-2">
            {format.toUpperCase()}
          </Badge>
        </CardTitle>
        <CardDescription>
          Define workflows using YAML or JSON. No code required.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Format Selection */}
        <div className="flex gap-2">
          <Button
            variant={format === 'yaml' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFormatChange('yaml')}
          >
            YAML
          </Button>
          <Button
            variant={format === 'json' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFormatChange('json')}
          >
            JSON
          </Button>
        </div>

        {/* Editor */}
        <div className="space-y-2">
          <label htmlFor="workflow-definition" className="text-sm font-medium">
            Workflow Definition
          </label>
          <Textarea
            id="workflow-definition"
            value={workflowDefinition}
            onChange={(e) => setWorkflowDefinition(e.target.value)}
            placeholder={`Enter your workflow definition in ${format.toUpperCase()} format...`}
            className="font-mono text-sm min-h-[400px]"
            disabled={isLoading}
          />
        </div>

        {/* Validation Results */}
        {validationResult && (
          <Alert variant={validationResult.valid ? 'default' : 'destructive'}>
            <AlertDescription>
              {validationResult.valid ? (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Valid</Badge>
                  <span>Workflow definition is valid and ready to register.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">Invalid</Badge>
                    <span>Workflow definition has errors:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1">
                    {validationResult.errors.map((error, index) => (
                      <li key={index} className="text-sm">
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Success Message */}
        {lastRegisteredWorkflow && (
          <Alert variant="default" className="border-green-200 bg-green-50">
            <AlertDescription>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-100">
                  Success
                </Badge>
                <span>
                  Workflow "{lastRegisteredWorkflow.name}" registered successfully!
                </span>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={handleGenerateTemplate}
            variant="outline"
            disabled={isLoading}
          >
            Generate Template
          </Button>
          
          <Button
            onClick={handleValidate}
            variant="outline"
            disabled={isLoading || !workflowDefinition.trim()}
          >
            Validate
          </Button>
          
          <Button
            onClick={handleRegister}
            disabled={isLoading || !workflowDefinition.trim() || (validationResult && !validationResult.valid)}
          >
            {isLoading ? 'Registering...' : 'Register Workflow'}
          </Button>
        </div>

        {/* Features List */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2">Supported Features:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Web API</Badge>
              <span>HTTP requests with templating</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">File Operations</Badge>
              <span>GitHub file fetch, storage ops</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">AI Calls</Badge>
              <span>LLM prompts with models</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Transform</Badge>
              <span>JavaScript transformations</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Conditional</Badge>
              <span>Branching logic</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Tool Calls</Badge>
              <span>Execute registered tools</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Example workflow definitions for quick start
export const EXAMPLE_WORKFLOWS = {
  githubDataProcessor: `version: '1.0'
name: 'GitHub Data Processor'
description: 'Fetch data from GitHub and process it with AI'

metadata:
  author: 'MCP Tool Hub'
  tags: ['github', 'ai', 'data-processing']
  timeout: 60000

inputs:
  repoUrl:
    type: 'string'
    required: true
    description: 'GitHub repository URL'
    validation:
      pattern: '^https://github.com/[^/]+/[^/]+$'

steps:
  fetchReadme:
    type: 'file-op'
    description: 'Fetch README from GitHub repository'
    config:
      operation: 'fetch'
      repoUrl: '{{repoUrl}}'
      filePath: 'README.md'

  analyzeReadme:
    type: 'ai-call'
    dependsOn: ['fetchReadme']
    description: 'Analyze README content with AI'
    config:
      promptTemplate: |
        Analyze this README file and provide:
        1. Project purpose
        2. Key features
        3. Installation instructions
        4. Usage examples

        README Content:
        {{fetchReadme.content}}
      model: 'gpt-4o'
      jsonMode: true

  generateSummary:
    type: 'transform'
    dependsOn: ['analyzeReadme']
    description: 'Transform AI analysis into markdown summary'
    config:
      input: '{{analyzeReadme}}'
      transformFn: |
        const analysis = JSON.parse(input);
        return \`# Project Analysis
        
        ## Purpose
        \${analysis.purpose}
        
        ## Features
        \${analysis.features.join('\\n')}
        
        ## Installation
        \${analysis.installation}
        
        ## Usage
        \${analysis.usage}
        \`;

outputs:
  readmeContent: 'fetchReadme.content'
  aiAnalysis: 'analyzeReadme'
  summary: 'generateSummary'`,

  apiHealthChecker: `version: '1.0'
name: 'API Health Checker'
description: 'Monitor multiple API endpoints and report status'

metadata:
  author: 'MCP Tool Hub'
  tags: ['monitoring', 'api', 'health-check']
  timeout: 30000

inputs:
  endpoints:
    type: 'array'
    required: true
    description: 'List of API endpoints to check'
    default:
      - 'https://api.github.com'
      - 'https://jsonplaceholder.typicode.com'

steps:
  checkEndpoints:
    type: 'transform'
    description: 'Check each endpoint health'
    config:
      input: '{{endpoints}}'
      transformFn: |
        async function checkEndpoint(url) {
          try {
            const startTime = Date.now();
            const response = await fetch(url, { method: 'HEAD' });
            const duration = Date.now() - startTime;
            
            return {
              url,
              status: response.status,
              healthy: response.ok,
              responseTime: duration,
              checkedAt: new Date().toISOString()
            };
          } catch (error) {
            return {
              url,
              status: 0,
              healthy: false,
              error: error.message,
              checkedAt: new Date().toISOString()
            };
          }
        }
        
        const checks = await Promise.all(input.map(checkEndpoint));
        return {
          total: checks.length,
          healthy: checks.filter(c => c.healthy).length,
          unhealthy: checks.filter(c => !c.healthy).length,
          checks: checks
        };

  generateReport:
    type: 'ai-call'
    dependsOn: ['checkEndpoints']
    description: 'Generate health report summary'
    config:
      promptTemplate: |
        Generate a brief health check report for these API endpoints:
        
        {{checkEndpoints.checks}}
        
        Total: {{checkEndpoints.total}}
        Healthy: {{checkEndpoints.healthy}}
        Unhealthy: {{checkEndpoints.unhealthy}}
        
        Provide a concise summary and any recommendations.
      model: 'gpt-4o'

outputs:
  healthChecks: 'checkEndpoints.checks'
  summary: 'generateReport'
  stats: 'checkEndpoints'
`
}