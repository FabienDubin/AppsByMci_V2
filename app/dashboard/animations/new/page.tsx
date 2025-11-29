'use client'

import { useAuthStore } from '@/lib/stores/auth.store'
import { useWizardStore } from '@/lib/stores/wizard.store'
import { WizardStepper } from '@/components/wizard/wizard-stepper'
import { Step1GeneralInfo } from '@/components/wizard/steps/step-1-general-info'
import { Step2AccessAndBaseFields } from '@/components/wizard/steps/step-2-access-and-base-fields'
import { Step3AdvancedInputs } from '@/components/wizard/steps/step-3-advanced-inputs'
import { Step4Pipeline } from '@/components/wizard/steps/step-4-pipeline'
import { Step5EmailConfig } from '@/components/wizard/steps/step-5-email-config'
import { Step6PublicDisplay } from '@/components/wizard/steps/step-6-public-display'
import { Step7Customization } from '@/components/wizard/steps/step-7-customization'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { RotateCcw } from 'lucide-react'
import type { Step1Data } from '@/lib/schemas/animation.schema'
import { step3Schema, step4Schema, step5Schema, step6Schema, step7Schema } from '@/lib/schemas/animation.schema'
import { DEFAULT_EMAIL_CONFIG, DEFAULT_PUBLIC_DISPLAY_CONFIG, DEFAULT_CUSTOMIZATION, DEFAULT_TEXT_CARD } from '@/lib/stores/wizard.store'
import { validatePipelineLogic } from '@/lib/utils/pipeline-validator'

// Step titles for wizard
const STEP_TITLES = [
  'Informations générales',
  'Configuration d\'accès',
  'Collecte des données',
  'Pipeline de traitement',
  'Configuration email',
  'Écran public',
  'Personnalisation',
  'Récapitulatif & Publication',
]

