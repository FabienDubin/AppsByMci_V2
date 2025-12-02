'use client'

import { useEffect, useState, useCallback } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { useParticipantFormStore } from '@/lib/stores/participantForm.store'
import type { IInputElement } from '@/models/Animation.model'

interface FreeTextQuestionProps {
  element: IInputElement
  onNext: () => void
  onPrevious: () => void
  isFirstStep: boolean
  isLastStep: boolean
}

/**
 * FreeTextQuestion - Step component for free-text questions
 * Displays a textarea with character counter and maxLength enforcement
 */
export function FreeTextQuestion({
  element,
}: FreeTextQuestionProps) {
  const { formData, setAnswer } = useParticipantFormStore()

  // Get maxLength with default
  const maxLength = element.maxLength ?? 500

  // Get existing answer from store for pre-fill
  const existingAnswer = formData.answers.find(
    (a) => a.elementId === element.id
  )
  const initialValue = (existingAnswer?.value as string) || ''

  const [text, setText] = useState<string>(initialValue)

  // Sync with store when navigating back
  useEffect(() => {
    const answer = formData.answers.find((a) => a.elementId === element.id)
    if (answer) {
      setText(answer.value as string)
    }
  }, [formData.answers, element.id])

  /**
   * Handle text change
   * Enforces maxLength and saves to store
   */
  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value

      // Don't allow exceeding maxLength (native maxLength attribute handles this,
      // but we double-check for safety)
      if (newValue.length > maxLength) {
        return
      }

      setText(newValue)

      // Save to store immediately
      setAnswer({
        elementId: element.id,
        type: 'free-text',
        value: newValue,
      })
    },
    [element.id, maxLength, setAnswer]
  )

  // Title with required indicator
  const title = element.question || 'Votre réponse'

  // Character count status
  const charCount = text.length
  const isAtLimit = charCount >= maxLength

  return (
    <div className="space-y-6">
      {/* Title with required indicator */}
      <h2 className="text-xl font-semibold text-center">
        {title}
        {element.required !== false && (
          <span className="text-red-500 ml-1" aria-label="requis">*</span>
        )}
      </h2>

      {/* Textarea with placeholder */}
      <div className="space-y-2">
        <Textarea
          value={text}
          onChange={handleTextChange}
          placeholder={element.placeholder || 'Écrivez votre réponse ici...'}
          maxLength={maxLength}
          rows={4}
          className="min-h-[120px] resize-none text-base"
          aria-label={title}
          aria-describedby="char-counter"
        />

        {/* Character counter */}
        <div
          id="char-counter"
          className={`text-sm text-right ${
            isAtLimit ? 'text-red-500 font-medium' : 'text-gray-500'
          }`}
          aria-live="polite"
        >
          {charCount} / {maxLength} caractères
          {isAtLimit && ' (maximum atteint)'}
        </div>
      </div>
    </div>
  )
}
