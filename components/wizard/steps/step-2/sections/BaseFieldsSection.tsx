'use client'

import { UseFormReturn } from 'react-hook-form'
import type { Step2Data } from '@/lib/schemas/animation.schema'
import { BaseFieldCard } from '../components'

interface BaseFieldsSectionProps {
  form: UseFormReturn<Step2Data>
  isLoading: boolean
  accessType: string
  nameEnabled: boolean
  firstNameEnabled: boolean
  emailEnabled: boolean
}

export function BaseFieldsSection({
  form,
  isLoading,
  accessType,
  nameEnabled,
  firstNameEnabled,
  emailEnabled,
}: BaseFieldsSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Champs de Base</h3>
        <p className="text-sm text-gray-500">
          Ces champs seront présentés sur le premier écran du formulaire participant (avec le code d'accès si activé)
        </p>
      </div>

      <BaseFieldCard
        form={form}
        fieldKey="name"
        title="Nom"
        isEnabled={nameEnabled}
        isLoading={isLoading}
      />

      <BaseFieldCard
        form={form}
        fieldKey="firstName"
        title="Prénom"
        isEnabled={firstNameEnabled}
        isLoading={isLoading}
      />

      <BaseFieldCard
        form={form}
        fieldKey="email"
        title="Email"
        isEnabled={emailEnabled}
        isLoading={isLoading}
        disableToggle={accessType === 'email-domain'}
        helperText="L'email sera utilisé pour envoyer le résultat au participant (si emails activés dans Step 5)"
      />
    </div>
  )
}
