'use client'

import { useAuthStore } from '@/lib/stores/auth.store'
import { useWizardStore } from '@/lib/stores/wizard.store'
import { WizardStepper } from '@/components/wizard/wizard-stepper'
import { Step1GeneralInfo } from '@/components/wizard/steps/step-1-general-info'
import { Step2AccessAndBaseFields } from '@/components/wizard/steps/step-2-access-and-base-fields'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { Step1Data, Step2Data } from '@/lib/schemas/animation.schema'

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
    setAnimationId,
    updateData,
    nextStep,
    prevStep,
    setLoading,
    setError,
  } = useWizardStore()

  // Redirect if not authenticated
  if (!user) {
    router.push('/login')
    return null
  }

  /**
   * Handle Step 1 submission
   * Creates draft animation via POST /api/animations
   */
  const handleStep1Next = async (data: Step1Data) => {
    setLoading(true)
    setError(null)

    try {
      const token = getAccessToken()
      if (!token) {
        throw new Error('Non authentifié')
      }

      // Call POST /api/animations to create draft
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
        throw new Error(result.error?.message || 'Erreur lors de la création')
      }

      // Store animation ID and data
      setAnimationId(result.data.id)
      updateData(result.data)

      toast.success('Animation créée avec succès')

      // Move to next step
      nextStep()
    } catch (error: any) {
      console.error('Error creating animation:', error)
      setError(error.message)
      toast.error(error.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
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

  // Determine completed steps (all steps before current)
  const completedSteps = Array.from({ length: currentStep - 1 }, (_, i) => i + 1)

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Créer une animation</h1>
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

              {currentStep >= 3 && currentStep <= 8 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">{STEP_TITLES[currentStep - 1]}</h2>
                  <p className="text-gray-500">Cette étape sera implémentée dans les prochaines stories</p>
                  <div className="flex justify-between pt-4">
                    <Button onClick={handlePrevStep} variant="outline">
                      Précédent
                    </Button>
                    {currentStep < 8 && (
                      <Button onClick={() => handleNextStep({})}>
                        Suivant
                      </Button>
                    )}
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
