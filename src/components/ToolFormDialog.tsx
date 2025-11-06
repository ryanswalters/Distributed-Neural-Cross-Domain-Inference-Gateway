import { Tool, ToolFormData, ToolCategory } from '@/types/tool'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'
import { X, Star } from '@phosphor-icons/react'

interface ToolFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: ToolFormData) => void
  tool?: Tool
}

const categories: { value: ToolCategory; label: string }[] = [
  { value: 'code', label: 'Code' },
  { value: 'data', label: 'Data' },
  { value: 'web', label: 'Web' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'ai', label: 'AI' },
  { value: 'system', label: 'System' },
  { value: 'other', label: 'Other' },
]

export function ToolFormDialog({ open, onOpenChange, onSave, tool }: ToolFormDialogProps) {
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<ToolFormData>({
    defaultValues: {
      name: '',
      description: '',
      category: 'other',
      endpoint: '',
      apiKey: '',
      parameters: '',
      tags: [],
      isFavorite: false,
    }
  })

  const selectedCategory = watch('category')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    if (tool) {
      reset({
        name: tool.name,
        description: tool.description,
        category: tool.category,
        endpoint: tool.endpoint || '',
        apiKey: tool.apiKey || '',
        parameters: tool.parameters ? JSON.stringify(tool.parameters, null, 2) : '',
      })
      setTags(tool.tags || [])
      setIsFavorite(tool.isFavorite || false)
    } else {
      reset({
        name: '',
        description: '',
        category: 'other',
        endpoint: '',
        apiKey: '',
        parameters: '',
      })
      setTags([])
      setIsFavorite(false)
    }
  }, [tool, reset, open])

  const onSubmit = (data: ToolFormData) => {
    onSave({
      ...data,
      tags,
      isFavorite,
    })
    onOpenChange(false)
  }

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            {tool ? 'Edit Tool' : 'Add New Tool'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Tool Name *</Label>
            <Input
              id="name"
              placeholder="e.g., GitHub API"
              {...register('name', { required: 'Name is required' })}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="What does this tool do?"
              rows={3}
              {...register('description', { required: 'Description is required' })}
              className={errors.description ? 'border-destructive' : ''}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={selectedCategory} onValueChange={(value) => setValue('category', value as ToolCategory)}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endpoint">Endpoint URL</Label>
            <Input
              id="endpoint"
              placeholder="http://localhost:3000 or https://api.example.com/v1"
              {...register('endpoint')}
            />
            <p className="text-xs text-muted-foreground">
              Supports local addresses (localhost, 127.0.0.1) and remote URLs
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Optional API key"
              {...register('apiKey')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parameters">Parameters (JSON)</Label>
            <Textarea
              id="parameters"
              placeholder='{"timeout": "30s", "retries": 3}'
              rows={4}
              {...register('parameters')}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Custom Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                placeholder="Add a tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
              />
              <Button type="button" variant="secondary" onClick={handleAddTag}>
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <X
                      size={14}
                      className="cursor-pointer hover:text-destructive"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between space-x-2 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Star size={20} weight={isFavorite ? 'fill' : 'regular'} className={isFavorite ? 'text-amber-500' : ''} />
              <Label htmlFor="favorite" className="cursor-pointer">Mark as Favorite</Label>
            </div>
            <Switch
              id="favorite"
              checked={isFavorite}
              onCheckedChange={setIsFavorite}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {tool ? 'Save Changes' : 'Add Tool'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
