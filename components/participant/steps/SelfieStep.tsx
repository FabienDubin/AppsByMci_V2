'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Camera, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useParticipantFormStore } from '@/lib/stores/participantForm.store'
import { WebcamCapture } from '@/components/participant/WebcamCapture'
import { FileUpload } from '@/components/participant/FileUpload'
import type { IInputElement } from '@/models/Animation.model'

// Maximum file size: 10 MB
const MAX_FILE_SIZE = 10 * 1024 * 1024
// Allowed MIME types
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

interface SelfieStepProps {
  element: IInputElement
  onNext: () => void
  onPrevious: () => void
  isFirstStep: boolean
  isLastStep: boolean
}

/**
 * SelfieStep - Step component for selfie capture/upload
 * Shows webcam interface by default, with fallback to file upload
 * Same experience on all devices
 */
export function SelfieStep({
  element,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onNext: _onNext,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onPrevious: _onPrevious,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isFirstStep: _isFirstStep,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isLastStep: _isLastStep,
}: SelfieStepProps) {
  // Mode: 'webcam' or 'upload'
  const [mode, setMode] = useState<'webcam' | 'upload'>('webcam')
  // Error state
  const [error, setError] = useState<string | null>(null)
  // Captured/selected image as blob URL for preview
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  // File blob for store
  const fileRef = useRef<File | null>(null)

  const { setSelfie, formData } = useParticipantFormStore()

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  // Load existing selfie from store
  useEffect(() => {
    if (formData.selfie && !previewUrl) {
      setPreviewUrl(formData.selfie)
    }
  }, [formData.selfie, previewUrl])

  /**
   * Validate file: size and MIME type
   */
  const validateFile = useCallback((file: File): string | null => {
    // Check size
    if (file.size > MAX_FILE_SIZE) {
      return 'La photo ne doit pas dépasser 10 MB'
    }

    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return 'Format de fichier invalide. Utilisez JPG, PNG ou WEBP.'
    }

    return null
  }, [])

  /**
   * Handle captured/selected image
   * Receives a File object from WebcamCapture or FileUpload
   * Automatically saves to store for the wizard's Suivant button
   */
  const handleImageCapture = useCallback(
    (file: File) => {
      // Validate file
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }

      // Clear any previous error
      setError(null)

      // Revoke previous URL if exists
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }

      // Create blob URL for preview
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      fileRef.current = file

      // Automatically save to store as base64
      // This way the wizard's "Suivant" button will work
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        setSelfie(base64)
      }
      reader.readAsDataURL(file)
    },
    [validateFile, previewUrl, setSelfie]
  )

  /**
   * Handle retry: clear current image and store
   */
  const handleRetry = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    fileRef.current = null
    setError(null)
    // Also clear the store so we can take a new photo
    setSelfie(undefined)
  }, [previewUrl, setSelfie])

  /**
   * Switch to upload mode
   */
  const switchToUpload = useCallback(() => {
    setMode('upload')
  }, [])

  /**
   * Switch to webcam mode
   */
  const switchToWebcam = useCallback(() => {
    setMode('webcam')
  }, [])

  // Title: use element.question if set, otherwise default
  const title = element.question || 'Prendre un selfie'

  return (
    <div className="space-y-6">
      {/* Title */}
      <h2 className="text-xl font-semibold text-center">{title}</h2>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Content: webcam or upload based on mode */}
      <Card className="p-4">
        {mode === 'webcam' ? (
          <WebcamCapture
            onCapture={handleImageCapture}
            previewUrl={previewUrl}
            onRetry={handleRetry}
            onSwitchToUpload={switchToUpload}
            setError={setError}
          />
        ) : (
          <div className="space-y-4">
            <FileUpload
              onFileSelect={handleImageCapture}
              previewUrl={previewUrl}
              onRetry={handleRetry}
              error={error}
              setError={setError}
            />

            {/* Button to switch back to webcam */}
            <Button
              type="button"
              variant="outline"
              onClick={switchToWebcam}
              className="w-full"
            >
              <Camera className="w-4 h-4 mr-2" />
              Utiliser la webcam
            </Button>
          </div>
        )}
      </Card>

      {/* Required indicator */}
      {element.required !== false && (
        <p className="text-sm text-gray-500 text-center">
          <span className="text-red-500">*</span> Cette étape est requise
        </p>
      )}
    </div>
  )
}
