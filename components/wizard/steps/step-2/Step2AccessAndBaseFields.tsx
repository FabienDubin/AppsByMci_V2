'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { step2Schema, type Step2Data } from '@/lib/schemas/animation.schema'
import type { AnimationData } from '@/lib/stores/wizard.store'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { DEFAULT_BASE_FIELDS } from './constants'
import { AccessConfigSection, BaseFieldsSection, AiConsentSection } from './sections'

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

  const form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      accessConfig: {
        type: initialData?.accessConfig?.type || 'none',
        code: initialData?.accessConfig?.code || undefined,
        emailDomains: initialData?.accessConfig?.emailDomains || [],
      },
      baseFields: {
        name: initialData?.baseFields?.name || DEFAULT_BASE_FIELDS.name,
        firstName: initialData?.baseFields?.firstName || DEFAULT_BASE_FIELDS.firstName,
        email: initialData?.baseFields?.email || DEFAULT_BASE_FIELDS.email,
        aiConsent: initialData?.baseFields?.aiConsent || DEFAULT_BASE_FIELDS.aiConsent,
      },
    },
  })

  const { watch, setValue, handleSubmit } = form

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
      <AccessConfigSection
        form={form}
        isLoading={isLoading}
        accessType={accessType}
        emailDomainsInput={emailDomainsInput}
        setEmailDomainsInput={setEmailDomainsInput}
        showEmailDomainAlert={showEmailDomainAlert}
      />

      <BaseFieldsSection
        form={form}
        isLoading={isLoading}
        accessType={accessType}
        nameEnabled={nameEnabled}
        firstNameEnabled={firstNameEnabled}
        emailEnabled={emailEnabled}
      />

      <AiConsentSection
        form={form}
        isLoading={isLoading}
        aiConsentEnabled={aiConsentEnabled}
      />

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
