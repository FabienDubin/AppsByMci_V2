'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { step2Schema, type Step2Data } from '@/lib/schemas/animation.schema'
import type { AnimationData } from '@/lib/stores/wizard.store'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Bot } from 'lucide-react'
import { useEffect, useState } from 'react'
import { RichTextEditor } from '@/components/email/rich-text-editor'

// Type for initial data that accepts both AnimationData (optional aiConsent) and Step2Data (required aiConsent)
type Step2InitialData = Partial<AnimationData> | Partial<Step2Data>

interface Step2AccessAndBaseFieldsProps {
  initialData?: Step2InitialData
  onNext: (data: Step2Data) => void | Promise<void>
  onPrev?: () => void
  isLoading?: boolean
}

/**
 * Step 2: Validation d'Accès + Champs de Base
 * Configurer la validation d'accès ET les champs de base à collecter
 */
export function Step2AccessAndBaseFields({
  initialData,
  onNext,
  onPrev,
  isLoading = false,
}: Step2AccessAndBaseFieldsProps) {
  const [showEmailDomainAlert, setShowEmailDomainAlert] = useState(false)

  // Default values for base fields
  const defaultBaseFields = {
    name: {
      enabled: true,
      required: true,
      label: 'Nom',
      placeholder: 'Ex: Jean Dupont',
    },
    firstName: {
      enabled: false,
      required: true,
      label: 'Prénom',
      placeholder: 'Ex: Marie',
    },
    email: {
      enabled: false,
      required: true,
      label: 'Email',
      placeholder: 'exemple@email.com',
    },
    aiConsent: {
      enabled: false,
      required: true, // Always required when enabled
      label: '',
    },
  }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      accessConfig: {
        type: initialData?.accessConfig?.type || 'none',
        code: initialData?.accessConfig?.code || undefined,
        emailDomains: initialData?.accessConfig?.emailDomains || [],
      },
      baseFields: {
        name: initialData?.baseFields?.name || defaultBaseFields.name,
        firstName: initialData?.baseFields?.firstName || defaultBaseFields.firstName,
        email: initialData?.baseFields?.email || defaultBaseFields.email,
        aiConsent: initialData?.baseFields?.aiConsent || defaultBaseFields.aiConsent,
      },
    },
  })

  const accessType = watch('accessConfig.type')
  const emailEnabled = watch('baseFields.email.enabled')
  const nameEnabled = watch('baseFields.name.enabled')
  const firstNameEnabled = watch('baseFields.firstName.enabled')
  const aiConsentEnabled = watch('baseFields.aiConsent.enabled')
  const emailDomains = watch('accessConfig.emailDomains') || []

  // State for CSV string representation of email domains
  const [emailDomainsInput, setEmailDomainsInput] = useState(emailDomains.join(', '))

  // Enforce email.enabled=true when accessType='email-domain'
  useEffect(() => {
    if (accessType === 'email-domain' && !emailEnabled) {
      setShowEmailDomainAlert(true)
      setValue('baseFields.email.enabled', true)
    } else {
      setShowEmailDomainAlert(false)
    }
  }, [accessType, emailEnabled, setValue])

  // Auto-set aiConsent.required=true when aiConsent.enabled=true
  useEffect(() => {
    if (aiConsentEnabled) {
      setValue('baseFields.aiConsent.required', true)
    }
  }, [aiConsentEnabled, setValue])

  const onSubmit = async (data: Step2Data) => {
    await onNext(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Section 1: Validation d'Accès */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Validation d'Accès</h3>
          <p className="text-sm text-gray-500">
            Configurez comment les participants pourront accéder à votre animation
          </p>
        </div>

        {/* Type de validation */}
        <div className="space-y-2">
          <Label htmlFor="accessType">
            Type de validation d'accès <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="accessConfig.type"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                <SelectTrigger id="accessType">
                  <SelectValue placeholder="Sélectionnez un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune - Accès libre pour tous</SelectItem>
                  <SelectItem value="code">Code d'accès - Les participants doivent saisir un code valide</SelectItem>
                  <SelectItem value="email-domain">
                    Domaine email - Seuls les emails d'un domaine spécifique sont autorisés
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.accessConfig?.type && (
            <p className="text-sm text-red-500">{errors.accessConfig.type.message}</p>
          )}
        </div>

        {/* Code d'accès (conditionnel si type='code') */}
        {accessType === 'code' && (
          <div className="space-y-2">
            <Label htmlFor="accessCode">
              Code d'accès <span className="text-red-500">*</span>
            </Label>
            <Input
              id="accessCode"
              {...register('accessConfig.code')}
              placeholder="TECH2025"
              disabled={isLoading}
              className={errors.accessConfig?.code ? 'border-red-500' : ''}
            />
            <p className="text-xs text-gray-500">
              Ce code sera demandé sur le premier écran du formulaire participant
            </p>
            {errors.accessConfig?.code && (
              <p className="text-sm text-red-500">{errors.accessConfig.code.message}</p>
            )}
          </div>
        )}

        {/* Domaines autorisés (conditionnel si type='email-domain') */}
        {accessType === 'email-domain' && (
          <div className="space-y-2">
            <Label htmlFor="emailDomains">
              Domaines autorisés <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="emailDomains"
              value={emailDomainsInput}
              onChange={(e) => {
                const inputValue = e.target.value
                setEmailDomainsInput(inputValue)

                // Parse CSV and update form value
                const domains = inputValue
                  .split(',')
                  .map((d) => d.trim())
                  .filter((d) => d.length > 0)
                setValue('accessConfig.emailDomains', domains, { shouldValidate: true })
              }}
              placeholder="@company.com, @partner.com"
              rows={2}
              disabled={isLoading}
              className={errors.accessConfig?.emailDomains ? 'border-red-500' : ''}
            />
            <p className="text-xs text-gray-500">
              Seuls les emails de ces domaines seront autorisés. Séparez plusieurs domaines par des virgules. Nécessite
              que le champ Email soit activé ci-dessous.
            </p>
            {errors.accessConfig?.emailDomains && (
              <p className="text-sm text-red-500">
                {Array.isArray(errors.accessConfig.emailDomains)
                  ? errors.accessConfig.emailDomains.map((e: any) => e.message).join(', ')
                  : errors.accessConfig.emailDomains.message}
              </p>
            )}
          </div>
        )}

        {/* Alert cohérence email-domain */}
        {showEmailDomainAlert && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              ⚠️ Vous devez activer le champ Email pour valider par domaine (activé automatiquement ci-dessous)
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Section 2: Champs de Base */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Champs de Base</h3>
          <p className="text-sm text-gray-500">
            Ces champs seront présentés sur le premier écran du formulaire participant (avec le code d'accès si activé)
          </p>
        </div>

        {/* Champ Nom */}
        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="nameEnabled" className="text-base font-medium">
              Nom
            </Label>
            <Controller
              name="baseFields.name.enabled"
              control={control}
              render={({ field }) => (
                <Switch id="nameEnabled" checked={field.value} onCheckedChange={field.onChange} disabled={isLoading} />
              )}
            />
          </div>

          {nameEnabled && (
            <div className="space-y-3 pl-4">
              <div className="space-y-2">
                <Label htmlFor="nameLabel">Label affiché</Label>
                <Input
                  id="nameLabel"
                  {...register('baseFields.name.label')}
                  placeholder="Nom"
                  disabled={isLoading}
                  className={errors.baseFields?.name?.label ? 'border-red-500' : ''}
                />
                {errors.baseFields?.name?.label && (
                  <p className="text-sm text-red-500">{errors.baseFields.name.label.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="namePlaceholder">Placeholder</Label>
                <Input
                  id="namePlaceholder"
                  {...register('baseFields.name.placeholder')}
                  placeholder="Ex: Jean Dupont"
                  disabled={isLoading}
                  className={errors.baseFields?.name?.placeholder ? 'border-red-500' : ''}
                />
                {errors.baseFields?.name?.placeholder && (
                  <p className="text-sm text-red-500">{errors.baseFields.name.placeholder.message}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Controller
                  name="baseFields.name.required"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="nameRequired"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  )}
                />
                <Label htmlFor="nameRequired" className="font-normal">
                  Requis
                </Label>
              </div>
            </div>
          )}
        </div>

        {/* Champ Prénom */}
        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="firstNameEnabled" className="text-base font-medium">
              Prénom
            </Label>
            <Controller
              name="baseFields.firstName.enabled"
              control={control}
              render={({ field }) => (
                <Switch
                  id="firstNameEnabled"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
              )}
            />
          </div>

          {firstNameEnabled && (
            <div className="space-y-3 pl-4">
              <div className="space-y-2">
                <Label htmlFor="firstNameLabel">Label affiché</Label>
                <Input
                  id="firstNameLabel"
                  {...register('baseFields.firstName.label')}
                  placeholder="Prénom"
                  disabled={isLoading}
                  className={errors.baseFields?.firstName?.label ? 'border-red-500' : ''}
                />
                {errors.baseFields?.firstName?.label && (
                  <p className="text-sm text-red-500">{errors.baseFields.firstName.label.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="firstNamePlaceholder">Placeholder</Label>
                <Input
                  id="firstNamePlaceholder"
                  {...register('baseFields.firstName.placeholder')}
                  placeholder="Ex: Marie"
                  disabled={isLoading}
                  className={errors.baseFields?.firstName?.placeholder ? 'border-red-500' : ''}
                />
                {errors.baseFields?.firstName?.placeholder && (
                  <p className="text-sm text-red-500">{errors.baseFields.firstName.placeholder.message}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Controller
                  name="baseFields.firstName.required"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="firstNameRequired"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  )}
                />
                <Label htmlFor="firstNameRequired" className="font-normal">
                  Requis
                </Label>
              </div>
            </div>
          )}
        </div>

        {/* Champ Email */}
        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="emailEnabled" className="text-base font-medium">
              Email
            </Label>
            <Controller
              name="baseFields.email.enabled"
              control={control}
              render={({ field }) => (
                <Switch
                  id="emailEnabled"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading || accessType === 'email-domain'}
                />
              )}
            />
          </div>

          {emailEnabled && (
            <div className="space-y-3 pl-4">
              <div className="space-y-2">
                <Label htmlFor="emailLabel">Label affiché</Label>
                <Input
                  id="emailLabel"
                  {...register('baseFields.email.label')}
                  placeholder="Email"
                  disabled={isLoading}
                  className={errors.baseFields?.email?.label ? 'border-red-500' : ''}
                />
                {errors.baseFields?.email?.label && (
                  <p className="text-sm text-red-500">{errors.baseFields.email.label.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailPlaceholder">Placeholder</Label>
                <Input
                  id="emailPlaceholder"
                  {...register('baseFields.email.placeholder')}
                  placeholder="exemple@email.com"
                  disabled={isLoading}
                  className={errors.baseFields?.email?.placeholder ? 'border-red-500' : ''}
                />
                {errors.baseFields?.email?.placeholder && (
                  <p className="text-sm text-red-500">{errors.baseFields.email.placeholder.message}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Controller
                  name="baseFields.email.required"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="emailRequired"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  )}
                />
                <Label htmlFor="emailRequired" className="font-normal">
                  Requis
                </Label>
              </div>

              <p className="text-xs text-gray-500">
                L'email sera utilisé pour envoyer le résultat au participant (si emails activés dans Step 5)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Autorisation IA (Story 3.12) */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Autorisation IA
          </h3>
          <p className="text-sm text-gray-500">
            Demander aux participants leur consentement pour l'utilisation de leurs données par l'IA
          </p>
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="aiConsentEnabled" className="text-base font-medium">
              Activer
            </Label>
            <Controller
              name="baseFields.aiConsent.enabled"
              control={control}
              render={({ field }) => (
                <Switch
                  id="aiConsentEnabled"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
              )}
            />
          </div>

          {aiConsentEnabled && (
            <div className="space-y-4 pt-2">
              {/* Info: toujours requis quand activé */}
              <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                ⚠️ Quand activé, le participant devra obligatoirement accepter pour continuer.
              </p>

              {/* Label WYSIWYG */}
              <div className="space-y-2">
                <Label htmlFor="aiConsentLabel">
                  Texte d'autorisation <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="baseFields.aiConsent.label"
                  control={control}
                  render={({ field }) => (
                    <RichTextEditor
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder="Ex: J'accepte que mes données soient utilisées par l'IA pour générer mon image..."
                      disabled={isLoading}
                      className="min-h-[120px]"
                    />
                  )}
                />
                <p className="text-xs text-gray-500">
                  Ce texte sera affiché aux participants. Vous pouvez ajouter des liens vers vos conditions d'utilisation.
                </p>
                {errors.baseFields?.aiConsent?.label && (
                  <p className="text-sm text-red-500">{errors.baseFields.aiConsent.label.message}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submit buttons */}
      <div className="flex justify-between pt-4">
        {onPrev && (
          <Button type="button" variant="outline" onClick={onPrev} disabled={isLoading}>
            Précédent
          </Button>
        )}
        <Button type="submit" disabled={isLoading} className="ml-auto">
          {isLoading ? 'Chargement...' : 'Suivant'}
        </Button>
      </div>
    </form>
  )
}
