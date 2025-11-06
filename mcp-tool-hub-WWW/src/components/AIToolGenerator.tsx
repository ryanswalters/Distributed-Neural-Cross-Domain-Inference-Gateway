import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Sparkle, CircleNotch, CheckCircle, Warning, Code, Rocket } from '@phosphor-icons/react'
import { GeneratedToolSpec } from '@/types/tool'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface AIToolGeneratorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onToolGenerated: (toolSpec: GeneratedToolSpec) => void
}

type GenerationStage = 'input' | 'generating' | 'preview' | 'complete'

declare const spark: {
  llmPrompt: (strings: TemplateStringsArray, ...values: any[]) => string
  llm: (prompt: string, modelName?: string, jsonMode?: boolean) => Promise<string>
}

export function AIToolGenerator({ open, onOpenChange, onToolGenerated }: AIToolGeneratorProps) {
  const [prompt, setPrompt] = useState('')
  const [stage, setStage] = useState<GenerationStage>('input')
  const [generatedSpec, setGeneratedSpec] = useState<GeneratedToolSpec | null>(null)
  const [error, setError] = useState<string | null>(null)

  const examplePrompts = [
    'A CSV data cleaning tool that removes duplicates and normalizes column names',
    'A JSON to YAML converter API endpoint',
    'A tool to fetch cryptocurrency prices from CoinGecko',
    'A markdown to HTML converter with syntax highlighting',
    'A URL shortener service with analytics tracking'
  ]

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please describe the tool you need')
      return
    }

    setStage('generating')
    setError(null)

    try {
      const generationPrompt = spark.llmPrompt`You are an expert at creating API tools and MCP-compatible services. Generate a complete tool specification based on this user request:

"${prompt}"

Create a tool that:
1. Has a clear, descriptive name (2-4 words)
2. Includes a detailed description of what it does
3. Fits into one of these categories: code, data, web, productivity, ai, system, other
4. Defines any necessary parameters as a JSON object
5. Includes relevant tags for discoverability
6. Provides working implementation code (JavaScript/TypeScript function)
7. Suggests a test endpoint URL (can be a mock endpoint or real API)

The code should be production-ready and include:
- Input validation
- Error handling
- Clear comments
- TypeScript types if applicable
- Return structured JSON responses

Return ONLY valid JSON with this exact structure:
{
  "toolSpec": {
    "name": "Tool Name",
    "description": "Detailed description of what the tool does and how to use it",
    "category": "code|data|web|productivity|ai|system|other",
    "endpoint": "https://api.example.com/v1/tool-endpoint",
    "parameters": {
      "param1": "description of param1",
      "param2": "description of param2"
    },
    "tags": ["tag1", "tag2", "tag3"],
    "code": "// Complete implementation code as a string\nasync function handler(params) {\n  // implementation\n}",
    "testEndpoint": "https://mockapi.example.com/test"
  }
}`

      const response = await spark.llm(generationPrompt, 'gpt-4o', true)
      const parsed = JSON.parse(response)
      
      if (!parsed.toolSpec) {
        throw new Error('Invalid response format from AI')
      }

      setGeneratedSpec(parsed.toolSpec)
      setStage('preview')
      toast.success('Tool generated successfully!')
    } catch (err) {
      console.error('Generation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate tool')
      setStage('input')
      toast.error('Failed to generate tool. Please try again.')
    }
  }

  const handleDeploy = () => {
    if (!generatedSpec) return

    onToolGenerated(generatedSpec)
    setStage('complete')
    
    setTimeout(() => {
      handleClose()
    }, 2000)
  }

  const handleClose = () => {
    setPrompt('')
    setStage('input')
    setGeneratedSpec(null)
    setError(null)
    onOpenChange(false)
  }

  const handleTryAnother = () => {
    setPrompt('')
    setStage('input')
    setGeneratedSpec(null)
    setError(null)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <Sparkle size={24} weight="fill" className="text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl">AI Tool Generator</DialogTitle>
              <DialogDescription>
                Describe what you need, and AI will create it for you
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {stage === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="tool-prompt" className="text-base font-medium">
                  What tool do you need?
                </Label>
                <Textarea
                  id="tool-prompt"
                  placeholder="Describe the tool you want to create... Be specific about functionality, data sources, and expected behavior."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={5}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Example prompts:</p>
                <div className="flex flex-wrap gap-2">
                  {examplePrompts.map((example, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => setPrompt(example)}
                    >
                      {example}
                    </Badge>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2">
                  <Warning size={20} className="text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleGenerate} disabled={!prompt.trim()}>
                  <Sparkle size={18} weight="fill" className="mr-2" />
                  Generate Tool
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {stage === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 flex flex-col items-center justify-center gap-4"
            >
              <CircleNotch size={48} className="text-primary animate-spin" />
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">Creating your tool...</p>
                <p className="text-sm text-muted-foreground">
                  AI is generating the code and configuration
                </p>
              </div>
            </motion.div>
          )}

          {stage === 'preview' && generatedSpec && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{generatedSpec.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {generatedSpec.description}
                    </p>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {generatedSpec.category}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2">
                  {generatedSpec.tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Endpoint</Label>
                <div className="p-3 rounded-md bg-muted font-mono text-sm">
                  {generatedSpec.endpoint}
                </div>
              </div>

              {Object.keys(generatedSpec.parameters).length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Parameters</Label>
                  <div className="p-3 rounded-md bg-muted space-y-2">
                    {Object.entries(generatedSpec.parameters).map(([key, value]) => (
                      <div key={key} className="text-sm">
                        <span className="font-mono font-medium">{key}</span>
                        <span className="text-muted-foreground">: {value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Code size={18} className="text-muted-foreground" />
                  <Label className="text-sm font-medium">Generated Code</Label>
                </div>
                <div className="p-3 rounded-md bg-muted/80 font-mono text-xs overflow-x-auto max-h-64 overflow-y-auto">
                  <pre className="whitespace-pre-wrap">{generatedSpec.code}</pre>
                </div>
              </div>

              <DialogFooter className="flex gap-2">
                <Button variant="outline" onClick={handleTryAnother}>
                  Try Another
                </Button>
                <Button onClick={handleDeploy} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                  <Rocket size={18} weight="fill" className="mr-2" />
                  Deploy Tool
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {stage === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 flex flex-col items-center justify-center gap-4"
            >
              <div className="p-4 rounded-full bg-green-500/10">
                <CheckCircle size={64} weight="fill" className="text-green-500" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold">Tool Deployed!</p>
                <p className="text-sm text-muted-foreground">
                  Your new tool is now available in your collection
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
