'use client'

import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import DOMPurify from 'dompurify'
import { ChevronLeft, ChevronRight, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useAnimation } from '@/components/participant/ParticipantContext'
import { useParticipantFormStore } from '@/lib/stores/participantForm.store'

interface BaseFieldsStepProps {
  onNext: () => void
  onPrevious?: () => void
  isFirstStep: boolean
  isLastStep: boolean
}

/**
 * BaseFieldsStep - First step of participant wizard
 * Displays configured base fields, access code validation, and AI consent toggle
 */
export function BaseFieldsStep({ onNext, onPrevious, isFirstStep, isLastStep }: BaseFieldsStepProps) {
  const animation = useAnimation()
  const { formData, setField, isSubmitting } = useParticipantFormStore()
  const [accessCodeError, setAccessCodeError] = useState<string | null>(null)
  const [isValidatingCode, setIsValidatingCode] = useState(false)

  // Extract configuration
  const baseFields = animation.baseFields
  const accessConfig = animation.accessConfig

  // Determine which fields are enabled
  const nameEnabled = baseFields?.name?.enabled ?? false
  const nameRequired = baseFields?.name?.required ?? false
  const firstNameEnabled = baseFields?.firstName?.enabled ?? false
  const firstNameRequired = baseFields?.firstName?.required ?? false
  const emailEnabled = baseFields?.email?.enabled ?? false
  const emailRequired = baseFields?.email?.required ?? false
  const codeRequired = accessConfig?.type === 'code'
  const emailDomainValidation = accessConfig?.type === 'email-domain'
  const allowedDomains = accessConfig?.emailDomains || []
  const aiConsentLabel = baseFields?.aiConsent?.label || ''

  // Sanitize AI consent label
  const sanitizedAiConsentLabel = useMemo(() => {
    if (!aiConsentLabel) return ''
    return DOMPurify.sanitize(aiConsentLabel, {
      ALLOWED_TAGS: ['p', 'strong', 'em', 'a', 'br', 'span'],
      ALLOWED_ATTR: ['href', 'target'],
    })
  }, [aiConsentLabel])

  // AI consent is shown only if enabled AND has a label - and it's always required when shown
  const showAiConsent = (baseFields?.aiConsent?.enabled ?? false) && !!sanitizedAiConsentLabel

  // Build dynamic Zod schema based on configuration
  const formSchema = useMemo(() => {
    const shape: Record<string, z.ZodTypeAny> = {}

    if (nameEnabled) {
      const nameSchema = nameRequired
        ? z.string().min(1, 'Ce champ est requis')
        : z.string().optional()
      shape.nom = nameSchema
    }

    if (firstNameEnabled) {
      const firstNameSchema = firstNameRequired
        ? z.string().min(1, 'Ce champ est requis')
        : z.string().optional()
      shape.prenom = firstNameSchema
    }

    if (emailEnabled) {
      // Build email validation schema
      let emailSchema: z.ZodTypeAny = z.string()

      if (emailRequired) {
        emailSchema = z.string().min(1, 'Ce champ est requis').email("Format d'email invalide")
      } else {
        emailSchema = z
          .string()
          .optional()
          .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
            message: "Format d'email invalide",
          })
      }

      // Add domain validation if configured
      if (emailDomainValidation && allowedDomains.length > 0) {
        emailSchema = z
          .string()
          .min(1, 'Ce champ est requis')
          .email("Format d'email invalide")
          .refine(
            (val) => {
              const domain = val.split('@')[1]?.toLowerCase()
              return allowedDomains.some((d: string) => d.toLowerCase().replace('@', '') === domain)
            },
            { message: "Votre domaine email n'est pas autorisé pour cette animation" }
          )
      }

      shape.email = emailSchema
    }

    if (codeRequired) {
      shape.accessCode = z.string().min(1, "Le code d'accès est requis")
    }

    // AI consent is always required when shown (enabled + has label)
    if (showAiConsent) {
      shape.aiConsentAccepted = z.literal(true, {
        errorMap: () => ({ message: 'Veuillez accepter les conditions pour continuer' }),
      })
    }

    return z.object(shape)
  }, [
    nameEnabled,
    nameRequired,
    firstNameEnabled,
    firstNameRequired,
    emailEnabled,
    emailRequired,
    codeRequired,
    showAiConsent,
    emailDomainValidation,
    allowedDomains,
  ])

  type FormValues = z.infer<typeof formSchema>

  // Initialize form with current values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nom: formData.nom || '',
      prenom: formData.prenom || '',
      email: formData.email || '',
      accessCode: formData.accessCode || '',
      aiConsentAccepted: formData.aiConsentAccepted || false,
    } as FormValues,
    mode: 'onBlur',
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form

  // Watch AI consent for button state
  const aiConsentAccepted = watch('aiConsentAccepted')

  // Button disabled state - only during submission/validation
  const isButtonDisabled = isSubmitting || isValidatingCode

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    // Clear any previous errors
    setAccessCodeError(null)

    // Save form data to store
    if ('nom' in data && data.nom !== undefined) setField('nom', data.nom as string)
    if ('prenom' in data && data.prenom !== undefined) setField('prenom', data.prenom as string)
    if ('email' in data && data.email !== undefined) setField('email', data.email as string)
    if ('accessCode' in data && data.accessCode !== undefined)
      setField('accessCode', data.accessCode as string)
    if ('aiConsentAccepted' in data && data.aiConsentAccepted !== undefined)
      setField('aiConsentAccepted', data.aiConsentAccepted as boolean)

    // Validate access code if required
    if (codeRequired && 'accessCode' in data && data.accessCode) {
      setIsValidatingCode(true)
      try {
        const response = await fetch(`/api/animations/by-slug/${animation.slug}/validate-access`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessCode: data.accessCode }),
        })

        const result = await response.json()

        if (!response.ok || !result.success) {
          setAccessCodeError("Code d'accès incorrect")
          setIsValidatingCode(false)
          return
        }
      } catch {
        setAccessCodeError('Erreur de validation')
        setIsValidatingCode(false)
        return
      }
      setIsValidatingCode(false)
    }

    // Move to next step
    onNext()
  }

  // Helper function to get error message safely
  const getErrorMessage = (fieldName: string): string | undefined => {
    const error = errors[fieldName as keyof typeof errors]
    if (error && typeof error === 'object' && 'message' in error) {
      return error.message as string
    }
    return undefined
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name field */}
      {nameEnabled && (
        <div className="space-y-1.5">
          <Label htmlFor="nom">
            {baseFields?.name?.label || 'Nom'}
            {nameRequired && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Input
            id="nom"
            type="text"
            placeholder={baseFields?.name?.placeholder || 'Votre nom'}
            {...register('nom')}
            className={getErrorMessage('nom') ? 'border-red-500' : ''}
          />
          {getErrorMessage('nom') && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {getErrorMessage('nom')}
            </p>
          )}
        </div>
      )}

      {/* First name field */}
      {firstNameEnabled && (
        <div className="space-y-1.5">
          <Label htmlFor="prenom">
            {baseFields?.firstName?.label || 'Prénom'}
            {firstNameRequired && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Input
            id="prenom"
            type="text"
            placeholder={baseFields?.firstName?.placeholder || 'Votre prénom'}
            {...register('prenom')}
            className={getErrorMessage('prenom') ? 'border-red-500' : ''}
          />
          {getErrorMessage('prenom') && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {getErrorMessage('prenom')}
            </p>
          )}
        </div>
      )}

      {/* Email field */}
      {emailEnabled && (
        <div className="space-y-1.5">
          <Label htmlFor="email">
            {baseFields?.email?.label || 'Email'}
            {emailRequired && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Input
            id="email"
            type="email"
            placeholder={baseFields?.email?.placeholder || 'votre@email.com'}
            {...register('email')}
            className={getErrorMessage('email') ? 'border-red-500' : ''}
          />
          {getErrorMessage('email') && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {getErrorMessage('email')}
            </p>
          )}
        </div>
      )}

      {/* Access code field */}
      {codeRequired && (
        <div className="space-y-1.5">
          <Label htmlFor="accessCode">
            Code d&apos;accès
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="accessCode"
            type="text"
            placeholder="Entrez le code d'accès"
            {...register('accessCode')}
            className={getErrorMessage('accessCode') || accessCodeError ? 'border-red-500' : ''}
          />
          {(getErrorMessage('accessCode') || accessCodeError) && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {getErrorMessage('accessCode') || accessCodeError}
            </p>
          )}
        </div>
      )}

      {/* AI Consent toggle - only shown if enabled AND has a configured label */}
      {showAiConsent && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between gap-3">
            <Switch
              id="aiConsentAccepted"
              checked={(aiConsentAccepted as boolean) || false}
              onCheckedChange={(checked) => {
                setValue(
                  'aiConsentAccepted' as keyof FormValues,
                  checked as FormValues[keyof FormValues],
                  { shouldValidate: true }
                )
              }}
            />
            <div className="flex-1">
              <label
                htmlFor="aiConsentAccepted"
                className="text-sm cursor-pointer prose prose-sm max-w-none [&_p]:my-0 [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: sanitizedAiConsentLabel }}
              />
            </div>
          </div>
          {getErrorMessage('aiConsentAccepted') && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {getErrorMessage('aiConsentAccepted')}
            </p>
          )}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="pt-4 flex gap-4">
        {!isFirstStep && onPrevious && (
          <Button
            type="button"
            variant="outline"
            onClick={onPrevious}
            disabled={isButtonDisabled}
            className="flex-1"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Précédent
          </Button>
        )}
        <Button
          type="submit"
          disabled={isButtonDisabled}
          className={isFirstStep ? 'w-full' : 'flex-1'}
          style={{ backgroundColor: 'var(--primary-color)' }}
        >
          {isValidatingCode && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isLastStep ? 'Soumettre' : 'Suivant'}
          {!isLastStep && !isValidatingCode && <ChevronRight className="w-4 h-4 ml-2" />}
        </Button>
      </div>
    </form>
  )
}
