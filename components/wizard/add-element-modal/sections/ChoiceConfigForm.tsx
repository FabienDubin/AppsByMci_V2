'use client'

import { UseFormReturn } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, X, AlertCircle } from 'lucide-react'
import { RequiredToggle, FormActionButtons } from '../components'
import type { ChoiceFormData } from '../constants'

interface ChoiceConfigFormProps {
  form: UseFormReturn<ChoiceFormData>
  onSubmit: (data: ChoiceFormData) => void
  onCancel: () => void
  isEditing: boolean
  validationError: string | null
}

export function ChoiceConfigForm({
  form,
  onSubmit,
  onCancel,
  isEditing,
  validationError,
}: ChoiceConfigFormProps) {
  const options = form.watch('options')

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    form.setValue('options', newOptions)
  }

  const removeOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index)
    form.setValue('options', newOptions)
  }

  const addOption = () => {
    form.setValue('options', [...options, ''])
  }

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
                <Textarea
                  placeholder="Quel est ton langage de programmation préféré ?"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormLabel>Options de réponse</FormLabel>
          {options.map((_, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder={`Option ${index + 1}`}
                value={form.watch(`options.${index}`)}
                onChange={(e) => updateOption(index, e.target.value)}
              />
              {options.length > 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeOption(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          {options.length < 6 && (
            <Button type="button" variant="outline" size="sm" onClick={addOption}>
              <Plus className="h-4 w-4 mr-1" /> Ajouter une option
            </Button>
          )}
        </div>

        <RequiredToggle form={form} name="required" />

        {(validationError || form.formState.errors.options) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {validationError || form.formState.errors.options?.message}
            </AlertDescription>
          </Alert>
        )}

        <FormActionButtons
          onCancel={onCancel}
          submitLabel={isEditing ? 'Sauvegarder' : 'Ajouter'}
        />
      </form>
    </Form>
  )
}
