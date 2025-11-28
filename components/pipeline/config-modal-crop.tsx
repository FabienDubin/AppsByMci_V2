'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PipelineBlockConfig } from '@/lib/stores/wizard.store'

// Validation schema for Crop & Resize block
const cropConfigSchema = z
  .object({
    format: z.enum(['square', '16:9', '4:3', 'original']),
    dimensions: z.coerce.number().int().min(256).max(2048).optional(),
  })
  .superRefine((data, ctx) => {
    // Dimensions required if format != 'original'
    if (data.format !== 'original' && !data.dimensions) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Les dimensions sont requises pour ce format',
        path: ['dimensions'],
      })
    }
  })

type CropConfigFormData = z.infer<typeof cropConfigSchema>

interface ConfigModalCropProps {
  isOpen: boolean
  initialConfig?: PipelineBlockConfig
  onClose: () => void
  onSave: (config: PipelineBlockConfig) => void
}

/**
 * Modal for configuring Crop & Resize block
 * AC-3.6.3: Dialog with format + dimensions fields
 */
export function ConfigModalCrop({
  isOpen,
  initialConfig,
  onClose,
  onSave,
}: ConfigModalCropProps) {
  const form = useForm<CropConfigFormData>({
    resolver: zodResolver(cropConfigSchema),
    defaultValues: {
      format: initialConfig?.format || 'square',
      dimensions: initialConfig?.dimensions || 1024,
    },
  })

  const selectedFormat = form.watch('format')

  const handleSubmit = (data: CropConfigFormData) => {
    onSave({
      format: data.format,
      dimensions: data.format !== 'original' ? data.dimensions : undefined,
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configurer Crop & Resize</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Format field */}
            <FormField
              control={form.control}
              name="format"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Format</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un format" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="square">Square (1:1)</SelectItem>
                      <SelectItem value="16:9">16:9</SelectItem>
                      <SelectItem value="4:3">4:3</SelectItem>
                      <SelectItem value="original">Original (pas de crop)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dimensions field (conditional) */}
            {selectedFormat !== 'original' && (
              <FormField
                control={form.control}
                name="dimensions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dimensions (largeur en pixels)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="1024"
                        min={256}
                        max={2048}
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Largeur en pixels. Ex: 512, 1024, 1792 (min: 256, max: 2048)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit">Sauvegarder</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
