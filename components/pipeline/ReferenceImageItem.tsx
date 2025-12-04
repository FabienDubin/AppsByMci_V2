'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown, Trash2, Camera, Link, Upload, Layers, AlertCircle, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { ReferenceImage, ImageSourceType } from '@/lib/types'
import type { PipelineBlock } from '@/lib/stores/wizard.store'
import { ImageUploadDropzone } from './ImageUploadDropzone'

interface ReferenceImageItemProps {
  image: ReferenceImage
  index: number
  totalCount: number
  hasSelfie: boolean
  previousAIBlocks: PipelineBlock[]
  animationId: string
  onUpdate: (id: string, updates: Partial<ReferenceImage>) => void
  onDelete: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  existingNames: string[]
}

// Name validation: alphanumeric + underscore, max 50 chars
const NAME_REGEX = /^[a-zA-Z0-9_]*$/
const MAX_NAME_LENGTH = 50

/**
 * ReferenceImageItem - Individual reference image configuration (Story 4.8)
 * AC2: Ajout d'une image de référence
 * AC3: Sources d'images conditionnelles
 * AC5-7: Different source types
 * AC9: Noms uniques et validation
 */
export function ReferenceImageItem({
  image,
  index,
  totalCount,
  hasSelfie,
  previousAIBlocks,
  animationId,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  existingNames,
}: ReferenceImageItemProps) {
  const [nameError, setNameError] = useState<string | null>(null)
  const [urlError, setUrlError] = useState<string | null>(null)
  const [imageLoadError, setImageLoadError] = useState(false)

  // Validate name on change
  const handleNameChange = (value: string) => {
    setNameError(null)

    // Check max length
    if (value.length > MAX_NAME_LENGTH) {
      setNameError(`Maximum ${MAX_NAME_LENGTH} caractères`)
      return
    }

    // Check valid characters
    if (!NAME_REGEX.test(value)) {
      setNameError('Seuls les caractères alphanumériques et underscore sont autorisés')
      return
    }

    // Check uniqueness (excluding current image)
    const otherNames = existingNames.filter((n) => n !== image.name)
    if (otherNames.includes(value)) {
      setNameError('Ce nom est déjà utilisé')
      return
    }

    onUpdate(image.id, { name: value })
  }

  // Handle source change
  const handleSourceChange = (source: ImageSourceType) => {
    const updates: Partial<ReferenceImage> = { source }

    // Reset source-specific fields
    if (source !== 'url' && source !== 'upload') {
      updates.url = undefined
    }
    if (source !== 'ai-block-output') {
      updates.sourceBlockId = undefined
    }

    // Auto-suggest name for selfie (AC6)
    if (source === 'selfie' && (!image.name || image.name.startsWith('image'))) {
      updates.name = 'selfie'
    }

    onUpdate(image.id, updates)
  }

  // Handle URL change with validation (AC5)
  const handleUrlChange = (value: string) => {
    setUrlError(null)
    setImageLoadError(false)

    if (value && !value.startsWith('https://')) {
      setUrlError('URL doit commencer par https://')
    }

    onUpdate(image.id, { url: value })
  }

  // Handle upload complete
  const handleUploadComplete = (url: string) => {
    onUpdate(image.id, { url })
  }

  // Handle upload error
  const handleUploadError = (error: string) => {
    setUrlError(error)
  }

  // Handle block selection (AC7)
  const handleBlockChange = (blockId: string) => {
    onUpdate(image.id, { sourceBlockId: blockId })
  }

  // Get preview thumbnail
  const renderPreview = () => {
    const previewClass = 'w-12 h-12 rounded border flex items-center justify-center bg-muted'

    switch (image.source) {
      case 'selfie':
        return (
          <div className={cn(previewClass, 'text-muted-foreground')}>
            <Camera className="h-5 w-5" />
          </div>
        )

      case 'url':
      case 'upload':
        if (image.url && !imageLoadError) {
          return (
            <img
              src={image.url}
              alt={image.name}
              className="w-12 h-12 rounded border object-cover"
              onError={() => setImageLoadError(true)}
            />
          )
        }
        if (imageLoadError) {
          return (
            <div className={cn(previewClass, 'text-yellow-500')} title="Image non accessible">
              <AlertCircle className="h-5 w-5" />
            </div>
          )
        }
        return (
          <div className={cn(previewClass, 'text-muted-foreground')}>
            {image.source === 'url' ? <Link className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
          </div>
        )

      case 'ai-block-output':
        const blockNum = previousAIBlocks.find((b) => b.id === image.sourceBlockId)?.order
        return (
          <div className={cn(previewClass, 'text-muted-foreground flex-col text-xs')}>
            <Layers className="h-4 w-4" />
            {blockNum !== undefined && <span>#{blockNum + 1}</span>}
          </div>
        )

      default:
        return <div className={previewClass} />
    }
  }

  return (
    <div className="flex items-start gap-3 p-3 border rounded-lg bg-card">
      {/* Preview */}
      {renderPreview()}

      {/* Configuration */}
      <div className="flex-1 space-y-3">
        {/* Row 1: Name + Source selector */}
        <div className="flex gap-3">
          {/* Name input */}
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">Nom</Label>
            <Input
              value={image.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder={`image${index + 1}`}
              className={cn('h-8 text-sm', nameError && 'border-destructive')}
              maxLength={MAX_NAME_LENGTH}
            />
            {nameError && <p className="text-xs text-destructive mt-1">{nameError}</p>}
          </div>

          {/* Source selector */}
          <div className="w-48">
            <Label className="text-xs text-muted-foreground">Source</Label>
            <Select value={image.source} onValueChange={handleSourceChange}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {hasSelfie && (
                  <SelectItem value="selfie">
                    <span className="flex items-center gap-2">
                      <Camera className="h-3 w-3" />
                      Selfie participant
                    </span>
                  </SelectItem>
                )}
                <SelectItem value="upload">
                  <span className="flex items-center gap-2">
                    <Upload className="h-3 w-3" />
                    Upload
                  </span>
                </SelectItem>
                <SelectItem value="url">
                  <span className="flex items-center gap-2">
                    <Link className="h-3 w-3" />
                    URL
                  </span>
                </SelectItem>
                {previousAIBlocks.length > 0 && (
                  <SelectItem value="ai-block-output">
                    <span className="flex items-center gap-2">
                      <Layers className="h-3 w-3" />
                      Sortie bloc précédent
                    </span>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 2: Source-specific input */}
        {image.source === 'upload' && (
          image.url ? (
            // Compact view when image is uploaded
            <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30">
              <img
                src={image.url}
                alt={image.name}
                className="w-10 h-10 rounded object-cover"
                onError={() => setImageLoadError(true)}
              />
              <span className="flex-1 text-xs text-muted-foreground truncate">
                Image uploadée
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={() => onUpdate(image.id, { url: undefined })}
                title="Supprimer l'image"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            // Dropzone when no image uploaded
            <ImageUploadDropzone
              animationId={animationId}
              onUploadComplete={handleUploadComplete}
              onError={handleUploadError}
              className="min-h-[80px]"
            />
          )
        )}

        {image.source === 'url' && (
          <div>
            <Input
              value={image.url || ''}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className={cn('h-8 text-sm', urlError && 'border-destructive')}
            />
            {urlError && <p className="text-xs text-destructive mt-1">{urlError}</p>}
            {imageLoadError && !urlError && (
              <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Image non accessible
              </p>
            )}
          </div>
        )}

        {image.source === 'ai-block-output' && (
          <Select value={image.sourceBlockId || ''} onValueChange={handleBlockChange}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Sélectionner un bloc" />
            </SelectTrigger>
            <SelectContent>
              {previousAIBlocks.map((block) => (
                <SelectItem key={block.id} value={block.id}>
                  Bloc #{block.order + 1} - {block.blockName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {image.source === 'selfie' && (
          <p className="text-xs text-muted-foreground italic">
            L&apos;image du selfie sera utilisée au moment de l&apos;exécution
          </p>
        )}
      </div>

      {/* Actions: Move up/down + Delete */}
      <div className="flex flex-col gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onMoveUp(image.id)}
          disabled={index === 0}
          title="Monter"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onMoveDown(image.id)}
          disabled={index === totalCount - 1}
          title="Descendre"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={() => onDelete(image.id)}
          title="Supprimer"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
