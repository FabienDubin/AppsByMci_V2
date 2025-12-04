'use client'

import { useRef, useCallback, useState } from 'react'
import Webcam from 'react-webcam'
import { Camera, Upload, Check, RefreshCw, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WebcamCaptureProps {
  onCapture: (file: File) => void
  previewUrl: string | null
  onRetry: () => void
  onSwitchToUpload: () => void
  setError: (error: string | null) => void
}

// Video constraints for webcam - request high resolution for better AI processing
// Using ideal: 1080 allows the browser to use the best available resolution
// If the camera can't do 1080p, it will use the maximum available
const videoConstraints = {
  width: { ideal: 1920 },
  height: { ideal: 1080 },
  facingMode: 'user', // Front camera
}

/**
 * WebcamCapture - Desktop webcam capture component
 * Uses react-webcam to capture photos from the user's webcam
 */
export function WebcamCapture({
  onCapture,
  previewUrl,
  onRetry,
  onSwitchToUpload,
  setError,
}: WebcamCaptureProps) {
  const webcamRef = useRef<Webcam>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [cameraError, setCameraError] = useState<string | null>(null)

  // Handle user media error (permission denied or no camera)
  const handleUserMediaError = useCallback(
    (error: string | DOMException) => {
      setIsLoading(false)
      setHasPermission(false)

      // Determine error type
      const errorMessage =
        error instanceof DOMException
          ? error.name
          : typeof error === 'string'
          ? error
          : 'Unknown error'

      // User denied permission
      if (
        errorMessage === 'NotAllowedError' ||
        errorMessage === 'PermissionDeniedError'
      ) {
        setCameraError('Accès à la webcam refusé')
        setError('Veuillez autoriser l\'accès à votre caméra ou uploader une photo.')
      }
      // No camera available
      else if (
        errorMessage === 'NotFoundError' ||
        errorMessage === 'DevicesNotFoundError'
      ) {
        setCameraError('Aucune webcam détectée')
        setError('Aucune webcam n\'a été trouvée sur votre appareil.')
      }
      // Other errors
      else {
        setCameraError('Erreur d\'accès à la webcam')
        setError('Impossible d\'accéder à la webcam. Veuillez uploader une photo.')
      }
    },
    [setError]
  )

  // Handle user media success
  const handleUserMedia = useCallback(() => {
    setIsLoading(false)
    setHasPermission(true)
    setCameraError(null)
    setError(null)
  }, [setError])

  /**
   * Capture photo from webcam
   */
  const capture = useCallback(() => {
    if (!webcamRef.current) return

    // Get screenshot as base64 data URL
    const imageSrc = webcamRef.current.getScreenshot()
    if (!imageSrc) {
      setError('Erreur lors de la capture de la photo')
      return
    }

    // Convert base64 to blob/file
    fetch(imageSrc)
      .then((res) => res.blob())
      .then((blob) => {
        // Create File object
        const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' })
        onCapture(file)
      })
      .catch(() => {
        setError('Erreur lors du traitement de la photo')
      })
  }, [onCapture, setError])

  // If preview exists, show it with just the retry button
  // The "Suivant" button in the wizard handles validation
  if (previewUrl) {
    return (
      <div className="space-y-4">
        {/* Preview image */}
        <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={previewUrl}
            alt="Prévisualisation selfie"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Retry button only - validation happens via wizard's Suivant button */}
        <Button
          type="button"
          variant="outline"
          onClick={onRetry}
          className="w-full"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reprendre la photo
        </Button>

        {/* Success indicator */}
        <p className="text-sm text-green-600 text-center flex items-center justify-center gap-2">
          <Check className="w-4 h-4" />
          Photo prête ! Cliquez sur Suivant pour continuer.
        </p>
      </div>
    )
  }

  // If no permission or error, show fallback
  if (hasPermission === false || cameraError) {
    return (
      <div className="space-y-4">
        {/* Error message */}
        <div className="flex items-center gap-3 p-4 bg-amber-50 text-amber-700 rounded-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium">{cameraError}</p>
            <p className="text-sm mt-1">
              Veuillez autoriser l&apos;accès à votre caméra ou uploader une photo.
            </p>
          </div>
        </div>

        {/* Fallback button */}
        <Button
          type="button"
          onClick={onSwitchToUpload}
          className="w-full"
          style={{ backgroundColor: 'var(--primary-color)' }}
        >
          <Upload className="w-4 h-4 mr-2" />
          Uploader une photo
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Webcam feed */}
      <div className="relative aspect-[4/3] bg-gray-900 rounded-lg overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
            <div className="text-white animate-pulse">Activation de la webcam...</div>
          </div>
        )}
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          screenshotQuality={0.92}
          videoConstraints={videoConstraints}
          onUserMedia={handleUserMedia}
          onUserMediaError={handleUserMediaError}
          className="w-full h-full object-cover"
          mirrored={true}
        />
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        <Button
          type="button"
          onClick={capture}
          disabled={!hasPermission || isLoading}
          className="w-full h-12 text-lg"
          style={{ backgroundColor: 'var(--primary-color)' }}
        >
          <Camera className="w-5 h-5 mr-2" />
          Capturer
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onSwitchToUpload}
          className="w-full"
        >
          <Upload className="w-4 h-4 mr-2" />
          Uploader depuis mon appareil
        </Button>
      </div>
    </div>
  )
}
