'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'

/**
 * Image upload props
 */
interface ImageUploadProps {
  /** Current image URL */
  value?: string
  /** Callback when image changes */
  onChange: (url: string | undefined) => void
  /** Upload endpoint URL */
  uploadEndpoint: string
  /** Allowed MIME types */
  acceptedTypes?: string[]
  /** Maximum file size in bytes */
  maxSize?: number
  /** Label displayed above */
  label?: string
  /** Help text displayed below */
  helpText?: string
  /** Error message */
  error?: string
  /** Disabled state */
  disabled?: boolean
  /** Preview dimensions */
  previewWidth?: number
  previewHeight?: number
  /** Additional class names */
  className?: string
  /** Auth token for upload */
  getAuthToken: () => Promise<string | null>
}

/**
 * ImageUpload component
 * Drag-and-drop or click to upload images with preview
 */
export function ImageUpload({
  value,
  onChange,
  uploadEndpoint,
  acceptedTypes = ['image/png', 'image/jpeg', 'image/jpg'],
  maxSize = 2 * 1024 * 1024, // 2MB default
  label,
  helpText,
  error,
  disabled = false,
  previewWidth = 200,
  previewHeight = 200,
  className,
  getAuthToken,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Handle file upload
  const uploadFile = useCallback(async (file: File) => {
    setIsUploading(true)
    setUploadError(null)

    try {
      const token = await getAuthToken()
      if (!token) {
        throw new Error('Non authentifié')
      }

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Erreur lors de l\'upload')
      }

      onChange(result.data.url)
    } catch (err: any) {
      console.error('Upload error:', err)
      setUploadError(err.message || 'Erreur lors de l\'upload')
    } finally {
      setIsUploading(false)
    }
  }, [uploadEndpoint, getAuthToken, onChange])

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      await uploadFile(file)
    }
  }, [uploadFile])

  // Setup dropzone
  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = []
      return acc
    }, {} as Record<string, string[]>),
    maxSize,
    maxFiles: 1,
    disabled: disabled || isUploading,
  })

  // Handle remove
  const handleRemove = useCallback(async () => {
    if (!value) return

    // Clear the value immediately for instant UI feedback
    onChange('')

    try {
      const token = await getAuthToken()
      if (token) {
        // Delete from server
        await fetch(`${uploadEndpoint}?url=${encodeURIComponent(value)}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
      }
    } catch {
      // Ignore delete errors - image is already removed from UI
    }
  }, [value, uploadEndpoint, getAuthToken, onChange])

  // Get file rejection errors
  const rejectionError = fileRejections[0]?.errors?.[0]?.message

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <p className="text-sm font-medium">{label}</p>
      )}

      {/* Image preview or upload zone */}
      {value && value.length > 0 ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Uploaded image"
            className="rounded-lg border object-contain"
            style={{ maxWidth: previewWidth, maxHeight: previewHeight }}
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6"
            onClick={handleRemove}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer',
            isDragActive && 'border-primary bg-primary/5',
            !isDragActive && 'border-muted-foreground/25 hover:border-primary/50',
            (disabled || isUploading) && 'cursor-not-allowed opacity-50',
            (error || uploadError || rejectionError) && 'border-destructive'
          )}
        >
          <input {...getInputProps()} />

          {isUploading ? (
            <>
              <Loader2 className="h-10 w-10 text-muted-foreground animate-spin mb-2" />
              <p className="text-sm text-muted-foreground">Upload en cours...</p>
            </>
          ) : isDragActive ? (
            <>
              <Upload className="h-10 w-10 text-primary mb-2" />
              <p className="text-sm text-primary">Dépose le fichier ici...</p>
            </>
          ) : (
            <>
              <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-1">
                Glisse une image ou clique pour sélectionner
              </p>
              <p className="text-xs text-muted-foreground">
                {acceptedTypes.map(t => t.split('/')[1]).join(', ').toUpperCase()} · Max {Math.round(maxSize / (1024 * 1024))}MB
              </p>
            </>
          )}
        </div>
      )}

      {/* Help text */}
      {helpText && !error && !uploadError && !rejectionError && (
        <p className="text-sm text-muted-foreground">{helpText}</p>
      )}

      {/* Error messages */}
      {(error || uploadError || rejectionError) && (
        <p className="text-sm text-destructive">
          {error || uploadError || rejectionError}
        </p>
      )}
    </div>
  )
}

export default ImageUpload
