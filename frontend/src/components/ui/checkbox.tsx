"use client"

import * as React from "react"

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = "", onCheckedChange, checked, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        className={`h-4 w-4 rounded border border-input bg-background text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        ref={ref}
        checked={checked}
        onChange={(e) => {
          if (onCheckedChange) {
            onCheckedChange(e.target.checked);
          }
        }}
        {...props}
      />
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
