import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Switch component properties
 */
interface SwitchProps {
  /** Unique identifier for the switch */
  id?: string
  /** Controlled checked state */
  checked: boolean
  /** Callback function when checked state changes */
  onCheckedChange: (checked: boolean) => void
  /** Additional CSS classes */
  className?: string
  /** Whether the switch is disabled */
  disabled?: boolean
  /** Accessible label for screen readers */
  'aria-label'?: string
  /** Accessible description for screen readers */
  'aria-describedby'?: string
}

/**
 * A customizable switch component with enhanced accessibility and performance.
 * 
 * Features:
 * - Full keyboard navigation (Space/Enter keys)
 * - Screen reader support with proper ARIA attributes
 * - Optimized re-renders with React.memo and useCallback
 * - Comprehensive error handling and validation
 * - Disabled state support
 */
const Switch = React.memo(
  React.forwardRef<HTMLButtonElement, SwitchProps>(
    ({ 
      className, 
      checked, 
      onCheckedChange, 
      disabled = false, 
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      ...props 
    }, ref) => {
      
      // Validate required props
      if (typeof checked !== 'boolean') {
        console.error('Switch component: "checked" prop must be a boolean')
      }

      if (typeof onCheckedChange !== 'function') {
        console.error('Switch component: "onCheckedChange" prop must be a function')
      }

      /**
       * Handle click events with proper disabled state checking
       */
      const handleClick = React.useCallback(() => {
        if (disabled) return
        onCheckedChange(!checked)
      }, [checked, onCheckedChange, disabled])

      /**
       * Handle keyboard events for accessibility
       */
      const handleKeyDown = React.useCallback((event: React.KeyboardEvent) => {
        if (disabled) return
        
        if (event.key === ' ' || event.key === 'Enter') {
          event.preventDefault()
          onCheckedChange(!checked)
        }
      }, [checked, onCheckedChange, disabled])

      // Generate accessible label if not provided
      const accessibleLabel = ariaLabel || (checked ? 'On' : 'Off')

      return (
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={accessibleLabel}
          aria-describedby={ariaDescribedBy}
          tabIndex={disabled ? -1 : 0}
          ref={ref}
          className={cn(
            // Base styles
            'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
            // Focus styles
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            // State styles
            checked ? 'bg-primary' : 'bg-input',
            // Disabled styles
            'disabled:cursor-not-allowed disabled:opacity-50',
            // Custom classes
            className
          )}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          {...props}
        >
          {/* Switch thumb */}
          <span
            className={cn(
              'pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 ease-in-out',
              checked ? 'translate-x-5' : 'translate-x-0'
            )}
            aria-hidden="true"
          />
        </button>
      )
    }
  )
)

Switch.displayName = 'Switch'

export { Switch }