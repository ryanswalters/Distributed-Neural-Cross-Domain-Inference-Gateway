
import * as React from 'react'

import { cn } from '@/lib/utils'


interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>
{
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
    size?: 'default' | 'sm' | 'lg' | 'icon'
}


const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
        <button
        className={cn(
            'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none',
            {
            'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default',
            'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'destructive',
            'border border-input hover:bg-accent hover:text-accent-foreground': variant === 'outline',
            'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
            'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
            'underline-offset-4 hover:underline text-primary': variant === 'link',
            },
            {
            'h-10 py-2 px-4': size === 'default',
            'h-9 px-3 rounded-md': size === 'sm',
            'h-11 px-8 rounded-md': size === 'lg',
            'h-10 w-10': size === 'icon',
            },
            className
        )}
        ref={ref}
        {...props}
        />
    )
    }
)


Button.displayName = 'Button'


export { Button }






- path: src/components/ui/card.tsx
contents: >-
import * as React from 'react'

import { cn } from '@/lib/utils'


const Card = React.forwardRef<HTMLDivElement,
React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)}
        {...props}
    />
    )
)

Card.displayName = 'Card'


const CardHeader = React.forwardRef<HTMLDivElement,
React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
    )
)

CardHeader.displayName = 'CardHeader'


const CardTitle = React.forwardRef<HTMLParagraphElement,
React.HTMLAttributes<HTMLHeadingElement>>(
    ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-2xl font-semibold leading-none tracking-tight', className)} {...props} />
    )
)

CardTitle.displayName = 'CardTitle'


const CardDescription = React.forwardRef<HTMLParagraphElement,
React.HTMLAttributes<HTMLParagraphElement>>(
    ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
    )
)

CardDescription.displayName = 'CardDescription'


const CardContent = React.forwardRef<HTMLDivElement,
React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
)

CardContent.displayName = 'CardContent'


const CardFooter = React.forwardRef<HTMLDivElement,
React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
    )
)

CardFooter.displayName = 'CardFooter'


export { Card, CardHeader, CardFooter, CardTitle, CardDescription,
CardContent }