'use client'

import * as React from 'react'
import { HexColorPicker } from 'react-colorful'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/**
 * Hex color regex validation (6 characters only)
 */
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/

/**
 * Color Picker Props
 */
interface ColorPickerProps {
  /** Current color value in hex format (#RRGGBB) */
  value: string
  /** Callback when color changes */
  onChange: (color: string) => void
  /** Label displayed above the picker */
  label?: string
  /** Help text displayed below */
  helpText?: string
  /** Error message */
  error?: string
  /** Disabled state */
  disabled?: boolean
  /** Additional class names */
  className?: string
}

/**
 * ColorPicker component
 * Combines a color swatch button with a popover containing HexColorPicker
 * Allows both visual selection and manual hex input
 */
export function ColorPicker({
  value,
  onChange,
  label,
  helpText,
  error,
  disabled = false,
  className,
}: ColorPickerProps) {
  const [inputValue, setInputValue] = React.useState(value)
  const [isOpen, setIsOpen] = React.useState(false)

  // Sync input value when external value changes
  React.useEffect(() => {
    setInputValue(value)
  }, [value])

  // Handle color picker change
  const handleColorChange = (newColor: string) => {
    setInputValue(newColor)
    onChange(newColor)
  }

  // Handle manual hex input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value

    // Add # prefix if missing
    if (newValue && !newValue.startsWith('#')) {
      newValue = '#' + newValue
    }

    setInputValue(newValue)

    // Only propagate valid hex colors
    if (HEX_COLOR_REGEX.test(newValue)) {
      onChange(newValue)
    }
  }

  // Handle input blur - reset to valid value if invalid
  const handleInputBlur = () => {
    if (!HEX_COLOR_REGEX.test(inputValue)) {
      setInputValue(value)
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label className="text-sm font-medium">{label}</Label>
      )}

      <div className="flex items-center gap-3">
        {/* Color swatch button with popover */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild disabled={disabled}>
            <button
              type="button"
              className={cn(
                'h-10 w-10 rounded-md border border-input shadow-sm transition-all',
                'hover:ring-2 hover:ring-ring hover:ring-offset-2',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                disabled && 'cursor-not-allowed opacity-50'
              )}
              style={{ backgroundColor: value }}
              aria-label={`Couleur sélectionnée: ${value}`}
            />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <div className="space-y-3">
              <HexColorPicker color={value} onChange={handleColorChange} />
              <Input
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                placeholder="#000000"
                maxLength={7}
                className="font-mono text-sm"
              />
            </div>
          </PopoverContent>
        </Popover>

        {/* Hex input field */}
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder="#000000"
          maxLength={7}
          disabled={disabled}
          className={cn(
            'w-28 font-mono text-sm',
            error && 'border-destructive focus-visible:ring-destructive'
          )}
        />

        {/* Color preview label */}
        <span className="text-sm text-muted-foreground">{value.toUpperCase()}</span>
      </div>

      {/* Help text */}
      {helpText && !error && (
        <p className="text-sm text-muted-foreground">{helpText}</p>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}

export default ColorPicker
