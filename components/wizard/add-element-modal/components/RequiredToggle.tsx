'use client'

import { Switch } from '@/components/ui/switch'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { UseFormReturn, FieldValues, Path } from 'react-hook-form'

interface RequiredToggleProps<T extends FieldValues> {
  form: UseFormReturn<T>
  name: Path<T>
}

export function RequiredToggle<T extends FieldValues>({ form, name }: RequiredToggleProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-center justify-between rounded-lg border p-3">
          <FormLabel className="cursor-pointer">Question requise</FormLabel>
          <FormControl>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
        </FormItem>
      )}
    />
  )
}
