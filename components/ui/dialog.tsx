import * as React from 'react'

import { X } from '@phosphor-icons/react'

import { cn } from '@/lib/utils'
import path from 'path/win32'


interface DialogProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    children: React.ReactNode
}


const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
    React.useEffect(() => {
    if (open) {
        document.body.style.overflow = 'hidden'
    } else {
        document.body.style.overflow = 'unset'
    }
    return () => {
        document.body.style.overflow = 'unset'
    }
    }, [open])

    if (!open) return null

    return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div 
        className="fixed inset-0 bg-black/50" 
        onClick={() => onOpenChange?.(false)}
        />
        <div className="relative z-50">{children}</div>
    </div>
    )
}


const DialogContent = React.forwardRef<HTMLDivElement,
React.HTMLAttributes<HTMLDivElement>>(
    ({ className, children, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
        'relative bg-background rounded-lg shadow-lg p-6 w-full max-w-lg',
        className
        )}
        {...props}
    >
        {children}
    </div>
    )
)

DialogContent.displayName = 'DialogContent'


const DialogHeader = ({ className, ...props }:
React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('flex flex-col space-y-1.5 mb-4', className)} {...props} />
)


const DialogTitle = React.forwardRef<HTMLHeadingElement,
React.HTMLAttributes<HTMLHeadingElement>>(
    ({ className, ...props }, ref) => (
    <h2 ref={ref} className={cn('text-lg font-semibold', className)} {...props} />
    )
)

DialogTitle.displayName = 'DialogTitle'


const DialogDescription = React.forwardRef<HTMLParagraphElement,
React.HTMLAttributes<HTMLParagraphElement>>(
    ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
    )
)

DialogDescription.displayName = 'DialogDescription'


const DialogFooter = ({ className, ...props }:
React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('flex justify-end gap-2 mt-6', className)} {...props} />
)


export { Dialog, DialogContent, DialogHeader, DialogTitle,
DialogDescription, DialogFooter }