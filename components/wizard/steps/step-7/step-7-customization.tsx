'use client'

import { useEffect, useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useWizardStore, DEFAULT_CUSTOMIZATION, DEFAULT_LOADING_MESSAGES, DEFAULT_TEXT_CARD } from '@/lib/stores/wizard.store'
import { step7Schema } from '@/lib/schemas/animation.schema'
import type { TextCard } from '@/lib/stores/wizard.store'
import { ColorsSection } from './colors-section'
import { BackgroundSection } from './background-section'
import { TextCardSection } from './text-card-section'
import { MessagesSection } from './messages-section'

// Form values type for React Hook Form
interface CustomizationFormValues {
  customization: {
    primaryColor: string
    secondaryColor: string
    logo?: string
    backgroundImage?: string
    backgroundColor?: string
    backgroundColorOpacity?: number
    textCard?: TextCard
    theme: 'light' | 'dark' | 'auto'
    welcomeMessage?: string
    submissionMessage: string
    loadingMessages: string[]
    thankYouMessage: string
  }
}
import { messagesToText } from '@/lib/utils/loading-messages'
import { Form } from '@/components/ui/form'
import { CustomizationPreview } from '@/components/wizard/customization-preview'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Palette, Info } from 'lucide-react'

interface Step7CustomizationProps {
  onValidationChange?: (isValid: boolean) => void
}

/**
 * Step 7: Customization
 * Branding and personalization configuration
 */
