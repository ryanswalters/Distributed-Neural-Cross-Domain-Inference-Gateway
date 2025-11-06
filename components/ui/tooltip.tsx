import * as React from 'react'

import { cn } from '@/lib/utils'


interface TooltipProps {
    children: React.ReactNode
}


const TooltipProvider = ({ children }: TooltipProps) => <>{children}</>


const Tooltip = ({ children }: TooltipProps) => {
    const [open, setOpen] = React.useState(false)
    return (
    <TooltipContext.Provider value={{ open, setOpen }}>
        <div className="relative inline-block">{children}</div>
    </TooltipContext.Provider>
    )
}


const TooltipContext = React.createContext<{
    open: boolean
    setOpen: (open: boolean) => void
}>({ open: false, setOpen: () => {} })


const TooltipTrigger = React.forwardRef<HTMLDivElement,
React.HTMLAttributes<HTMLDivElement>>(
    ({ children, ...props }, ref) => {
    const { setOpen } = React.useContext(TooltipContext)
    return (
        <div
        ref={ref}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        {...props}
        >
        {children}
        </div>
    )
    }
)

TooltipTrigger.displayName = 'TooltipTrigger'


const TooltipContent = React.forwardRef<HTMLDivElement,
React.HTMLAttributes<HTMLDivElement>>(
    ({ className, children, ...props }, ref) => {
    const { open } = React.useContext(TooltipContext)
    if (!open) return null
    return (
        <div
        ref={ref}
        className={cn(
            'absolute z-50 -top-2 left-1/2 -translate-x-1/2 -translate-y-full rounded-md bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md',
            className
        )}
        {...props}
        >
        {children}
        </div>
    )
    }
)

TooltipContent.displayName = 'TooltipContent'


export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent }