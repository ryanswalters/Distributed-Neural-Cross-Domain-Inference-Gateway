import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Brain, Sparkle, X } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'

interface Suggestion {
  id: string
  capability: string
  description: string
  category: string
  confidence: number
}

interface NeedDetectorProps {
  existingTools: string[]
  onGenerateTool: (need: string) => void
}

export function NeedDetector({ existingTools, onGenerateTool }: NeedDetectorProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([
    {
      id: '1',
      capability: 'CSV Data Cleaning',
      description: 'No tool registered for data cleaning on CSV files. This would be useful for preprocessing data before analysis.',
      category: 'data',
      confidence: 0.85
    },
    {
      id: '2',
      capability: 'Image Optimization API',
      description: 'Missing image processing capabilities. An image optimizer could compress and resize images automatically.',
      category: 'web',
      confidence: 0.72
    },
    {
      id: '3',
      capability: 'Webhook Proxy',
      description: 'No webhook handling tool detected. A proxy could capture and debug incoming webhooks.',
      category: 'productivity',
      confidence: 0.68
    }
  ])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const handleDismiss = (id: string) => {
    setDismissed(prev => new Set([...prev, id]))
  }

  const handleGenerate = (suggestion: Suggestion) => {
    onGenerateTool(`${suggestion.capability}: ${suggestion.description}`)
    handleDismiss(suggestion.id)
  }

  const activeSuggestions = suggestions.filter(s => !dismissed.has(s.id))

  if (activeSuggestions.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Brain size={20} weight="fill" className="text-purple-500" />
        <h3 className="text-sm font-medium">Suggested Tools</h3>
        <Badge variant="secondary" className="text-xs">
          AI-Powered
        </Badge>
      </div>

      <AnimatePresence mode="popLayout">
        {activeSuggestions.map((suggestion) => (
          <motion.div
            key={suggestion.id}
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-4 border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50/50 to-transparent">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{suggestion.capability}</h4>
                    <Badge variant="outline" className="capitalize text-xs">
                      {suggestion.category}
                    </Badge>
                    <Badge 
                      variant="secondary" 
                      className="text-xs"
                    >
                      {Math.round(suggestion.confidence * 100)}% match
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {suggestion.description}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleGenerate(suggestion)}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      <Sparkle size={14} weight="fill" className="mr-1" />
                      Generate Tool
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDismiss(suggestion.id)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0"
                  onClick={() => handleDismiss(suggestion.id)}
                >
                  <X size={16} />
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
