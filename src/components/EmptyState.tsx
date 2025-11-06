import { Package } from '@phosphor-icons/react'

interface EmptyStateProps {
  onAddTool: () => void
}

export function EmptyState({ onAddTool }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
      <div className="bg-muted rounded-full p-6 mb-4">
        <Package size={48} className="text-muted-foreground" weight="duotone" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No tools yet</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        Get started by adding your first MCP tool, or browse the MCP Library to add popular servers with one click.
      </p>
      <button
        onClick={onAddTool}
        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
      >
        Add Your First Tool
      </button>
    </div>
  )
}
