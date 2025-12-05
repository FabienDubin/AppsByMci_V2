'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Download, RefreshCw, Mail, ImageOff } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useParticipantFormStore } from '@/lib/stores/participantForm.store'

interface ResultStepProps {
  /**
   * URL of the generated image (with SAS token)
   */
  resultUrl: string
  /**
   * Animation slug for navigation
   */
  animationSlug: string
  /**
   * Thank you message from animation.customization.thankYouMessage
   * Only displayed if defined and non-empty
   */
  thankYouMessage?: string
  /**
   * Whether email is enabled and user provided email
   */
  emailEnabled?: boolean
  /**
   * User email for confirmation message
   */
  userEmail?: string
  /**
   * Generation ID for download
   */
  generationId: string
}

/**
 * Skeleton placeholder for image loading
 */
function ImageSkeleton() {
  return (
    <div
      className="w-full aspect-square max-w-md mx-auto rounded-lg animate-pulse bg-gray-200"
      data-testid="image-skeleton"
    />
  )
}

/**
 * Error fallback when image fails to load
 */
function ImageError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="w-full aspect-square max-w-md mx-auto rounded-lg bg-gray-100 flex flex-col items-center justify-center gap-4"
      data-testid="image-error"
    >
      <ImageOff className="w-16 h-16 text-gray-400" />
      <p className="text-gray-600 text-center px-4">Impossible de charger l&apos;image</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="w-4 h-4 mr-2" />
        Réessayer
      </Button>
    </div>
  )
}

/**
 * ResultStep - Displays the successful generation result
 * Shows the generated image with download and restart options
 */
export function ResultStep({
  resultUrl,
  animationSlug,
  thankYouMessage,
  emailEnabled,
  userEmail,
  generationId,
}: ResultStepProps) {
  const router = useRouter()
  const reset = useParticipantFormStore((state) => state.reset)

  const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'error'>('loading')
  const [isDownloading, setIsDownloading] = useState(false)
  const [imageKey, setImageKey] = useState(0) // For forcing re-render on retry

  /**
   * Handle image load success
   */
  const handleImageLoad = useCallback(() => {
    setImageStatus('loaded')
  }, [])

  /**
   * Handle image load error
   */
  const handleImageError = useCallback(() => {
    setImageStatus('error')
  }, [])

  /**
   * Retry loading the image
   */
  const handleRetryImage = useCallback(() => {
    setImageStatus('loading')
    setImageKey((prev) => prev + 1)
  }, [])

  /**
   * Handle download button click
   * Downloads via API to get proper Content-Disposition header
   */
  const handleDownload = useCallback(async () => {
    setIsDownloading(true)

    try {
      const response = await fetch(`/api/generations/${generationId}/download`)

      if (!response.ok) {
        throw new Error('Download failed')
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `${animationSlug}-${Date.now()}.png`

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^";\n]+)"?/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Image téléchargée !')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Erreur lors du téléchargement')
    } finally {
      setIsDownloading(false)
    }
  }, [generationId, animationSlug])

  /**
   * Handle restart button click
   * Resets store and navigates back to form start
   */
  const handleRestart = useCallback(() => {
    reset()
    router.push(`/a/${animationSlug}`)
  }, [reset, router, animationSlug])

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[400px] text-center px-4"
      data-testid="result-step"
      data-generation-id={generationId}
    >
      {/* Thank you message (only if defined and non-empty) */}
      {thankYouMessage && thankYouMessage.trim() && (
        <p
          className="text-xl font-medium mb-6"
          style={{ color: 'var(--primary-color)' }}
          data-testid="thank-you-message"
        >
          {thankYouMessage}
        </p>
      )}

      {/* Generated image */}
      <div className="w-full max-w-md mx-auto mb-6">
        {imageStatus === 'loading' && <ImageSkeleton />}
        {imageStatus === 'error' && <ImageError onRetry={handleRetryImage} />}

        <div className={imageStatus !== 'loaded' ? 'hidden' : ''}>
          <Image
            key={imageKey}
            src={resultUrl}
            alt="Image générée"
            width={512}
            height={512}
            className="w-full h-auto rounded-lg shadow-lg"
            onLoad={handleImageLoad}
            onError={handleImageError}
            priority
            data-testid="generated-image"
          />
        </div>
      </div>

      {/* Email confirmation message */}
      {emailEnabled && userEmail && (
        <div
          className="flex items-center gap-2 text-gray-600 mb-6"
          data-testid="email-confirmation"
        >
          <span>Un email a été envoyé à {userEmail}</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <Button
          onClick={handleDownload}
          disabled={isDownloading || imageStatus !== 'loaded'}
          className="flex-1"
          style={{ backgroundColor: 'var(--primary-color)' }}
          data-testid="download-button"
        >
          <Download className="w-4 h-4 mr-2" />
          {isDownloading ? 'Téléchargement...' : 'Télécharger'}
        </Button>

        <Button
          variant="outline"
          onClick={handleRestart}
          className="flex-1"
          data-testid="restart-button"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Recommencer
        </Button>
      </div>
    </div>
  )
}
