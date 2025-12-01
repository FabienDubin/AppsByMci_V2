'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { step1Schema, type Step1Data } from '@/lib/schemas/animation.schema'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Step1GeneralInfoProps {
  initialData?: Partial<Step1Data>
  onNext: (data: Step1Data) => void | Promise<void>
  isLoading?: boolean
  error?: string | null
  canEditSlug?: boolean // If false, slug field is disabled (for published animations)
}

/**
 * Generate slug from name (kebab-case)
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD') // Decompose accents
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Step 1: General Information
 * Name, Description, Slug with auto-generation
 */
export function Step1GeneralInfo({
  initialData,
  onNext,
  isLoading = false,
  error = null,
  canEditSlug = true, // Default to true for create mode
}: Step1GeneralInfoProps) {
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: initialData || {
      name: '',
      description: '',
      slug: '',
    },
  })

  const name = watch('name')
  const slug = watch('slug')

  // Auto-generate slug from name when name changes
  // Skip auto-generation if slug is protected (published animation)
  useEffect(() => {
    if (name && !slugManuallyEdited && canEditSlug) {
      const generatedSlug = generateSlug(name)
      setValue('slug', generatedSlug)
    }
  }, [name, slugManuallyEdited, canEditSlug, setValue])

  const onSubmit = async (data: Step1Data) => {
    await onNext(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Error alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Name field */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Nom de l'animation <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Ex: Avatar IA - Tech 2025"
          disabled={isLoading}
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      {/* Description field */}
      <div className="space-y-2">
        <Label htmlFor="description">Description (optionnel)</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Décrivez votre animation..."
          rows={4}
          disabled={isLoading}
          className={errors.description ? 'border-red-500' : ''}
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      {/* Slug field */}
      <div className="space-y-2">
        <Label htmlFor="slug">
          Slug <span className="text-red-500">*</span>
        </Label>
        <Input
          id="slug"
          {...register('slug')}
          placeholder="mon-animation"
          disabled={isLoading || !canEditSlug}
          className={errors.slug ? 'border-red-500' : ''}
          onChange={(e) => {
            register('slug').onChange(e)
            setSlugManuallyEdited(true)
          }}
        />
        <p className="text-xs text-gray-500">
          URL : /a/{slug || 'votre-slug'}
          {!canEditSlug && <span className="ml-2 text-orange-600">⚠️ Slug non modifiable (animation publiée)</span>}
        </p>
        {errors.slug && (
          <p className="text-sm text-red-500">{errors.slug.message}</p>
        )}
      </div>

      {/* Submit button */}
      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Chargement...' : 'Suivant'}
        </Button>
      </div>
    </form>
  )
}
