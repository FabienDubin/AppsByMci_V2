'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useParticipantFormStore } from '@/lib/stores/participantForm.store'
import { useAnimation } from '@/components/participant/ParticipantContext'
import { BaseFieldsStep } from './steps/BaseFieldsStep'
import { SelfieStep } from './steps/SelfieStep'
import { QuestionStep } from './steps/QuestionStep'
import type { IInputElement } from '@/models/Animation.model'

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
    formData,
  } = useParticipantFormStore()

  // Local error state for step validation
  const [stepError, setStepError] = useState<string | null>(null)

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

  /**
   * Validate current step before navigation
   * Returns true if valid, false otherwise
   */
  const validateCurrentStep = (): boolean => {
    // Clear previous error
    setStepError(null)

    // Validate selfie step
    if (currentStepConfig?.type === 'selfie') {
      const selfieElement = animation.inputCollection?.elements?.find(
        (el: IInputElement) => el.id === currentStepConfig.id
      ) as IInputElement | undefined

      // Check if selfie is required and not provided
      if (selfieElement?.required !== false && !formData.selfie) {
        const errorMessage = 'Le selfie est requis pour continuer'
        setStepError(errorMessage)
        toast.error(errorMessage)
        return false
      }
    }

    // Note: Choice questions don't need validation here because:
    // 1. Auto-navigation only triggers AFTER user clicks an option (so answer is always set)
    // 2. The store is updated synchronously, but React state may lag behind
    // 3. If we need to validate, ChoiceQuestion handles it internally before calling onNext

    // Validate free-text question
    if (currentStepConfig?.type === 'free-text') {
      const freeTextElement = animation.inputCollection?.elements?.find(
        (el: IInputElement) => el.id === currentStepConfig.id
      ) as IInputElement | undefined

      // Check if free-text is required and empty
      if (freeTextElement?.required !== false) {
        const answer = formData.answers.find(
          (a) => a.elementId === currentStepConfig.id
        )
        const textValue = (answer?.value as string) || ''
        if (!textValue.trim()) {
          const errorMessage = 'Veuillez remplir ce champ'
          setStepError(errorMessage)
          toast.error(errorMessage)
          return false
        }
      }
    }

    return true
  }

  // Handle navigation
  const handleNext = () => {
    // Validate current step before proceeding
    if (!validateCurrentStep()) {
      return
    }

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
      case 'selfie': {
        // Find the selfie element from inputCollection
        const selfieElement = animation.inputCollection?.elements?.find(
          (el: IInputElement) => el.id === currentStepConfig.id
        ) as IInputElement | undefined

        if (!selfieElement) {
          return (
            <div className="text-center py-8 text-gray-500">
              Erreur: configuration selfie manquante
            </div>
          )
        }

        return (
          <SelfieStep
            element={selfieElement}
            onNext={handleNext}
            onPrevious={handlePrevious}
            isFirstStep={isFirstStep}
            isLastStep={isLastStep}
          />
        )
      }
      case 'choice':
      case 'slider':
      case 'free-text': {
        // Find the element from inputCollection
        const questionElement = animation.inputCollection?.elements?.find(
          (el: IInputElement) => el.id === currentStepConfig.id
        ) as IInputElement | undefined

        if (!questionElement) {
          return (
            <div className="text-center py-8 text-gray-500">
              Erreur: configuration question manquante
            </div>
          )
        }

        return (
          <QuestionStep
            element={questionElement}
            onNext={handleNext}
            onPrevious={handlePrevious}
            isFirstStep={isFirstStep}
            isLastStep={isLastStep}
          />
        )
      }
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

      {/* Step validation error */}
      {stepError && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">
          {stepError}
        </div>
      )}

      {/* Navigation buttons logic:
          - base-fields: has its own navigation buttons
          - choice (not last step): auto-navigation, no buttons needed (Previous is in ChoiceQuestion)
          - choice (last step): show Submit button only
          - other types: show Previous/Next or Submit buttons
      */}
      {currentStepConfig?.type !== 'base-fields' && (
        <>
          {/* For choice questions that are NOT the last step: no nav buttons (auto-nav handles it) */}
          {/* For choice questions that ARE the last step: show Submit button */}
          {currentStepConfig?.type === 'choice' ? (
            isLastStep && (
              <div className="flex justify-center gap-4 mt-4">
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="flex-1"
                  style={{ backgroundColor: 'var(--primary-color)' }}
                >
                  Soumettre
                </Button>
              </div>
            )
          ) : (
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
        </>
      )}
    </div>
  )
}
