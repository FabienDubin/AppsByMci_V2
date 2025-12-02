'use client'

import { useEffect, useState, useCallback } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useParticipantFormStore } from '@/lib/stores/participantForm.store'
import type { IInputElement } from '@/models/Animation.model'

interface ChoiceQuestionProps {
  element: IInputElement
  onNext: () => void
  onPrevious: () => void
  isFirstStep: boolean
  isLastStep: boolean
}

/**
 * ChoiceQuestion - Step component for choice-type questions
 * Displays options as selectable toggle/chip buttons
 * Auto-navigates to next step after selection with pulse animation
 */
export function ChoiceQuestion({
  element,
  onNext,
  onPrevious,
  isFirstStep,
  isLastStep,
}: ChoiceQuestionProps) {
  const { formData, setAnswer } = useParticipantFormStore()

  // Get existing answer from store for pre-fill
  const existingAnswer = formData.answers.find(
    (a) => a.elementId === element.id
  )
  const [selectedOption, setSelectedOption] = useState<string | null>(
    existingAnswer?.value as string | null
  )
  // Track which option is animating (for pulse effect)
  const [animatingOption, setAnimatingOption] = useState<string | null>(null)

  // Sync with store when navigating back
  useEffect(() => {
    const answer = formData.answers.find((a) => a.elementId === element.id)
    if (answer) {
      setSelectedOption(answer.value as string)
    }
  }, [formData.answers, element.id])

  /**
   * Handle option selection
   * Saves to store, plays pulse animation, then auto-navigates
   */
  const handleOptionClick = useCallback(
    (option: string) => {
      setSelectedOption(option)
      setAnimatingOption(option)

      // Save to store
      setAnswer({
        elementId: element.id,
        type: 'choice',
        value: option,
      })

      // Auto-navigate after pulse animation (500ms for 2 pulses)
      // Only auto-navigate if not the last step (last step has Submit button)
      if (!isLastStep) {
        setTimeout(() => {
          setAnimatingOption(null)
          onNext()
        }, 500)
      } else {
        // For last step, just stop the animation after a moment
        setTimeout(() => {
          setAnimatingOption(null)
        }, 500)
      }
    },
    [element.id, setAnswer, onNext, isLastStep]
  )

  // Title with required indicator
  const title = element.question || 'Choisissez une option'

  return (
    <div className="space-y-6">
      {/* Title with required indicator */}
      <h2 className="text-xl font-semibold text-center">
        {title}
        {element.required !== false && (
          <span className="text-red-500 ml-1" aria-label="requis">*</span>
        )}
      </h2>

      {/* Choice options as toggle/chip buttons */}
      <div className="flex flex-col gap-3">
        {element.options?.map((option, index) => {
          const isSelected = selectedOption === option
          const isAnimating = animatingOption === option
          return (
            <Button
              key={index}
              type="button"
              variant={isSelected ? 'default' : 'outline'}
              className={`w-full py-6 text-base transition-all ${
                isSelected
                  ? 'ring-2 ring-offset-2'
                  : 'hover:border-gray-400'
              } ${isAnimating ? 'animate-pulse-choice' : ''}`}
              style={
                isSelected
                  ? { backgroundColor: 'var(--primary-color)' }
                  : undefined
              }
              onClick={() => handleOptionClick(option)}
              aria-pressed={isSelected}
            >
              {option}
            </Button>
          )
        })}
      </div>

      {/* Discreet Previous button (no Next button - auto navigation) */}
      {!isFirstStep && (
        <div className="flex justify-start pt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onPrevious}
            className="text-gray-500 hover:text-gray-700"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Précédent
          </Button>
        </div>
      )}
    </div>
  )
}
