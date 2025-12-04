'use client'

import { UseFormReturn } from 'react-hook-form'
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
import { RequiredToggle, FormActionButtons } from '../components'
import type { SliderFormData } from '../constants'

interface SliderConfigFormProps {
  form: UseFormReturn<SliderFormData>
  onSubmit: (data: SliderFormData) => void
  onCancel: () => void
  isEditing: boolean
}

export function SliderConfigForm({
  form,
  onSubmit,
  onCancel,
  isEditing,
}: SliderConfigFormProps) {
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
                <Textarea placeholder="À quel point aimes-tu le café ?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="min"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valeur minimale</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="max"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valeur maximale</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="minLabel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Label minimum (optionnel)</FormLabel>
                <FormControl>
                  <Input placeholder="Pas du tout" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maxLabel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Label maximum (optionnel)</FormLabel>
                <FormControl>
                  <Input placeholder="Totalement" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <RequiredToggle form={form} name="required" />

        <FormActionButtons
          onCancel={onCancel}
          submitLabel={isEditing ? 'Sauvegarder' : 'Ajouter'}
        />
      </form>
    </Form>
  )
}
