'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import { redirect, notFound } from 'next/navigation'
import { ResultStep } from '@/components/participant/steps/ResultStep'
import { ErrorStep } from '@/components/participant/steps/ErrorStep'
import { useAnimation } from '@/components/participant/ParticipantContext'
import { Loader2 } from 'lucide-react'

interface ResultPageProps {
  params: Promise<{
    slug: string
    generationId: string
  }>
}

interface GenerationData {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  resultUrl?: string
  error?: {
    code: string
    message: string
  }
  // Story 4.7 AC7: Email status for UI feedback
  emailSent?: boolean
  participantEmail?: string
}

/**
 * Result page for direct URL access
 * Displays the generation result or error based on status
 */
export default function ResultPage({ params }: ResultPageProps) {
  const { slug, generationId } = use(params)
  const animation = useAnimation()

  const [generation, setGeneration] = useState<GenerationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFoundError, setNotFoundError] = useState(false)

  // Fetch generation data
  useEffect(() => {
    const fetchGeneration = async () => {
      try {
        const response = await fetch(`/api/generations/${generationId}`)
        const data = await response.json()

        if (!response.ok) {
          if (response.status === 404) {
            setNotFoundError(true)
            return
          }
          throw new Error(data.error?.message || 'Erreur de chargement')
        }

        setGeneration(data.data)
      } catch {
        setNotFoundError(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchGeneration()
  }, [generationId])

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 animate-spin text-gray-400" />
        <p className="mt-4 text-gray-600">Chargement...</p>
      </div>
    )
  }

  // 404 - Generation not found
  if (notFoundError || !generation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
          <span className="text-4xl">🔍</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Résultat non trouvé
        </h2>
        <p className="text-gray-600 mb-8 max-w-md">
          Ce résultat n&apos;existe pas ou n&apos;est plus disponible.
        </p>
      </div>
    )
  }

  // Redirect if still processing or pending
  if (generation.status === 'pending' || generation.status === 'processing') {
    // Redirect to the main participant page - they shouldn't be here yet
    redirect(`/a/${slug}`)
  }

  // Error state - generation failed
  if (generation.status === 'failed') {
    return (
      <div className="py-4">
        <ErrorStep
          errorCode={generation.error?.code}
          errorMessage={generation.error?.message}
          animationSlug={slug}
        />
      </div>
    )
  }

  // Success state - generation completed
  if (generation.status === 'completed' && generation.resultUrl) {
    return (
      <div className="py-4">
        <ResultStep
          resultUrl={generation.resultUrl}
          animationSlug={slug}
          thankYouMessage={animation.customization?.thankYouMessage}
          // Story 4.7 AC7: Use actual emailSent status instead of just enabled config
          emailEnabled={generation.emailSent}
          userEmail={generation.participantEmail}
          generationId={generationId}
        />
      </div>
    )
  }

  // Fallback - shouldn't reach here
  return notFound()
}
