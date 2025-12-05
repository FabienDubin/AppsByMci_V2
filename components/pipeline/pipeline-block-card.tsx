'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronUp, ChevronDown, Settings, Trash2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PipelineBlock } from '@/lib/stores/wizard.store'
import { AI_MODELS } from '@/lib/ai-models'

interface PipelineBlockCardProps {
  block: PipelineBlock
  index: number // Display order (1, 2, 3...)
  availableVariables: string[] // Variables from steps 2 & 3
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
    case 'quiz-scoring':
      return { icon: '🎯', title: 'Quiz Scoring', categoryColor: 'bg-amber-500' }
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
    const model = AI_MODELS.find((m) => m.id === block.config.modelId)
    const modelName = model?.name || block.config.modelId
    const promptPreview = block.config.promptTemplate
      ? block.config.promptTemplate.slice(0, 50) +
        (block.config.promptTemplate.length > 50 ? '...' : '')
      : ''
    return `${modelName}${promptPreview ? ' - ' + promptPreview : ''}`
  }

  if (block.blockName === 'quiz-scoring' && block.config.quizScoring?.name) {
    const config = block.config.quizScoring
    const profileCount = config.profiles?.length || 0
    const questionCount = config.selectedQuestionIds?.length || 0
    return `"${config.name}" - ${profileCount} profils, ${questionCount} question${questionCount > 1 ? 's' : ''}`
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
    return !!(
      block.config.format &&
      (block.config.format === 'original' || block.config.dimensions)
    )
  }

  if (block.blockName === 'ai-generation') {
    return !!(block.config.modelId && block.config.promptTemplate)
  }

  if (block.blockName === 'quiz-scoring') {
    const config = block.config.quizScoring
    return !!(
      config?.name &&
      config?.selectedQuestionIds?.length > 0 &&
      config?.profiles?.length >= 2
    )
  }

  // Filters don't need configuration for MVP
  return true
}

/**
 * Get unused reference images (defined but not in prompt)
 */
function getUnusedReferenceImages(block: PipelineBlock): string[] {
  if (block.blockName !== 'ai-generation') return []

  const referenceImages = block.config.referenceImages || []
  if (referenceImages.length === 0) return []

  const promptTemplate = block.config.promptTemplate || ''
  const matches = promptTemplate.match(/\{([^}]+)\}/g)
  const usedVariables: string[] = matches ? [...matches] : []

  return referenceImages
    .filter((img) => !usedVariables.includes(`{${img.name}}`))
    .map((img) => img.name)
}

/**
 * Get unused question variables (exclude nom, prenom, email - only questions)
 */
function getUnusedQuestionVariables(block: PipelineBlock, availableVariables: string[]): string[] {
  if (block.blockName !== 'ai-generation') return []

  const promptTemplate = block.config.promptTemplate || ''
  const matches = promptTemplate.match(/\{([^}]+)\}/g)
  const usedVariables: string[] = matches ? [...matches] : []

  // Base fields to exclude (not relevant for prompt)
  const baseFieldVars = ['{nom}', '{prenom}', '{email}']
  // Filter to only question variables (question1, question2, etc.)
  const questionVars = availableVariables.filter((v) => !baseFieldVars.includes(v))

  return questionVars.filter((v) => !usedVariables.includes(v))
}

/**
 * Pipeline block card in canvas - simplified without drag-and-drop
 * AC-3.6.2, AC-3.6.3: Displays order, icon, title, badges, config preview, buttons
 */
export function PipelineBlockCard({
  block,
  index,
  availableVariables,
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
  const unusedImages = getUnusedReferenceImages(block)
  const unusedQuestions = getUnusedQuestionVariables(block, availableVariables)
  const hasWarnings = unusedImages.length > 0 || unusedQuestions.length > 0

  return (
    <div
      className={cn(
        'border rounded-lg p-4 bg-white transition-all',
        hasWarnings && 'border-yellow-400 bg-yellow-50/50'
      )}
    >
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

          {/* // To Be uncommented when the post-processing block is implemented.  */}
          {/* <Badge variant="secondary" className={cn('text-xs mb-2', metadata.categoryColor)}>
            {block.type}
          </Badge> */}

          {/* Config preview */}
          {configPreview && (
            <p className="text-xs text-muted-foreground mt-2 truncate">{configPreview}</p>
          )}

          {/* Warnings for unused variables */}
          {hasWarnings && (
            <div className="mt-2 space-y-1">
              {/* Unused question variables */}
              {unusedQuestions.length > 0 && (
                <div className="flex items-center gap-1.5 text-yellow-700 bg-yellow-100 rounded px-2 py-1">
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                  <p className="text-xs">
                    {unusedQuestions.length === 1
                      ? `Variable ${unusedQuestions[0]} non utilisée`
                      : `${unusedQuestions.length} variables non utilisées : ${unusedQuestions.join(
                          ', '
                        )}`}
                  </p>
                </div>
              )}
              {/* Unused reference images */}
              {unusedImages.length > 0 && (
                <div className="flex items-center gap-1.5 text-yellow-700 bg-yellow-100 rounded px-2 py-1">
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                  <p className="text-xs">
                    {unusedImages.length === 1
                      ? `Image "${unusedImages[0]}" non utilisée`
                      : `${unusedImages.length} images non utilisées : ${unusedImages.join(', ')}`}
                  </p>
                </div>
              )}
            </div>
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