export function Step7Customization({ onValidationChange }: Step7CustomizationProps) {
  const { getAccessToken } = useAuthStore()
  const { animationData, updateData } = useWizardStore()

  // Collapsible sections state
  const [openSections, setOpenSections] = useState({
    colors: true,
    background: true,
    textCard: true,
    messages: true,
  })

  // Loading messages as text state
  const [loadingMessagesText, setLoadingMessagesText] = useState(
    messagesToText(animationData.customization?.loadingMessages ?? DEFAULT_LOADING_MESSAGES)
  )
  const [loadingMessagesError, setLoadingMessagesError] = useState<string | null>(null)

  // Initialize form with stored data or defaults
  const form = useForm<CustomizationFormValues>({
    resolver: zodResolver(step7Schema),
    defaultValues: {
      customization: {
        primaryColor: animationData.customization?.primaryColor ?? DEFAULT_CUSTOMIZATION.primaryColor,
        secondaryColor: animationData.customization?.secondaryColor ?? DEFAULT_CUSTOMIZATION.secondaryColor,
        logo: animationData.customization?.logo,
        backgroundImage: animationData.customization?.backgroundImage,
        backgroundColor: animationData.customization?.backgroundColor,
        backgroundColorOpacity: animationData.customization?.backgroundColorOpacity ?? DEFAULT_CUSTOMIZATION.backgroundColorOpacity,
        textCard: animationData.customization?.textCard ?? DEFAULT_TEXT_CARD,
        theme: animationData.customization?.theme ?? DEFAULT_CUSTOMIZATION.theme,
        welcomeMessage: animationData.customization?.welcomeMessage,
        submissionMessage: animationData.customization?.submissionMessage ?? DEFAULT_CUSTOMIZATION.submissionMessage,
        loadingMessages: animationData.customization?.loadingMessages ?? DEFAULT_CUSTOMIZATION.loadingMessages,
        thankYouMessage: animationData.customization?.thankYouMessage ?? DEFAULT_CUSTOMIZATION.thankYouMessage,
      },
    },
    mode: 'onChange',
  })

  const { watch } = form
  const watchedCustomization = watch('customization')
  const backgroundImage = watch('customization.backgroundImage')
  const backgroundColor = watch('customization.backgroundColor')
  const textCardEnabled = watch('customization.textCard.enabled')
  // Watch all textCard fields for real-time preview updates
  const textCardBackgroundColor = watch('customization.textCard.backgroundColor')
  const textCardOpacity = watch('customization.textCard.opacity')
  const textCardBorderRadius = watch('customization.textCard.borderRadius')
  const textCardPadding = watch('customization.textCard.padding')

  // Check if no background is configured
  const hasNoBackground = !backgroundImage && !backgroundColor

  // Get auth token from store
  const getAuthToken = useCallback(async (): Promise<string | null> => {
    return getAccessToken()
  }, [getAccessToken])

  // Sync form values to wizard store
  // This runs on mount AND on every form change
  useEffect(() => {
    // Sync initial values on mount
    const currentValues = form.getValues()
    if (currentValues.customization) {
      updateData({
        customization: {
          primaryColor: currentValues.customization.primaryColor ?? DEFAULT_CUSTOMIZATION.primaryColor,
          secondaryColor: currentValues.customization.secondaryColor ?? DEFAULT_CUSTOMIZATION.secondaryColor,
          logo: currentValues.customization.logo,
          backgroundImage: currentValues.customization.backgroundImage,
          backgroundColor: currentValues.customization.backgroundColor,
          backgroundColorOpacity: currentValues.customization.backgroundColorOpacity ?? DEFAULT_CUSTOMIZATION.backgroundColorOpacity,
          textCard: currentValues.customization.textCard ?? DEFAULT_TEXT_CARD,
          theme: currentValues.customization.theme ?? DEFAULT_CUSTOMIZATION.theme,
          welcomeMessage: currentValues.customization.welcomeMessage,
          submissionMessage: currentValues.customization.submissionMessage ?? DEFAULT_CUSTOMIZATION.submissionMessage,
          loadingMessages: (currentValues.customization.loadingMessages?.filter((m): m is string => m !== undefined) ?? DEFAULT_CUSTOMIZATION.loadingMessages),
          thankYouMessage: currentValues.customization.thankYouMessage ?? DEFAULT_CUSTOMIZATION.thankYouMessage,
        },
      })
    }

    // Subscribe to form changes
    const subscription = form.watch((value) => {
      if (value.customization) {
        updateData({
          customization: {
            primaryColor: value.customization.primaryColor ?? DEFAULT_CUSTOMIZATION.primaryColor,
            secondaryColor: value.customization.secondaryColor ?? DEFAULT_CUSTOMIZATION.secondaryColor,
            logo: value.customization.logo,
            backgroundImage: value.customization.backgroundImage,
            backgroundColor: value.customization.backgroundColor,
            backgroundColorOpacity: value.customization.backgroundColorOpacity ?? DEFAULT_CUSTOMIZATION.backgroundColorOpacity,
            textCard: value.customization.textCard as TextCard ?? DEFAULT_TEXT_CARD,
            theme: value.customization.theme ?? DEFAULT_CUSTOMIZATION.theme,
            welcomeMessage: value.customization.welcomeMessage,
            submissionMessage: value.customization.submissionMessage ?? DEFAULT_CUSTOMIZATION.submissionMessage,
            loadingMessages: (value.customization.loadingMessages?.filter((m): m is string => m !== undefined) ?? DEFAULT_CUSTOMIZATION.loadingMessages),
            thankYouMessage: value.customization.thankYouMessage ?? DEFAULT_CUSTOMIZATION.thankYouMessage,
          },
        })
      }
    })
    return () => subscription.unsubscribe()
  }, [form, updateData])

  // Report validation state to parent
  useEffect(() => {
    // Form is valid if no schema errors AND no loading messages errors
    const isValid = form.formState.isValid && !loadingMessagesError
    onValidationChange?.(isValid)
  }, [form.formState.isValid, loadingMessagesError, onValidationChange])

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Palette className="h-6 w-6" />
          Étape 7 : Personnalisation
        </h2>
        <p className="text-muted-foreground mt-2">
          Personnalise l&apos;apparence et les messages de ton animation pour correspondre à ton événement.
        </p>
      </div>

      <Form {...form}>
        <form className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Form Column (60%) */}
            <div className="lg:col-span-3 space-y-4">
              {/* Colors Section */}
              <ColorsSection
                form={form}
                open={openSections.colors}
                onToggle={() => toggleSection('colors')}
              />

              {/* Background Section */}
              <BackgroundSection
                form={form}
                open={openSections.background}
                onToggle={() => toggleSection('background')}
                hasNoBackground={hasNoBackground}
                backgroundImage={backgroundImage}
                getAuthToken={getAuthToken}
              />

              {/* Text Card Section */}
              <TextCardSection
                form={form}
                open={openSections.textCard}
                onToggle={() => toggleSection('textCard')}
                textCardEnabled={textCardEnabled ?? false}
              />

              {/* Messages Section */}
              <MessagesSection
                form={form}
                open={openSections.messages}
                onToggle={() => toggleSection('messages')}
                loadingMessagesText={loadingMessagesText}
                setLoadingMessagesText={setLoadingMessagesText}
                loadingMessagesError={loadingMessagesError}
                setLoadingMessagesError={setLoadingMessagesError}
                defaultLoadingMessages={DEFAULT_LOADING_MESSAGES}
              />
            </div>

            {/* Preview Column (40%) */}
            <div className="lg:col-span-2">
              <div className="sticky top-4">
                <CustomizationPreview
                  customization={{
                    ...watchedCustomization,
                    // Override textCard with directly watched values for real-time updates
                    textCard: {
                      enabled: textCardEnabled ?? DEFAULT_TEXT_CARD.enabled,
                      backgroundColor: textCardBackgroundColor ?? DEFAULT_TEXT_CARD.backgroundColor,
                      opacity: textCardOpacity ?? DEFAULT_TEXT_CARD.opacity,
                      borderRadius: textCardBorderRadius ?? DEFAULT_TEXT_CARD.borderRadius,
                      padding: textCardPadding ?? DEFAULT_TEXT_CARD.padding,
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Tu peux personnaliser ces éléments à tout moment depuis le tableau de bord de l&apos;animation.
            </AlertDescription>
          </Alert>
        </form>
      </Form>
    </div>
  )
}
