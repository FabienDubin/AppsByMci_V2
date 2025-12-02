'use client'

import { useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { Camera, Upload, Check, RefreshCw, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Maximum file size: 10 MB
const MAX_FILE_SIZE = 10 * 1024 * 1024
// Allowed MIME types
const ALLOWED_MIME_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
}

interface FileUploadProps {
  onFileSelect: (file: File) => void
  previewUrl: string | null
  onRetry: () => void
  error: string | null
  setError: (error: string | null) => void
}

/**
 * FileUpload - File upload component for selfie
 * Shows a dropzone on desktop, native camera input on mobile
 */
export function FileUpload({
  onFileSelect,
  previewUrl,
  onRetry,
  error,
  setError,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * Handle file validation and selection
   */
  const handleFile = useCallback(
    (file: File) => {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setError('La photo ne doit pas dépasser 10 MB')
        return
      }

      // Validate MIME type
      const allowedTypes = Object.keys(ALLOWED_MIME_TYPES)
      if (!allowedTypes.includes(file.type)) {
        setError('Format de fichier invalide. Utilisez JPG, PNG ou WEBP.')
        return
      }

      // Clear error and select file
      setError(null)
      onFileSelect(file)
    },
    [onFileSelect, setError]
  )

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    accept: ALLOWED_MIME_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    onDrop: (acceptedFiles, rejectedFiles) => {
      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0]
        if (rejection.errors.some((e) => e.code === 'file-too-large')) {
          setError('La photo ne doit pas dépasser 10 MB')
        } else if (rejection.errors.some((e) => e.code === 'file-invalid-type')) {
          setError('Format de fichier invalide. Utilisez JPG, PNG ou WEBP.')
        } else {
          setError('Erreur lors de la sélection du fichier')
        }
        return
      }

      // Handle accepted file
      if (acceptedFiles.length > 0) {
        handleFile(acceptedFiles[0])
      }
    },
    onDropRejected: (rejections) => {
      if (rejections.length > 0) {
        const errors = rejections[0].errors
        if (errors.some((e) => e.code === 'file-too-large')) {
          setError('La photo ne doit pas dépasser 10 MB')
        } else if (errors.some((e) => e.code === 'file-invalid-type')) {
          setError('Format de fichier invalide. Utilisez JPG, PNG ou WEBP.')
        }
      }
    },
  })

  /**
   * Handle native file input change (mobile)
   */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        handleFile(files[0])
      }
    },
    [handleFile]
  )

  /**
   * Trigger native file input (mobile)
   */
  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // If preview exists, show it with just retry button
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

        {/* Retry button only */}
        <Button
          type="button"
          variant="outline"
          onClick={onRetry}
          className="w-full"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Changer de photo
        </Button>

        {/* Success indicator */}
        <p className="text-sm text-green-600 text-center flex items-center justify-center gap-2">
          <Check className="w-4 h-4" />
          Photo prête ! Cliquez sur Suivant pour continuer.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Hidden native file input for mobile (with capture="user" for front camera) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="user"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Dropzone area */}
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 transition-colors cursor-pointer',
          'flex flex-col items-center justify-center min-h-[200px]',
          isDragActive && !isDragReject && 'border-primary bg-primary/5',
          isDragReject && 'border-red-500 bg-red-50',
          !isDragActive && !error && 'border-gray-300 hover:border-gray-400',
          error && 'border-red-300'
        )}
      >
        <input {...getInputProps()} />

        <div className="text-center space-y-4">
          {/* Icon */}
          <div
            className={cn(
              'mx-auto w-16 h-16 rounded-full flex items-center justify-center',
              isDragActive && !isDragReject && 'bg-primary/10',
              isDragReject && 'bg-red-100',
              !isDragActive && 'bg-gray-100'
            )}
          >
            {isDragReject ? (
              <ImageIcon className="w-8 h-8 text-red-500" />
            ) : (
              <Upload className="w-8 h-8 text-gray-500" />
            )}
          </div>

          {/* Text */}
          <div className="space-y-2">
            {isDragActive ? (
              isDragReject ? (
                <p className="text-red-600 font-medium">
                  Format de fichier non supporté
                </p>
              ) : (
                <p className="text-primary font-medium">
                  Déposez votre photo ici
                </p>
              )
            ) : (
              <>
                <p className="text-gray-700 font-medium">
                  Glissez votre photo ici
                </p>
                <p className="text-sm text-gray-500">
                  ou cliquez pour sélectionner
                </p>
              </>
            )}
            <p className="text-xs text-gray-400">
              JPG, PNG ou WEBP • Max 10 MB
            </p>
          </div>
        </div>
      </div>

      {/* Mobile: Large button to trigger native camera */}
      <Button
        type="button"
        onClick={triggerFileInput}
        className="w-full h-14 text-lg sm:hidden"
        style={{ backgroundColor: 'var(--primary-color)' }}
      >
        <Camera className="w-5 h-5 mr-2" />
        Prendre une photo
      </Button>
    </div>
  )
}
