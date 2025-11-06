import { Tool, ToolCategory, ToolStatus } from '@/types/tool'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar2'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { CheckCircle, Circle, Warning, Gear, Pencil, Trash, Star, Sparkle, Play } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ToolCardProps {
  tool: Tool
  onEdit: (tool: Tool) => void
  onDelete: (id: string) => void
  onClick: (tool: Tool) => void
  onExecute?: () => void
}

const statusConfig: Record<ToolStatus, { icon: typeof CheckCircle; color: string; label: string }> = {
  enabled: { icon: CheckCircle, color: 'text-accent', label: 'Enabled' },
  disabled: { icon: Circle, color: 'text-muted-foreground', label: 'Disabled' },
  'needs-config': { icon: Warning, color: 'text-amber-500', label: 'Needs Config' },
}

const categoryColors: Record<ToolCategory, string> = {
  code: 'bg-blue-100 text-blue-700',
  data: 'bg-green-100 text-green-700',
  web: 'bg-purple-100 text-purple-700',
  productivity: 'bg-orange-100 text-orange-700',
  ai: 'bg-pink-100 text-pink-700',
  system: 'bg-gray-100 text-gray-700',
  other: 'bg-slate-100 text-slate-700',
}

export function ToolCard({ tool, onEdit, onDelete, onClick, onExecute }: ToolCardProps) {
  const StatusIcon = statusConfig[tool.status].icon

  return (
    <Card
      className={cn(
        "p-5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] group relative",
        tool.isFavorite && "ring-2 ring-amber-500/30"
      )}
      onClick={() => onClick(tool)}
    >
      {tool.isFavorite && (
        <Star
          size={20}
          weight="fill"
          className="absolute top-3 right-3 text-amber-500"
        />
      )}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <StatusIcon
            className={cn('flex-shrink-0', statusConfig[tool.status].color)}
            size={20}
            weight="fill"
          />
          <h3 className="font-medium text-lg text-foreground line-clamp-1">{tool.name}</h3>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onExecute && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-green-500/10 hover:text-green-600"
              onClick={(e) => {
                e.stopPropagation()
                onExecute()
              }}
              title="Execute tool"
            >
              <Play size={16} weight="fill" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(tool)
            }}
          >
            <Pencil size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(tool.id)
            }}
          >
            <Trash size={16} />
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
        {tool.description}
      </p>

      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary" className={cn('text-xs', categoryColors[tool.category])}>
          {tool.category}
        </Badge>
        {tool.isAiGenerated && (
          <Badge className="text-xs bg-gradient-to-r from-purple-500 to-pink-500">
            <Sparkle size={12} weight="fill" className="mr-1" />
            AI Generated
          </Badge>
        )}
        {tool.endpoint && (
          <Badge variant="outline" className="text-xs">
            <Gear size={12} className="mr-1" />
            Configured
          </Badge>
        )}
        {tool.tags?.map((tag) => (
          <Badge key={tag} variant="outline" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>

      {tool.usageCount !== undefined && tool.usageCount > 0 && (
        <div className="mt-3 text-xs text-muted-foreground">
          Used {tool.usageCount} {tool.usageCount === 1 ? 'time' : 'times'}
        </div>
      )}

      {tool.createdBy && (
        <div className="mt-3 pt-3 border-t border-border">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={tool.createdByAvatar} alt={tool.createdBy} />
                    <AvatarFallback className="text-[10px]">
                      {tool.createdBy.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">
                    Created by @{tool.createdBy}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Created by @{tool.createdBy}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </Card>
  )
}
