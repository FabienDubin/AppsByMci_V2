'use client'

import { ChoiceQuestion } from './ChoiceQuestion'
import { SliderQuestion } from './SliderQuestion'
import { FreeTextQuestion } from './FreeTextQuestion'
import type { IInputElement } from '@/models/Animation.model'

interface QuestionStepProps {
  element: IInputElement
  onNext: () => void
  onPrevious: () => void
  isFirstStep: boolean
  isLastStep: boolean
}

/**
 * QuestionStep - Orchestrator component for question steps
 * Routes to the appropriate question component based on element type
 */
export function QuestionStep({
  element,
  onNext,
  onPrevious,
  isFirstStep,
  isLastStep,
}: QuestionStepProps) {
  switch (element.type) {
    case 'choice':
      return (
        <ChoiceQuestion
          element={element}
          onNext={onNext}
          onPrevious={onPrevious}
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
        />
      )
    case 'slider':
      return (
        <SliderQuestion
          element={element}
          onNext={onNext}
          onPrevious={onPrevious}
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
        />
      )
    case 'free-text':
      return (
        <FreeTextQuestion
          element={element}
          onNext={onNext}
          onPrevious={onPrevious}
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
        />
      )
    default:
      return (
        <div className="text-center py-8 text-gray-500">
          Type de question non supporté : {element.type}
        </div>
      )
  }
}
