'use client'

import { useEffect, useState, useCallback } from 'react'
import { Slider } from '@/components/ui/slider'
import { useParticipantFormStore } from '@/lib/stores/participantForm.store'
import type { IInputElement } from '@/models/Animation.model'

interface SliderQuestionProps {
  element: IInputElement
  onNext: () => void
  onPrevious: () => void
  isFirstStep: boolean
  isLastStep: boolean
}

/**
 * SliderQuestion - Step component for slider-type questions
 * Displays a range slider with min/max labels and real-time value display
 */
export function SliderQuestion({
  element,
}: SliderQuestionProps) {
  const { formData, setAnswer } = useParticipantFormStore()

  // Get min/max from element, with sensible defaults
  const min = element.min ?? 0
  const max = element.max ?? 10

  // Calculate default value (middle of range)
  const defaultValue = Math.floor((min + max) / 2)

  // Get existing answer from store for pre-fill
  const existingAnswer = formData.answers.find(
    (a) => a.elementId === element.id
  )
  const initialValue =
    existingAnswer?.value !== undefined
      ? Number(existingAnswer.value)
      : defaultValue

  const [currentValue, setCurrentValue] = useState<number>(initialValue)

  // Sync with store when navigating back
  useEffect(() => {
    const answer = formData.answers.find((a) => a.elementId === element.id)
    if (answer) {
      setCurrentValue(Number(answer.value))
    }
  }, [formData.answers, element.id])

  // Save default value to store on mount if no existing answer
  useEffect(() => {
    if (!existingAnswer) {
      setAnswer({
        elementId: element.id,
        type: 'slider',
        value: defaultValue,
      })
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * Handle slider value change
   * Updates local state and saves to store in real-time
   */
  const handleValueChange = useCallback(
    (values: number[]) => {
      const newValue = values[0]
      setCurrentValue(newValue)

      // Save to store immediately
      setAnswer({
        elementId: element.id,
        type: 'slider',
        value: newValue,
      })
    },
    [element.id, setAnswer]
  )

  // Title with required indicator
  const title = element.question || 'Ajustez le curseur'

  return (
    <div className="space-y-6">
      {/* Title with required indicator */}
      <h2 className="text-xl font-semibold text-center">
        {title}
        {element.required !== false && (
          <span className="text-red-500 ml-1" aria-label="requis">*</span>
        )}
      </h2>

      {/* Current value display - large and centered */}
      <div className="text-center">
        <span
          className="text-5xl font-bold"
          style={{ color: 'var(--primary-color)' }}
          aria-live="polite"
          aria-atomic="true"
        >
          {currentValue}
        </span>
      </div>

      {/* Slider with labels */}
      <div className="px-4 space-y-3">
        <Slider
          min={min}
          max={max}
          step={1}
          value={[currentValue]}
          onValueChange={handleValueChange}
          className="w-full"
          aria-label={title}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={currentValue}
        />

        {/* Min/Max labels */}
        <div className="flex justify-between text-sm text-gray-600">
          <span>{element.minLabel || min}</span>
          <span>{element.maxLabel || max}</span>
        </div>
      </div>
    </div>
  )
}
