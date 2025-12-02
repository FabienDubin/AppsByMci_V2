'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

/**
 * Default loading messages shown during generation
 */
const DEFAULT_LOADING_MESSAGES = [
  "🎨 L'IA travaille sur ton image...",
  '✨ Un peu de magie en cours...',
  '🚀 Génération en cours, patience...',
  '🌟 Presque terminé, ça arrive !',
  '🎭 On peaufine les derniers détails...',
]

/**
 * Interval in milliseconds between message rotations
 */
const MESSAGE_ROTATION_INTERVAL = 3500 // 3.5 seconds

interface ProcessingStepProps {
  /**
   * Generation ID for polling (used in Story 4.5)
   */
  generationId: string
  /**
   * Custom loading messages from animation.customization.loadingMessages
   * If provided, these override the default messages
   */
  customLoadingMessages?: string[]
}

/**
 * ProcessingStep - Loading screen shown after form submission
 * Displays rotating messages while generation is in progress
 */
export function ProcessingStep({ generationId, customLoadingMessages }: ProcessingStepProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)

  // Use custom messages if provided, otherwise use defaults
  const messages =
    customLoadingMessages && customLoadingMessages.length > 0
      ? customLoadingMessages
      : DEFAULT_LOADING_MESSAGES

  // Rotate messages at regular intervals
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % messages.length)
    }, MESSAGE_ROTATION_INTERVAL)

    return () => clearInterval(interval)
  }, [messages.length])

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[400px] text-center px-4"
      data-testid="processing-step"
      data-generation-id={generationId}
    >
      {/* Animated spinner */}
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-full border-4 border-gray-200" />
        <Loader2
          className="absolute inset-0 w-20 h-20 animate-spin"
          style={{ color: 'var(--primary-color)' }}
        />
      </div>

      {/* Rotating message */}
      <p
        className="text-xl font-medium text-gray-700 transition-opacity duration-300"
        data-testid="loading-message"
      >
        {messages[currentMessageIndex]}
      </p>

      {/* Subtle hint */}
      {/* <p className="mt-4 text-sm text-gray-500">
        Ne ferme pas cette page
      </p> */}
    </div>
  )
}
