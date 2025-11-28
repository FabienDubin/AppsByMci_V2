'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronUp, ChevronDown, Settings, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PipelineBlock } from '@/lib/stores/wizard.store'

interface PipelineBlockCardProps {
  block: PipelineBlock
  index: number // Display order (1, 2, 3...)
  onConfigure: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  canMoveUp: boolean
  canMoveDown: boolean
}

/**
 * Get block metadata (icon, title, category color)
 */
function getBlockMetadata(blockName: string) {
  switch (blockName) {
    case 'crop-resize':
      return { icon: '✂️', title: 'Crop & Resize', categoryColor: 'bg-gray-500' }
    case 'ai-generation':
      return { icon: '✨', title: 'IA Generation', categoryColor: 'bg-purple-500' }
    case 'filters':
      return { icon: '🎨', title: 'Filtres', categoryColor: 'bg-gray-500' }
    default:
      return { icon: '📦', title: blockName, categoryColor: 'bg-gray-500' }
  }
}

/**
 * Get image usage mode indicator
 */
function getImageModeIndicator(block: PipelineBlock): { icon: string; label: string } | null {
  if (block.blockName !== 'ai-generation') return null

  const mode = block.config.imageUsageMode
  if (!mode || mode === 'none') return null

  if (mode === 'reference') {
    return { icon: '📷', label: 'Référence' }
  }
  if (mode === 'edit') {
    return { icon: '✏️', label: 'Édition' }
  }
  return null
}

/**
 * Get config preview text
 */
function getConfigPreview(block: PipelineBlock): string | null {
  if (block.blockName === 'crop-resize' && block.config.format && block.config.dimensions) {
    return `${block.config.dimensions}x${block.config.dimensions} (${block.config.format})`
  }

  if (block.blockName === 'ai-generation' && block.config.modelId) {
    const promptPreview = block.config.promptTemplate
      ? block.config.promptTemplate.slice(0, 50) + (block.config.promptTemplate.length > 50 ? '...' : '')
      : ''
    return `${block.config.modelId}${promptPreview ? ' - ' + promptPreview : ''}`
  }

  if (block.blockName === 'filters') {
    return 'Filtres appliqués'
  }

  return null
}

/**
 * Check if block is configured
 */
function isBlockConfigured(block: PipelineBlock): boolean {
  if (block.blockName === 'crop-resize') {
    return !!(block.config.format && (block.config.format === 'original' || block.config.dimensions))
  }

  if (block.blockName === 'ai-generation') {
    return !!(block.config.modelId && block.config.promptTemplate)
  }

  // Filters don't need configuration for MVP
  return true
}

/**
 * Pipeline block card in canvas - simplified without drag-and-drop
 * AC-3.6.2, AC-3.6.3: Displays order, icon, title, badges, config preview, buttons
 */
export function PipelineBlockCard({
  block,
  index,
  onConfigure,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: PipelineBlockCardProps) {
  const metadata = getBlockMetadata(block.blockName)
  const configPreview = getConfigPreview(block)
  const isConfigured = isBlockConfigured(block)
  const imageModeIndicator = getImageModeIndicator(block)

  return (
    <div className={cn('border rounded-lg p-4 bg-white transition-all')}>
      <div className="flex items-start gap-3">
        {/* Order number */}
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
          {index + 1}
        </div>

        {/* Block content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xl">{metadata.icon}</span>
            <h4 className="font-medium text-sm">{metadata.title}</h4>
            {isConfigured && (
              <Badge variant="default" className="bg-green-500 text-xs">
                ✓ Configuré
              </Badge>
            )}
            {/* Image mode indicator for AI blocks */}
            {imageModeIndicator && (
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs',
                  imageModeIndicator.label === 'Référence'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-blue-100 text-blue-800'
                )}
              >
                {imageModeIndicator.icon} {imageModeIndicator.label}
              </Badge>
            )}
          </div>

          <Badge variant="secondary" className={cn('text-xs mb-2', metadata.categoryColor)}>
            {block.type}
          </Badge>

          {/* Config preview */}
          {configPreview && (
            <p className="text-xs text-muted-foreground mt-2 truncate">{configPreview}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {/* Move up/down buttons */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="h-8 w-8"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="h-8 w-8"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onConfigure}
            className="h-8 w-8"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
