'use client'

import { UseFormReturn, Controller, FieldPath } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { Step2Data } from '@/lib/schemas/animation.schema'

interface BaseFieldCardProps {
  form: UseFormReturn<Step2Data>
  fieldKey: 'name' | 'firstName' | 'email'
  title: string
  isEnabled: boolean
  isLoading: boolean
  disableToggle?: boolean
  helperText?: string
}

export function BaseFieldCard({
  form,
  fieldKey,
  title,
  isEnabled,
  isLoading,
  disableToggle = false,
  helperText,
}: BaseFieldCardProps) {
  const { register, control, formState: { errors } } = form

  const labelPath = `baseFields.${fieldKey}.label` as FieldPath<Step2Data>
  const placeholderPath = `baseFields.${fieldKey}.placeholder` as FieldPath<Step2Data>
  const requiredPath = `baseFields.${fieldKey}.required` as FieldPath<Step2Data>
  const enabledPath = `baseFields.${fieldKey}.enabled` as FieldPath<Step2Data>

  const fieldErrors = errors.baseFields?.[fieldKey]

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <Label htmlFor={`${fieldKey}Enabled`} className="text-base font-medium">
          {title}
        </Label>
        <Controller
          name={enabledPath}
          control={control}
          render={({ field }) => (
            <Switch
              id={`${fieldKey}Enabled`}
              checked={field.value as boolean}
              onCheckedChange={field.onChange}
              disabled={isLoading || disableToggle}
            />
          )}
        />
      </div>

      {isEnabled && (
        <div className="space-y-3 pl-4">
          <div className="space-y-2">
            <Label htmlFor={`${fieldKey}Label`}>Label affiché</Label>
            <Input
              id={`${fieldKey}Label`}
              {...register(labelPath)}
              placeholder={title}
              disabled={isLoading}
              className={fieldErrors?.label ? 'border-red-500' : ''}
            />
            {fieldErrors?.label && (
              <p className="text-sm text-red-500">{fieldErrors.label.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${fieldKey}Placeholder`}>Placeholder</Label>
            <Input
              id={`${fieldKey}Placeholder`}
              {...register(placeholderPath)}
              placeholder={`Ex: ${title}`}
              disabled={isLoading}
              className={fieldErrors?.placeholder ? 'border-red-500' : ''}
            />
            {fieldErrors?.placeholder && (
              <p className="text-sm text-red-500">{fieldErrors.placeholder.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Controller
              name={requiredPath}
              control={control}
              render={({ field }) => (
                <Switch
                  id={`${fieldKey}Required`}
                  checked={field.value as boolean}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
              )}
            />
            <Label htmlFor={`${fieldKey}Required`} className="font-normal">
              Requis
            </Label>
          </div>

          {helperText && (
            <p className="text-xs text-gray-500">{helperText}</p>
          )}
        </div>
      )}
    </div>
  )
}
