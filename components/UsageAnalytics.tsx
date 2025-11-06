import { Tool } from '@/types/tool'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChartBar, TrendUp, Clock } from '@phosphor-icons/react'
import { useMemo } from 'react'

interface UsageAnalyticsProps {
  tools: Tool[]
}

export function UsageAnalytics({ tools }: UsageAnalyticsProps) {
  const analytics = useMemo(() => {
    const sortedByUsage = [...tools]
      .filter(t => (t.usageCount || 0) > 0)
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, 5)

    const sortedByRecent = [...tools]
      .filter(t => t.lastUsedAt)
      .sort((a, b) => (b.lastUsedAt || 0) - (a.lastUsedAt || 0))
      .slice(0, 5)

    const totalUsage = tools.reduce((sum, tool) => sum + (tool.usageCount || 0), 0)
    
    const categoryUsage = tools.reduce((acc, tool) => {
      const count = tool.usageCount || 0
      acc[tool.category] = (acc[tool.category] || 0) + count
      return acc
    }, {} as Record<string, number>)

    const topCategory = Object.entries(categoryUsage)
      .sort(([, a], [, b]) => b - a)[0]

    return {
      mostUsed: sortedByUsage,
      recentlyUsed: sortedByRecent,
      totalUsage,
      topCategory: topCategory ? { name: topCategory[0], count: topCategory[1] } : null,
    }
  }, [tools])

  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  if (tools.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <ChartBar size={24} className="text-primary" weight="fill" />
            <h3 className="font-medium">Total Usage</h3>
          </div>
          <p className="text-3xl font-semibold">{analytics.totalUsage}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Across {tools.length} tool{tools.length !== 1 ? 's' : ''}
          </p>
        </Card>

        {analytics.topCategory && (
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <TrendUp size={24} className="text-accent" weight="fill" />
              <h3 className="font-medium">Top Category</h3>
            </div>
            <p className="text-2xl font-semibold capitalize">{analytics.topCategory.name}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {analytics.topCategory.count} use{analytics.topCategory.count !== 1 ? 's' : ''}
            </p>
          </Card>
        )}

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <Clock size={24} className="text-secondary" weight="fill" />
            <h3 className="font-medium">Active Tools</h3>
          </div>
          <p className="text-3xl font-semibold">
            {tools.filter(t => t.status === 'enabled').length}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Ready to use
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {analytics.mostUsed.length > 0 && (
          <Card className="p-5">
            <h3 className="font-semibold text-lg mb-4">Most Used Tools</h3>
            <div className="space-y-3">
              {analytics.mostUsed.map((tool, index) => (
                <div key={tool.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Badge variant="secondary" className="w-6 h-6 flex items-center justify-center text-xs">
                      {index + 1}
                    </Badge>
                    <span className="font-medium truncate">{tool.name}</span>
                  </div>
                  <Badge variant="outline">{tool.usageCount} uses</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        {analytics.recentlyUsed.length > 0 && (
          <Card className="p-5">
            <h3 className="font-semibold text-lg mb-4">Recently Used</h3>
            <div className="space-y-3">
              {analytics.recentlyUsed.map((tool) => (
                <div key={tool.id} className="flex items-center justify-between">
                  <span className="font-medium truncate flex-1 min-w-0">{tool.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {tool.lastUsedAt && formatRelativeTime(tool.lastUsedAt)}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