export default function NewAnimationPage() {
  const { user, getAccessToken } = useAuthStore()
  const router = useRouter()

  const {
    currentStep,
    animationId,
    animationData,
    isLoading,
    error,
    setAnimationId,
    updateData,
    nextStep,
    prevStep,
    setLoading,
    setError,
    resetWizard,
  } = useWizardStore()

  // Redirect if not authenticated
  if (!user) {
    router.push('/login')
    return null
  }

  /**
   * Handle Step 1 submission
   * Creates draft animation via POST /api/animations OR updates via PUT if animationId exists
   */
  const handleStep1Next = async (data: Step1Data) => {
    setLoading(true)
    setError(null) // Clear any previous errors

    try {
      const token = getAccessToken()
      if (!token) {
        throw new Error('Non authentifié')
      }

      // If animation already exists (user navigated back), try to update it
      if (animationId) {
        const response = await fetch(`/api/animations/${animationId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        })

        const result = await response.json()

        // If animation not found (deleted or session expired), create a new one
        if (response.status === 404 || result.error?.code === 'NOT_FOUND_3001') {
          console.warn('Animation not found, creating new one')
          // Clear old animationId and fall through to create new
          setAnimationId('')
        } else if (!response.ok || !result.success) {
          // Handle error without throwing
          setError(result.error?.message || 'Erreur lors de la mise à jour')
          setLoading(false)
          return
        } else {
          // Update successful
          updateData(result.data)
          nextStep()
          setLoading(false)
          return
        }
      }

      // Create new animation (either animationId was empty or update failed with 404)
      {
        const response = await fetch('/api/animations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        })

        const result = await response.json()

        if (!response.ok || !result.success) {
          // Handle error without throwing
          setError(result.error?.message || 'Erreur lors de la création')
          setLoading(false)
          return
        }

        // Store animation ID and data
        setAnimationId(result.data.id)
        updateData(result.data)

        // Move to next step
        nextStep()
      }
    } catch (error: any) {
      // Only catch unexpected errors (network issues, etc.)
      console.error('Unexpected error with animation:', error)
      setError('Une erreur inattendue est survenue')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Save animation data without advancing to next step
   * Used for intermediate saves (e.g., enabling email collection from Step 5)
   */
  const saveData = async (data: any): Promise<boolean> => {
    if (!animationId) {
      toast.error('Aucune animation en cours')
      return false
    }

    try {
      const token = getAccessToken()
      if (!token) {
        throw new Error('Non authentifié')
      }

      const response = await fetch(`/api/animations/${animationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Erreur lors de la mise à jour')
      }

      // Update local data
      updateData(result.data)
      return true
    } catch (error: any) {
      console.error('Error saving animation:', error)
      toast.error(error.message || 'Une erreur est survenue')
      return false
    }
  }

  /**
   * Handle subsequent steps (2-8)
   * Updates animation via PUT /api/animations/[id]
   */
  const handleNextStep = async (data: any) => {
    if (!animationId) {
      toast.error('Aucune animation en cours')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const token = getAccessToken()
      if (!token) {
        throw new Error('Non authentifié')
      }

      // Call PUT /api/animations/[id] to update
      const response = await fetch(`/api/animations/${animationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Erreur lors de la mise à jour')
      }

      // Update local data
      updateData(result.data)

      toast.success('Étape sauvegardée')

      // Move to next step
      nextStep()
    } catch (error: any) {
      console.error('Error updating animation:', error)
      setError(error.message)
      toast.error(error.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle previous step
   */
  const handlePrevStep = () => {
    prevStep()
  }

  /**
   * Handle reset wizard
   */
  const handleReset = () => {
    if (confirm('Es-tu sûr de vouloir réinitialiser le wizard ? Toutes les données seront perdues.')) {
      resetWizard()
      toast.success('Wizard réinitialisé')
    }
  }

  // Determine completed steps (all steps before current)
  const completedSteps = Array.from({ length: currentStep - 1 }, (_, i) => i + 1)

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Créer une animation</h1>
          <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={isLoading}
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>

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
                  <div>
                    <h2 className="text-xl font-semibold mb-2">{STEP_TITLES[2]}</h2>
                    <p className="text-sm text-muted-foreground">
                      Configurez les éléments avancés à collecter auprès des participants
                    </p>
                  </div>

                  <Step3AdvancedInputs />

                  <div className="flex justify-between pt-4 border-t">
                    <Button onClick={handlePrevStep} variant="outline" disabled={isLoading}>
                      Précédent
                    </Button>
                    <Button
                      onClick={async () => {
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
                      disabled={isLoading}
                    >
                      {isLoading ? 'Sauvegarde...' : 'Suivant'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Pipeline de Traitement */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <Step4Pipeline />

                  <div className="flex justify-between pt-4 border-t">
                    <Button onClick={handlePrevStep} variant="outline" disabled={isLoading}>
                      Précédent
                    </Button>
                    <Button
                      onClick={async () => {
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
                      disabled={isLoading}
                    >
                      {isLoading ? 'Sauvegarde...' : 'Suivant'}
                    </Button>
                  </div>
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

                  <div className="flex justify-between pt-4 border-t">
                    <Button onClick={handlePrevStep} variant="outline" disabled={isLoading}>
                      Précédent
                    </Button>
                    <Button
                      onClick={async () => {
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
                      disabled={isLoading}
                    >
                      {isLoading ? 'Sauvegarde...' : 'Suivant'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 6: Écran Public */}
              {currentStep === 6 && (
                <div className="space-y-6">
                  <Step6PublicDisplay />

                  <div className="flex justify-between pt-4 border-t">
                    <Button onClick={handlePrevStep} variant="outline" disabled={isLoading}>
                      Précédent
                    </Button>
                    <Button
                      onClick={async () => {
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
                      disabled={isLoading}
                    >
                      {isLoading ? 'Sauvegarde...' : 'Suivant'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 7: Personnalisation */}
              {currentStep === 7 && (
                <div className="space-y-6">
                  <Step7Customization />

                  <div className="flex justify-between pt-4 border-t">
                    <Button onClick={handlePrevStep} variant="outline" disabled={isLoading}>
                      Précédent
                    </Button>
                    <Button
                      onClick={async () => {
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
                      disabled={isLoading}
                    >
                      {isLoading ? 'Sauvegarde...' : 'Suivant'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 8: Récapitulatif & Publication - Placeholder */}
              {currentStep === 8 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">{STEP_TITLES[currentStep - 1]}</h2>
                  <p className="text-gray-500">Cette étape sera implémentée dans la prochaine story</p>
                  <div className="flex justify-between pt-4">
                    <Button onClick={handlePrevStep} variant="outline">
                      Précédent
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
