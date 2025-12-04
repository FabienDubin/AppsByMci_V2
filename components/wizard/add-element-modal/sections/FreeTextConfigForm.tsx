'use client'

import { UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { RequiredToggle, FormActionButtons } from '../components'
import type { FreeTextFormData } from '../constants'

interface FreeTextConfigFormProps {
  form: UseFormReturn<FreeTextFormData>
  onSubmit: (data: FreeTextFormData) => void
  onCancel: () => void
  isEditing: boolean
}

export function FreeTextConfigForm({
  form,
  onSubmit,
  onCancel,
  isEditing,
}: FreeTextConfigFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="question"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question *</FormLabel>
              <FormControl>
                <Textarea placeholder="Décris ton superpouvoir idéal" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="maxLength"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Limite de caractères (50-2000)</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <Slider
                    min={50}
                    max={2000}
                    step={50}
                    value={[field.value]}
                    onValueChange={([value]) => field.onChange(value)}
                  />
                  <p className="text-sm text-muted-foreground text-right">
                    {field.value} caractères max
                  </p>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="placeholder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Placeholder réponse (optionnel)</FormLabel>
              <FormControl>
                <Input placeholder="Tape ta réponse ici..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <RequiredToggle form={form} name="required" />

        <FormActionButtons
          onCancel={onCancel}
          submitLabel={isEditing ? 'Sauvegarder' : 'Ajouter'}
        />
      </form>
    </Form>
  )
}
