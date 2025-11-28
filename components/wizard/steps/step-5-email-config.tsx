'use client'

import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useWizardStore, getAvailableEmailVariables, DEFAULT_EMAIL_CONFIG } from '@/lib/stores/wizard.store'
import { emailConfigSchema } from '@/lib/schemas/animation.schema'

// Form values type for React Hook Form
interface EmailConfigFormValues {
  enabled: boolean
  subject?: string
  bodyTemplate?: string
  senderName: string
  senderEmail: string
}
import {
  validateVariables,
  DEFAULT_EMAIL_TEMPLATE,
  DEFAULT_EMAIL_SUBJECT,
} from '@/lib/utils/email-variables'

import { RichTextEditor } from '@/components/email/rich-text-editor'
import { EmailPreview } from '@/components/email/email-preview'
import { VariableBadges } from '@/components/email/variable-badges'

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible'
import { AlertTriangle, Mail, Info } from 'lucide-react'

interface Step5EmailConfigProps {
  onValidationChange?: (isValid: boolean) => void
}

/**
 * Step 5: Email Configuration
 * Allows admins to configure automatic email sending to participants
 */
export function Step5EmailConfig({ onValidationChange }: Step5EmailConfigProps) {
  const { animationData, updateData } = useWizardStore()

  // Get available variables from animation data
  const availableVariables = useMemo(
    () => getAvailableEmailVariables(animationData),
    [animationData]
  )

  // Initialize form with stored data or defaults
  const form = useForm<EmailConfigFormValues>({
    resolver: zodResolver(emailConfigSchema),
    defaultValues: {
      enabled: animationData.emailConfig?.enabled ?? DEFAULT_EMAIL_CONFIG.enabled,
      subject: animationData.emailConfig?.subject ?? '',
      bodyTemplate: animationData.emailConfig?.bodyTemplate ?? '',
      senderName: animationData.emailConfig?.senderName ?? DEFAULT_EMAIL_CONFIG.senderName,
      senderEmail: animationData.emailConfig?.senderEmail ?? DEFAULT_EMAIL_CONFIG.senderEmail,
    },
    mode: 'onChange',
  })

  const { watch, setValue } = form
  const enabled = watch('enabled')
  const subject = watch('subject')
  const bodyTemplate = watch('bodyTemplate')
  const senderName = watch('senderName')
  const senderEmail = watch('senderEmail')

  // Track invalid variables for warnings
  const [subjectWarnings, setSubjectWarnings] = useState<string[]>([])
  const [bodyWarnings, setBodyWarnings] = useState<string[]>([])

  // Track which field has focus for variable insertion
  const [activeField, setActiveField] = useState<'subject' | 'body' | null>(null)

  // Refs for inserting variables
  const subjectInputRef = useRef<HTMLInputElement>(null)
  const insertBodyVariableRef = useRef<((variable: string) => void) | null>(null)

  // Handle inserting variable based on which field is active
  const handleInsertVariable = useCallback((variable: string) => {
    if (activeField === 'subject') {
      // Insert into subject
      const input = subjectInputRef.current
      if (!input) return

      const start = input.selectionStart || 0
      const end = input.selectionEnd || 0
      const currentValue = subject || ''

      const newValue = currentValue.substring(0, start) + variable + currentValue.substring(end)
      setValue('subject', newValue)

      setTimeout(() => {
        input.focus()
        input.setSelectionRange(start + variable.length, start + variable.length)
      }, 0)
    } else if (activeField === 'body' && insertBodyVariableRef.current) {
      // Insert into body
      insertBodyVariableRef.current(variable)
    } else {
      // Default: insert into body if no field active
      if (insertBodyVariableRef.current) {
        insertBodyVariableRef.current(variable)
      }
    }
  }, [activeField, subject, setValue])

  // Check for invalid variables in subject
  useEffect(() => {
    if (subject) {
      const invalid = validateVariables(subject, availableVariables)
      setSubjectWarnings(invalid)
    } else {
      setSubjectWarnings([])
    }
  }, [subject, availableVariables])

  // Check for invalid variables in body
  useEffect(() => {
    if (bodyTemplate) {
      const invalid = validateVariables(bodyTemplate, availableVariables)
      setBodyWarnings(invalid)
    } else {
      setBodyWarnings([])
    }
  }, [bodyTemplate, availableVariables])

  // Sync form changes to wizard store
  useEffect(() => {
    const subscription = form.watch((value) => {
      updateData({
        emailConfig: {
          enabled: value.enabled ?? false,
          subject: value.subject,
          bodyTemplate: value.bodyTemplate,
          senderName: value.senderName ?? DEFAULT_EMAIL_CONFIG.senderName,
          senderEmail: value.senderEmail ?? DEFAULT_EMAIL_CONFIG.senderEmail,
        },
      })
    })
    return () => subscription.unsubscribe()
  }, [form, updateData])

  // Report validation state to parent
  useEffect(() => {
    const isValid = form.formState.isValid
    onValidationChange?.(isValid)
  }, [form.formState.isValid, onValidationChange])

  // Initialize with default template when enabling for the first time
  const handleEnableToggle = (checked: boolean) => {
    setValue('enabled', checked)
    if (checked && !bodyTemplate) {
      setValue('bodyTemplate', DEFAULT_EMAIL_TEMPLATE)
    }
    if (checked && !subject) {
      setValue('subject', DEFAULT_EMAIL_SUBJECT)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Mail className="h-6 w-6" />
          Étape 5 : Configuration Email
        </h2>
        <p className="text-muted-foreground mt-2">
          Configure l&apos;envoi automatique d&apos;emails aux participants après la génération de leur résultat.
        </p>
      </div>

      <Form {...form}>
        <form className="space-y-6">
          {/* Enable Toggle */}
          <FormField
            control={form.control}
            name="enabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Activer l&apos;envoi d&apos;emails</FormLabel>
                  <FormDescription>
                    Si activé, un email avec l&apos;image générée sera envoyé à chaque participant après traitement
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={handleEnableToggle}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Configuration Section (Collapsible) */}
          <Collapsible open={enabled} className="space-y-4">
            <CollapsibleContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Form Column (60%) */}
                <div className="lg:col-span-3 space-y-6">
                  {/* Subject Field */}
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Sujet de l&apos;email
                          <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            ref={subjectInputRef}
                            placeholder="Ton résultat {nom} est prêt !"
                            maxLength={200}
                            onFocus={() => setActiveField('subject')}
                          />
                        </FormControl>
                        <FormDescription>
                          Max 200 caractères
                        </FormDescription>
                        <FormMessage />
                        {subjectWarnings.length > 0 && (
                          <Alert variant="destructive" className="mt-2">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              Variables inconnues : {subjectWarnings.join(', ')}
                            </AlertDescription>
                          </Alert>
                        )}
                      </FormItem>
                    )}
                  />

                  {/* Body Template Field */}
                  <FormField
                    control={form.control}
                    name="bodyTemplate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Corps de l&apos;email
                          <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <div onFocus={() => setActiveField('body')}>
                            <RichTextEditor
                              value={field.value || ''}
                              onChange={field.onChange}
                              placeholder="Écris le contenu de ton email ici..."
                              onInsertVariable={(insertFn) => {
                                insertBodyVariableRef.current = insertFn
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                        {bodyWarnings.length > 0 && (
                          <Alert variant="destructive" className="mt-2">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              Variables inconnues dans le corps : {bodyWarnings.join(', ')}
                            </AlertDescription>
                          </Alert>
                        )}
                      </FormItem>
                    )}
                  />

                  {/* Variables Section - Single place for all variables */}
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="text-sm font-medium mb-3">
                      Variables disponibles
                      <span className="text-muted-foreground font-normal ml-2">
                        (clique pour insérer dans {activeField === 'subject' ? 'le sujet' : 'le corps'})
                      </span>
                    </p>
                    <VariableBadges
                      variables={availableVariables}
                      onInsert={handleInsertVariable}
                      emptyMessage="Aucune variable disponible. Configure les champs de base (Step 2) et/ou les questions (Step 3)."
                    />
                  </div>

                  {/* Sender Configuration */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="senderName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom de l&apos;expéditeur</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="AppsByMCI" />
                          </FormControl>
                          <FormDescription>
                            Le nom affiché dans la boîte de réception
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="senderEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email expéditeur</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="noreply@appsbymci.com"
                            />
                          </FormControl>
                          <FormDescription>
                            Adresse email d&apos;envoi (SMTP/Mailjet)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Preview Column (40%) */}
                <div className="lg:col-span-2">
                  <div className="sticky top-4">
                    <EmailPreview
                      subject={subject || ''}
                      bodyTemplate={bodyTemplate || ''}
                      availableVariables={availableVariables}
                      senderName={senderName}
                      senderEmail={senderEmail}
                    />
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Info when disabled */}
          {!enabled && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                L&apos;envoi d&apos;emails est désactivé. Les participants ne recevront pas leur résultat par email.
                Tu peux passer à l&apos;étape suivante.
              </AlertDescription>
            </Alert>
          )}
        </form>
      </Form>
    </div>
  )
}
