'use client'

import { useCallback, useState } from 'react'
import { useDropzone, FileRejection } from 'react-dropzone'
import { Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/stores/auth.store'

interface ImageUploadDropzoneProps {
  animationId: string
  onUploadComplete: (url: string, filename: string) => void
  onError: (error: string) => void
  disabled?: boolean
  className?: string
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ACCEPTED_TYPES = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/webp': ['.webp'],
}

/**
 * ImageUploadDropzone - Drag & drop upload component for reference images (Story 4.8)
 * AC4: Upload d'image vers Azure
 */
export function ImageUploadDropzone({
  animationId,
  onUploadComplete,
  onError,
  disabled = false,
  className,
}: ImageUploadDropzoneProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const getAccessToken = useAuthStore((state) => state.getAccessToken)

  const uploadFile = async (file: File) => {
    setIsUploading(true)
    setUploadStatus('uploading')
    setStatusMessage('Upload en cours...')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('animationId', animationId)

      const accessToken = getAccessToken()
      const response = await fetch('/api/uploads/reference-image', {
        method: 'POST',
        headers: {
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
        body: formData,
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error?.message || 'Upload échoué')
      }

      setUploadStatus('success')
      setStatusMessage('Image uploadée')
      onUploadComplete(result.data.url, result.data.filename)

      // Reset status after 2 seconds
      setTimeout(() => {
        setUploadStatus('idle')
        setStatusMessage('')
      }, 2000)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de l\'upload'
      setUploadStatus('error')
      setStatusMessage(message)
      onError(message)

      // Reset status after 3 seconds
      setTimeout(() => {
        setUploadStatus('idle')
        setStatusMessage('')
      }, 3000)
    } finally {
      setIsUploading(false)
    }
  }

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const error = rejectedFiles[0].errors[0]
        if (error.code === 'file-too-large') {
          onError(`Le fichier dépasse la taille maximale de ${MAX_FILE_SIZE / (1024 * 1024)} MB`)
        } else if (error.code === 'file-invalid-type') {
          onError('Format non supporté. Formats acceptés: PNG, JPEG, WebP')
        } else {
          onError(error.message)
        }
        return
      }

      // Upload the first accepted file
      if (acceptedFiles.length > 0) {
        await uploadFile(acceptedFiles[0])
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [animationId]
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    maxFiles: 1,
    disabled: disabled || isUploading,
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        'relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-all',
        isDragActive && !isDragReject && 'border-primary bg-primary/5',
        isDragReject && 'border-destructive bg-destructive/5',
        !isDragActive && !isDragReject && 'border-muted-foreground/25 hover:border-muted-foreground/50',
        (disabled || isUploading) && 'opacity-50 cursor-not-allowed',
        uploadStatus === 'success' && 'border-green-500 bg-green-500/5',
        uploadStatus === 'error' && 'border-destructive bg-destructive/5',
        className
      )}
    >
      <input {...getInputProps()} />

      {/* Icon */}
      <div className="mb-2">
        {uploadStatus === 'uploading' ? (
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        ) : uploadStatus === 'success' ? (
          <CheckCircle className="h-8 w-8 text-green-500" />
        ) : uploadStatus === 'error' ? (
          <AlertCircle className="h-8 w-8 text-destructive" />
        ) : (
          <Upload className="h-8 w-8 text-muted-foreground" />
        )}
      </div>

      {/* Message */}
      <p className="text-sm text-center">
        {statusMessage || (
          isDragActive ? (
            isDragReject ? (
              <span className="text-destructive">Format non supporté</span>
            ) : (
              <span className="text-primary">Déposez l&apos;image ici</span>
            )
          ) : (
            <span className="text-muted-foreground">
              Glissez une image ou cliquez pour parcourir
            </span>
          )
        )}
      </p>

      {/* Accepted formats hint */}
      {uploadStatus === 'idle' && !isDragActive && (
        <p className="mt-1 text-xs text-muted-foreground">
          PNG, JPEG, WebP • Max {MAX_FILE_SIZE / (1024 * 1024)} MB
        </p>
      )}
    </div>
  )
}
