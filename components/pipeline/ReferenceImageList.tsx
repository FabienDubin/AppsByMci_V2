'use client'

import { Plus, AlertTriangle, Images } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { ReferenceImage } from '@/lib/types'
import type { PipelineBlock } from '@/lib/stores/wizard.store'
import { ReferenceImageItem } from './ReferenceImageItem'

const MAX_REFERENCE_IMAGES = 5

interface ReferenceImageListProps {
  images: ReferenceImage[]
  hasSelfie: boolean
  previousAIBlocks: PipelineBlock[]
  animationId: string
  modelId?: string // For Gemini warning
  onChange: (images: ReferenceImage[]) => void
}

/**
 * ReferenceImageList - List of reference images with add/remove/reorder (Story 4.8)
 * AC1: Liste des images de référence dans la modal de configuration
 * AC8: Réordonnancement des images
 */
export function ReferenceImageList({
  images,
  hasSelfie,
  previousAIBlocks,
  animationId,
  modelId,
  onChange,
}: ReferenceImageListProps) {
  // Generate next default name (image1, image2, etc.)
  const generateDefaultName = (): string => {
    const existingNames = new Set(images.map((img) => img.name))
    let index = 1
    while (existingNames.has(`image${index}`)) {
      index++
    }
    return `image${index}`
  }

  // Add a new reference image
  const handleAdd = () => {
    if (images.length >= MAX_REFERENCE_IMAGES) return

    // Check if selfie is already used in another image
    const selfieAlreadyUsed = images.some((img) => img.source === 'selfie')

    // Default to selfie if available AND not already used, otherwise upload
    const defaultSource = hasSelfie && !selfieAlreadyUsed ? 'selfie' : 'upload'

    const newImage: ReferenceImage = {
      id: crypto.randomUUID(),
      name: defaultSource === 'selfie' ? 'selfie' : generateDefaultName(),
      source: defaultSource,
      order: images.length + 1,
    }

    onChange([...images, newImage])
  }

  // Update a specific image
  const handleUpdate = (id: string, updates: Partial<ReferenceImage>) => {
    onChange(images.map((img) => (img.id === id ? { ...img, ...updates } : img)))
  }

  // Delete an image
  const handleDelete = (id: string) => {
    const newImages = images.filter((img) => img.id !== id)
    // Recalculate order
    const reordered = newImages.map((img, idx) => ({ ...img, order: idx + 1 }))
    onChange(reordered)
  }

  // Move image up (AC8)
  const handleMoveUp = (id: string) => {
    const idx = images.findIndex((img) => img.id === id)
    if (idx <= 0) return

    const newImages = [...images]
    ;[newImages[idx - 1], newImages[idx]] = [newImages[idx], newImages[idx - 1]]

    // Update order
    const reordered = newImages.map((img, i) => ({ ...img, order: i + 1 }))
    onChange(reordered)
  }

  // Move image down (AC8)
  const handleMoveDown = (id: string) => {
    const idx = images.findIndex((img) => img.id === id)
    if (idx < 0 || idx >= images.length - 1) return

    const newImages = [...images]
    ;[newImages[idx], newImages[idx + 1]] = [newImages[idx + 1], newImages[idx]]

    // Update order
    const reordered = newImages.map((img, i) => ({ ...img, order: i + 1 }))
    onChange(reordered)
  }

  // Get existing names for uniqueness validation
  const existingNames = images.map((img) => img.name)

  // Check if model is Gemini (for warning about last image ratio)
  const isGemini = modelId?.includes('gemini')

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Images className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Images de référence</span>
          <span className="text-xs text-muted-foreground">({images.length}/{MAX_REFERENCE_IMAGES})</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={images.length >= MAX_REFERENCE_IMAGES}
          title={images.length >= MAX_REFERENCE_IMAGES ? `Maximum ${MAX_REFERENCE_IMAGES} images` : undefined}
        >
          <Plus className="h-4 w-4 mr-1" />
          Ajouter une image
        </Button>
      </div>

      {/* Empty state */}
      {images.length === 0 && (
        <div className="text-center py-6 text-muted-foreground border rounded-lg border-dashed">
          <Images className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aucune image de référence</p>
          <p className="text-xs mt-1">Ajoutez des images pour les utiliser dans le prompt</p>
        </div>
      )}

      {/* Image list */}
      {images.length > 0 && (
        <div className="space-y-2">
          {images.map((image, index) => (
            <ReferenceImageItem
              key={image.id}
              image={image}
              index={index}
              totalCount={images.length}
              hasSelfie={hasSelfie}
              previousAIBlocks={previousAIBlocks}
              animationId={animationId}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              existingNames={existingNames}
            />
          ))}
        </div>
      )}

      {/* Gemini warning about last image (AC8 note) */}
      {isGemini && images.length > 0 && (
        <Alert variant="default" className="bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 text-xs">
            Pour Gemini, la dernière image peut influencer le ratio de sortie
          </AlertDescription>
        </Alert>
      )}

      {/* Max images reached */}
      {images.length >= MAX_REFERENCE_IMAGES && (
        <p className="text-xs text-muted-foreground text-center">
          Maximum {MAX_REFERENCE_IMAGES} images atteint
        </p>
      )}
    </div>
  )
}
