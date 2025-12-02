'use client'

import { useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useParticipantFormStore } from '@/lib/stores/participantForm.store'
import { useAnimation } from '@/components/participant/ParticipantContext'
import { BaseFieldsStep } from './steps/BaseFieldsStep'

interface ParticipantWizardProps {
  className?: string
}

/**
 * ParticipantWizard - Multi-step form for participant experience
 * Manages step navigation and displays appropriate step content
 */
export function ParticipantWizard({ className }: ParticipantWizardProps) {
  const animation = useAnimation()
  const {
    currentStep,
    totalSteps,
    setTotalSteps,
    nextStep,
    prevStep,
    isSubmitting,
  } = useParticipantFormStore()

  // Calculate total steps based on animation configuration
  const stepConfig = useMemo(() => {
    const steps: { id: string; type: string }[] = []

    // Step 1: Base fields (always present if any field is enabled)
    const hasBaseFields = animation.baseFields && (
      animation.baseFields.name?.enabled ||
      animation.baseFields.firstName?.enabled ||
      animation.baseFields.email?.enabled
    )

    if (hasBaseFields || animation.accessConfig?.type === 'code') {
      steps.push({ id: 'base-fields', type: 'base-fields' })
    }

    // Steps 2+: Input collection elements (each as full screen)
    if (animation.inputCollection?.elements) {
      const sortedElements = [...animation.inputCollection.elements].sort(
        (a, b) => a.order - b.order
      )
      sortedElements.forEach((element) => {
        steps.push({ id: element.id, type: element.type })
      })
    }

    // Final step: Submission (if no elements, base fields go straight to submit)
    if (steps.length === 0) {
      steps.push({ id: 'base-fields', type: 'base-fields' })
    }

    return steps
  }, [animation])

  // Update total steps when config changes
  useEffect(() => {
    setTotalSteps(stepConfig.length)
  }, [stepConfig, setTotalSteps])

  // Progress percentage
  const progressPercentage = (currentStep / totalSteps) * 100

  // Current step info
  const currentStepConfig = stepConfig[currentStep - 1]
  const isFirstStep = currentStep === 1
  const isLastStep = currentStep === totalSteps

  // Handle navigation
  const handleNext = () => {
    if (!isLastStep) {
      nextStep()
    }
  }

  const handlePrevious = () => {
    if (!isFirstStep) {
      prevStep()
    }
  }

  // Render current step content
  const renderStepContent = () => {
    if (!currentStepConfig) return null

    switch (currentStepConfig.type) {
      case 'base-fields':
        return (
          <BaseFieldsStep
            onNext={handleNext}
            onPrevious={handlePrevious}
            isFirstStep={isFirstStep}
            isLastStep={isLastStep}
          />
        )
      case 'selfie':
        // TODO: Implement SelfieStep (Story 4.3)
        return (
          <div className="text-center py-8 text-gray-500">
            Capture selfie (à implémenter)
          </div>
        )
      case 'choice':
      case 'slider':
      case 'free-text':
        // TODO: Implement QuestionStep (Story 4.4)
        return (
          <div className="text-center py-8 text-gray-500">
            Question (à implémenter)
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className={className}>
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">
            Étape {currentStep} sur {totalSteps}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(progressPercentage)}%
          </span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Step content */}
      <div className="mb-6">
        {renderStepContent()}
      </div>

      {/* Navigation buttons - only show if not on base-fields step (which has its own buttons) */}
      {currentStepConfig?.type !== 'base-fields' && (
        <div className="flex justify-between gap-4">
          {!isFirstStep && (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={isSubmitting}
              className="flex-1"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Précédent
            </Button>
          )}

          <Button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
            className={isFirstStep ? 'w-full' : 'flex-1'}
            style={{ backgroundColor: 'var(--primary-color)' }}
          >
            {isLastStep ? 'Soumettre' : 'Suivant'}
            {!isLastStep && <ChevronRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      )}
    </div>
  )
}
