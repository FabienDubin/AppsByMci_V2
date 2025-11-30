'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useWizardStore } from '@/lib/stores/wizard.store'
import { useAnimationEdit } from '@/lib/hooks/useAnimationEdit'
import { WizardStepper } from '@/components/wizard/wizard-stepper'
import { Step1GeneralInfo } from '@/components/wizard/steps/step-1-general-info'
import { Step2AccessAndBaseFields } from '@/components/wizard/steps/step-2-access-and-base-fields'
import { Step3AdvancedInputs } from '@/components/wizard/steps/step-3-advanced-inputs'
import { Step4Pipeline } from '@/components/wizard/steps/step-4-pipeline'
import { Step5EmailConfig } from '@/components/wizard/steps/step-5-email-config'
import { Step6PublicDisplay } from '@/components/wizard/steps/step-6-public-display'
import { Step7Customization } from '@/components/wizard/steps/step-7/step-7-customization'
import { Step8Content } from '@/components/wizard/step8/Step8Content'
import { WizardHeader } from '@/components/wizard/wizard-header'
import { StepHeader } from '@/components/wizard/step-header'
import { WizardNavigation } from '@/components/wizard/wizard-navigation'
import { toast } from 'sonner'
import { step3Schema, step4Schema, step5Schema, step6Schema, step7Schema } from '@/lib/schemas/animation.schema'
import { DEFAULT_EMAIL_CONFIG, DEFAULT_PUBLIC_DISPLAY_CONFIG, DEFAULT_CUSTOMIZATION, DEFAULT_TEXT_CARD, WIZARD_STEP_TITLES } from '@/lib/constants/wizard-defaults'
import { validatePipelineLogic } from '@/lib/utils/pipeline-validator'
import { useWizardNavigation } from '@/lib/hooks/useWizardNavigation'
import { Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

// Step titles imported from centralized constants
const STEP_TITLES = WIZARD_STEP_TITLES

export default function EditAnimationPage() {
  const params = useParams()
  const router = useRouter()
  const { user, getAccessToken } = useAuthStore()

  const animationId = params.id as string

  const {
    currentStep,
    animationData,
    isLoading,
    error,
    setLoading,
    resetWizard,
  } = useWizardStore()

  // Load animation data in edit mode
  const {
    loading: loadingAnimation,
    error: loadError,
    canEditSlug,
  } = useAnimationEdit({
    animationId,
    getAccessToken,
  })

  // Use wizard navigation hook in edit mode
  const {
    handleStep1Next,
    handleNextStep,
    saveData,
    handlePrevStep,
    handleGoToStep,
    handleReset,
  } = useWizardNavigation({ mode: 'edit', getAccessToken })

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  if (!user) return null

  // Show loading state while fetching animation
  if (loadingAnimation) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Chargement de l&apos;animation...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show error if failed to load
  if (loadError) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-6xl">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Erreur lors du chargement de l&apos;animation : {loadError}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  // Determine completed steps (all steps before current)
  const completedSteps = Array.from({ length: currentStep - 1 }, (_, i) => i + 1)

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <WizardHeader
          mode="edit"
          animationName={animationData.name}
          onReset={handleReset}
          isLoading={isLoading}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Stepper sidebar */}
          <div className="lg:col-span-1">
            <WizardStepper
              currentStep={currentStep}
              totalSteps={8}
              stepTitles={STEP_TITLES}
              completedSteps={completedSteps}
            />
          </div>

          {/* Step content */}
          <div className="lg:col-span-3">
            <div className="rounded-lg border bg-card p-6">
              {/* Step 1: General Info */}
              {currentStep === 1 && (
                <Step1GeneralInfo
                  initialData={animationData}
                  onNext={handleStep1Next}
                  isLoading={isLoading}
                  error={error}
                  canEditSlug={canEditSlug}
                />
              )}

              {/* Step 2: Access Config + Base Fields */}
              {currentStep === 2 && (
                <Step2AccessAndBaseFields
                  initialData={animationData}
                  onNext={handleNextStep}
                  onPrev={handlePrevStep}
                  isLoading={isLoading}
                />
              )}

              {/* Step 3: Advanced Inputs (Selfie + Questions) */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <StepHeader
                    title={STEP_TITLES[2]}
                    description="Configurez les éléments avancés à collecter auprès des participants"
                  />

                  <Step3AdvancedInputs />

                  <WizardNavigation
                    onPrev={handlePrevStep}
                    onNext={async () => {
                      // Validate Step 3 data
                      const inputCollection = animationData.inputCollection

                      if (!inputCollection || !inputCollection.elements || inputCollection.elements.length === 0) {
                        toast.error('Vous devez ajouter au moins un élément de collecte')
                        return
                      }

                      try {
                        // Validate with Zod schema
                        step3Schema.parse({ inputCollection })

                        // Save and proceed
                        await handleNextStep({ inputCollection })
                      } catch (error: any) {
                        if (error.errors) {
                          toast.error(error.errors[0]?.message || 'Erreur de validation')
                        } else {
                          toast.error('Erreur de validation des données')
                        }
                      }
                    }}
                    isLoading={isLoading}
                  />
                </div>
              )}

              {/* Step 4: Pipeline de Traitement */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <Step4Pipeline />

                  <WizardNavigation
                    onPrev={handlePrevStep}
                    onNext={async () => {
                      // Validate Step 4 data with intelligent pipeline validation
                      const pipeline = animationData.pipeline || []

                      try {
                        // Zod validation (max blocks, config fields)
                        step4Schema.parse({ pipeline })

                        // Intelligent validation (AC-3.6.9)
                        const validationResult = validatePipelineLogic(
                          pipeline,
                          animationData.inputCollection
                        )

                        if (validationResult.type === 'error') {
                          toast.error(validationResult.message)
                          return
                        }

                        if (validationResult.type === 'warning' || validationResult.type === 'info') {
                          // Show warning/info and wait for user confirmation
                          toast.warning(validationResult.message, {
                            duration: 10000,
                            action: {
                              label: 'Continuer quand même',
                              onClick: async () => {
                                await handleNextStep({ pipeline })
                              },
                            },
                          })
                          return
                        }

                        // Valid pipeline - proceed
                        await handleNextStep({ pipeline })
                      } catch (error: any) {
                        if (error.errors) {
                          toast.error(error.errors[0]?.message || 'Erreur de validation')
                        } else {
                          toast.error('Erreur de validation du pipeline')
                        }
                      }
                    }}
                    isLoading={isLoading}
                  />
                </div>
              )}

              {/* Step 5: Configuration Email */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <Step5EmailConfig
                    onUpdateBaseFields={async (baseFields) => {
                      // Save baseFields update to database without advancing step
                      await saveData({ baseFields })
                    }}
                  />

                  <WizardNavigation
                    onPrev={handlePrevStep}
                    onNext={async () => {
                      // Get email config from store, merge with defaults to ensure all fields present
                      const emailConfig = {
                        ...DEFAULT_EMAIL_CONFIG,
                        ...animationData.emailConfig,
                      }

                      try {
                        // Validate with Zod schema
                        step5Schema.parse({ emailConfig })

                        // Save and proceed
                        await handleNextStep({ emailConfig })
                      } catch (error: any) {
                        if (error.errors) {
                          toast.error(error.errors[0]?.message || 'Erreur de validation')
                        } else {
                          toast.error('Erreur de validation de la configuration email')
                        }
                      }
                    }}
                    isLoading={isLoading}
                  />
                </div>
              )}

              {/* Step 6: Écran Public */}
              {currentStep === 6 && (
                <div className="space-y-6">
                  <Step6PublicDisplay />

                  <WizardNavigation
                    onPrev={handlePrevStep}
                    onNext={async () => {
                      // Get public display config from store, merge with defaults
                      const publicDisplayConfig = {
                        ...DEFAULT_PUBLIC_DISPLAY_CONFIG,
                        ...animationData.publicDisplayConfig,
                      }

                      try {
                        // Validate with Zod schema
                        step6Schema.parse({ publicDisplayConfig })

                        // Save and proceed
                        await handleNextStep({ publicDisplayConfig })
                      } catch (error: any) {
                        if (error.errors) {
                          toast.error(error.errors[0]?.message || 'Erreur de validation')
                        } else {
                          toast.error('Erreur de validation de la configuration écran public')
                        }
                      }
                    }}
                    isLoading={isLoading}
                  />
                </div>
              )}

              {/* Step 7: Personnalisation */}
              {currentStep === 7 && (
                <div className="space-y-6">
                  <Step7Customization />

                  <WizardNavigation
                    onPrev={handlePrevStep}
                    onNext={async () => {
                      // Get customization from store, deep merge with defaults
                      // Ensure textCard is properly merged (nested object)
                      const storeCustomization = animationData.customization
                      const customization = {
                        ...DEFAULT_CUSTOMIZATION,
                        ...(storeCustomization || {}),
                        // Deep merge textCard
                        textCard: {
                          ...DEFAULT_TEXT_CARD,
                          ...(storeCustomization?.textCard || {}),
                        },
                      }

                      try {
                        // Validate with Zod schema
                        step7Schema.parse({ customization })

                        // Save and proceed
                        await handleNextStep({ customization })
                      } catch (error: any) {
                        if (error.errors) {
                          toast.error(error.errors[0]?.message || 'Erreur de validation')
                        } else {
                          toast.error('Erreur de validation de la personnalisation')
                        }
                      }
                    }}
                    isLoading={isLoading}
                  />
                </div>
              )}

              {/* Step 8: Récapitulatif & Publication */}
              {currentStep === 8 && (
                <Step8Content
                  animationId={animationId}
                  animationData={animationData}
                  onGoToStep={handleGoToStep}
                  onPrev={handlePrevStep}
                  isLoading={isLoading}
                  setLoading={setLoading}
                  getAccessToken={getAccessToken}
                  resetWizard={resetWizard}
                  router={router}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
