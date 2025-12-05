'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { BlockName, PipelineBlockType } from '@/lib/stores/wizard.store'

interface BlockDefinition {
  blockName: BlockName
  type: PipelineBlockType
  icon: string
  title: string
  category: string
  categoryColor: string
}

// Hardcoded blocks for MVP
const BLOCK_DEFINITIONS: BlockDefinition[] = [
  {
    blockName: 'crop-resize',
    type: 'preprocessing',
    icon: '✂️',
    title: 'Crop & Resize',
    category: 'Pre-processing',
    categoryColor: 'bg-gray-500',
  },
  {
    blockName: 'quiz-scoring',
    type: 'processing',
    icon: '🎯',
    title: 'Quiz Scoring',
    category: 'Processing',
    categoryColor: 'bg-amber-500',
  },
  {
    blockName: 'ai-generation',
    type: 'ai-generation',
    icon: '✨',
    title: 'IA Generation',
    category: 'IA Generation',
    categoryColor: 'bg-purple-500', // Accent color for AI
  },
  {
    blockName: 'filters',
    type: 'postprocessing',
    icon: '🎨',
    title: 'Filtres',
    category: 'Post-processing',
    categoryColor: 'bg-gray-500',
  },
]

interface LibraryBlockCardProps {
  block: BlockDefinition
  onAdd: () => void
  disabled?: boolean
}

/**
 * Block card in library - simplified without drag-and-drop
 * AC-3.6.1, AC-3.6.2: Displays icon, title, badge, + Ajouter button
 */
function LibraryBlockCard({ block, onAdd, disabled = false }: LibraryBlockCardProps) {
  return (
    <div
      className={cn(
        'border rounded-lg p-4 bg-white transition-all',
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md hover:border-primary'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 flex-1">
          <span className="text-2xl">{block.icon}</span>
          <div className="flex-1">
            <h4 className={cn('font-medium text-sm', disabled && 'text-muted-foreground')}>
              {block.title}
            </h4>
            {/* // To be uncommented when the post processing block is implemented */}
            {/* <Badge variant="secondary" className={cn('mt-1 text-xs', block.categoryColor)}>
              {block.category}
            </Badge> */}
            {disabled && <p className="text-xs text-muted-foreground mt-1">Bientôt disponible</p>}
          </div>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full mt-3"
        onClick={onAdd}
        disabled={disabled}
      >
        + Ajouter
      </Button>
    </div>
  )
}

interface BlockLibraryProps {
  onAddBlock: (blockName: BlockName, type: PipelineBlockType) => void
}

/**
 * Block Library component (left side 30%)
 * AC-3.6.1: 3 sections with hardcoded blocks
 */
export function BlockLibrary({ onAddBlock }: BlockLibraryProps) {
  const preprocessingBlocks = BLOCK_DEFINITIONS.filter((b) => b.type === 'preprocessing')
  const processingBlocks = BLOCK_DEFINITIONS.filter((b) => b.type === 'processing')
  const aiGenerationBlocks = BLOCK_DEFINITIONS.filter((b) => b.type === 'ai-generation')
  const postprocessingBlocks = BLOCK_DEFINITIONS.filter((b) => b.type === 'postprocessing')

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Bibliothèque de blocs</h3>
        <p className="text-sm text-muted-foreground">
          Cliquez sur &quot;+ Ajouter&quot; pour ajouter un bloc
        </p>
      </div>

      {/* Pre-processing section */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-2">Pre-processing</h4>
        <div className="space-y-2">
          {preprocessingBlocks.map((block) => (
            <LibraryBlockCard
              key={block.blockName}
              block={block}
              onAdd={() => onAddBlock(block.blockName, block.type)}
            />
          ))}
        </div>
      </div>

      {/* Processing section (Quiz Scoring, etc.) */}
      {processingBlocks.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-amber-600 mb-2">Processing</h4>
          <div className="space-y-2">
            {processingBlocks.map((block) => (
              <LibraryBlockCard
                key={block.blockName}
                block={block}
                onAdd={() => onAddBlock(block.blockName, block.type)}
              />
            ))}
          </div>
        </div>
      )}

      {/* IA Generation section */}
      <div>
        <h4 className="text-sm font-medium text-purple-600 mb-2">IA Generation</h4>
        <div className="space-y-2">
          {aiGenerationBlocks.map((block) => (
            <LibraryBlockCard
              key={block.blockName}
              block={block}
              onAdd={() => onAddBlock(block.blockName, block.type)}
            />
          ))}
        </div>
      </div>

      {/* Post-processing section */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-2">Post-processing</h4>
        <div className="space-y-2">
          {postprocessingBlocks.map((block) => (
            <LibraryBlockCard
              key={block.blockName}
              block={block}
              onAdd={() => onAddBlock(block.blockName, block.type)}
              disabled={block.blockName === 'filters'} // Filters not available yet
            />
          ))}
        </div>
      </div>
    </div>
  )
}
