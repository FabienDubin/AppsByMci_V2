'use client'

import { useFieldArray, UseFormReturn } from 'react-hook-form'
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
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    // @ts-expect-error - useFieldArray expects objects but we use strings, handled via transform
    name: 'options',
  })

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
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <FormField
                control={form.control}
                name={`options.${index}`}
                render={({ field }) => (
                  <FormControl>
                    <Input
                      placeholder={`Option ${index + 1}`}
                      {...field}
                    />
                  </FormControl>
                )}
              />
              {fields.length > 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          {fields.length < 6 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append('')}
            >
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
