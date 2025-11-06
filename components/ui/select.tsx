import * as React from 'react'

import { cn } from '@/lib/utils'

import { CaretDown, Check } from '@phosphor-icons/react'


interface SelectProps {
    value: string
    onValueChange: (value: string) => void
    children: React.ReactNode
}


const Select = ({ value, onValueChange, children }: SelectProps) => {
    return (
    <SelectContext.Provider value={{ value, onValueChange }}>
        {children}
    </SelectContext.Provider>
    )
}


const SelectContext = React.createContext<{
    value: string
    onValueChange: (value: string) => void
}>({ value: '', onValueChange: () => {} })


const SelectTrigger = React.forwardRef<HTMLButtonElement,
React.ButtonHTMLAttributes<HTMLButtonElement>>(
    ({ className, children, ...props }, ref) => {
    const [open, setOpen] = React.useState(false)

    return (
        <button
        ref={ref}
        type="button"
        className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            className
        )}
        onClick={() => setOpen(!open)}
        {...props}
        >
        {children}
        <CaretDown size={16} className="opacity-50" />
        </button>
    )
    }
)

SelectTrigger.displayName = 'SelectTrigger'


const SelectValue = () => {
    const { value } = React.useContext(SelectContext)
    return <span>{value}</span>
}


const SelectContent = React.forwardRef<HTMLDivElement,
React.HTMLAttributes<HTMLDivElement>>(
    ({ className, children, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
        'relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md mt-1',
        className
        )}
        {...props}
    >
        <div className="p-1">{children}</div>
    </div>
    )
)

SelectContent.displayName = 'SelectContent'


interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
    value: string
}


const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
    ({ className, children, value, ...props }, ref) => {
    const { value: selectedValue, onValueChange } = React.useContext(SelectContext)
    const isSelected = value === selectedValue

    return (
        <div
        ref={ref}
        className={cn(
            'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
            isSelected && 'bg-accent',
            className
        )}
        onClick={() => onValueChange(value)}
        {...props}
        >
        {isSelected && (
            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
            <Check size={16} />
            </span>
        )}
        {children}
        </div>
    )
    }
)

SelectItem.displayName = 'SelectItem'


export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }