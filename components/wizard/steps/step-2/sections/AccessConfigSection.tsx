'use client'

import { UseFormReturn, Controller } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import type { Step2Data } from '@/lib/schemas/animation.schema'

interface AccessConfigSectionProps {
  form: UseFormReturn<Step2Data>
  isLoading: boolean
  accessType: string
  emailDomainsInput: string
  setEmailDomainsInput: (value: string) => void
  showEmailDomainAlert: boolean
}

export function AccessConfigSection({
  form,
  isLoading,
  accessType,
  emailDomainsInput,
  setEmailDomainsInput,
  showEmailDomainAlert,
}: AccessConfigSectionProps) {
  const { register, control, setValue, formState: { errors } } = form

  return (
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
  )
}
