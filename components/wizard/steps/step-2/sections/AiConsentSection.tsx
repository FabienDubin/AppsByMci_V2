'use client'

import { UseFormReturn, Controller } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Bot } from 'lucide-react'
import { RichTextEditor } from '@/components/email/rich-text-editor'
import type { Step2Data } from '@/lib/schemas/animation.schema'

interface AiConsentSectionProps {
  form: UseFormReturn<Step2Data>
  isLoading: boolean
  aiConsentEnabled: boolean
}

export function AiConsentSection({
  form,
  isLoading,
  aiConsentEnabled,
}: AiConsentSectionProps) {
  const { control, formState: { errors } } = form

  return (
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
  )
}
