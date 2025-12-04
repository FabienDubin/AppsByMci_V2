'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useParticipantFormStore } from '@/lib/stores/participantForm.store'

/**
 * Error code to user-friendly message mapping
 * Based on standardized error codes from Story 4.5
 */
const ERROR_MESSAGES: Record<string, string> = {
  GEN_5002: 'La génération a pris trop de temps. Veuillez réessayer.',
  GEN_5003: 'Une erreur technique est survenue. Veuillez réessayer plus tard.',
  GEN_5004: 'Le modèle IA n\'est pas disponible. Veuillez réessayer plus tard.',
  GEN_5005: 'Configuration invalide. Contactez l\'organisateur.',
}

const DEFAULT_ERROR_MESSAGE = 'Impossible de générer ton image pour le moment.'

interface ErrorStepProps {
  /**
   * Error code from generation API
   */
  errorCode?: string
  /**
   * Custom error message (fallback if no code mapping)
   */
  errorMessage?: string
  /**
   * Animation slug for navigation
   */
  animationSlug: string
}

/**
 * Get user-friendly error message based on error code
 */
function getErrorMessage(errorCode?: string, errorMessage?: string): string {
  if (errorCode && ERROR_MESSAGES[errorCode]) {
    return ERROR_MESSAGES[errorCode]
  }
  return errorMessage || DEFAULT_ERROR_MESSAGE
}

/**
 * ErrorStep - Displays generation error with retry option
 * Shows error message and allows user to restart the flow
 */
export function ErrorStep({
  errorCode,
  errorMessage,
  animationSlug,
}: ErrorStepProps) {
  const router = useRouter()
  const reset = useParticipantFormStore((state) => state.reset)

  const displayMessage = getErrorMessage(errorCode, errorMessage)

  /**
   * Handle retry button click
   * Resets store and navigates back to form start
   */
  const handleRetry = useCallback(() => {
    reset()
    router.push(`/a/${animationSlug}`)
  }, [reset, router, animationSlug])

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[400px] text-center px-4"
      data-testid="error-step"
      data-error-code={errorCode}
    >
      {/* Error icon */}
      <div className="mb-6">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
      </div>

      {/* Error title */}
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Oups, une erreur est survenue
      </h2>

      {/* Error message */}
      <p
        className="text-gray-600 mb-8 max-w-md"
        data-testid="error-message"
      >
        {displayMessage}
      </p>

      {/* Retry button */}
      <Button
        onClick={handleRetry}
        style={{ backgroundColor: 'var(--primary-color)' }}
        className="min-w-[200px]"
        data-testid="retry-button"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Réessayer
      </Button>
    </div>
  )
}
