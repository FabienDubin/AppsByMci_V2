'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useWizardStore, PipelineBlock, BlockName, PipelineBlockType, getAvailableVariables } from '@/lib/stores/wizard.store'
import { BlockLibrary } from './block-library'
import { PipelineBlockCard } from './pipeline-block-card'
import { ConfigModalCrop } from './config-modal-crop'
import { ConfigModalAIGeneration } from './config-modal-ai-generation'
import { DeleteBlockDialog } from './delete-block-dialog'

/**
 * Main Pipeline Canvas component (Step 4)
 * AC-3.6.1, AC-3.6.2, AC-3.6.6, AC-3.6.7, AC-3.6.8
 */
export function PipelineCanvas() {
  const { animationData, updateData } = useWizardStore()
  const pipeline = animationData.pipeline || []

  // Modal states
  const [configModalType, setConfigModalType] = useState<'crop' | 'ai-generation' | null>(null)
  const [configModalBlockId, setConfigModalBlockId] = useState<string | null>(null)
  const [deleteDialogBlockId, setDeleteDialogBlockId] = useState<string | null>(null)

  /**
   * Add a new block to pipeline
   * AC-3.6.2, AC-3.6.8: Check max 4 AI blocks
   */
  const handleAddBlock = (blockName: BlockName, type: PipelineBlockType) => {
    // Check max 4 AI blocks
    if (type === 'ai-generation') {
      const aiBlocksCount = pipeline.filter((b) => b.type === 'ai-generation').length
      if (aiBlocksCount >= 4) {
        toast.error('⚠️ Maximum 4 blocs IA autorisés dans un pipeline.')
        return
      }
    }

    const newBlock: PipelineBlock = {
      id: crypto.randomUUID(),
      type,
      blockName,
      order: pipeline.length,
      config: {},
    }

    updateData({ pipeline: [...pipeline, newBlock] })
  }

  /**
   * Move block up in pipeline
   */
  const handleMoveUp = (blockId: string) => {
    const index = pipeline.findIndex((b) => b.id === blockId)
    if (index <= 0) return // Already at top

    const reordered = [...pipeline]
    const temp = reordered[index]
    reordered[index] = reordered[index - 1]
    reordered[index - 1] = temp

    // Recalculate order
    const updated = reordered.map((block, idx) => ({ ...block, order: idx }))
    updateData({ pipeline: updated })
  }

  /**
   * Move block down in pipeline
   */
  const handleMoveDown = (blockId: string) => {
    const index = pipeline.findIndex((b) => b.id === blockId)
    if (index === -1 || index >= pipeline.length - 1) return // Already at bottom

    const reordered = [...pipeline]
    const temp = reordered[index]
    reordered[index] = reordered[index + 1]
    reordered[index + 1] = temp

    // Recalculate order
    const updated = reordered.map((block, idx) => ({ ...block, order: idx }))
    updateData({ pipeline: updated })
  }

  /**
   * Open configuration modal
   */
  const handleConfigure = (blockId: string) => {
    const block = pipeline.find((b) => b.id === blockId)
    if (!block) return

    setConfigModalBlockId(blockId)

    if (block.blockName === 'crop-resize') {
      setConfigModalType('crop')
    } else if (block.blockName === 'ai-generation') {
      setConfigModalType('ai-generation')
    } else {
      // Filters - no config modal for MVP
      toast.info('Configuration des filtres disponible prochainement')
    }
  }

  /**
   * Save block configuration
   */
  const handleSaveConfig = (config: any) => {
    if (!configModalBlockId) return

    const updated = pipeline.map((block) =>
      block.id === configModalBlockId ? { ...block, config } : block
    )

    updateData({ pipeline: updated })
    setConfigModalType(null)
    setConfigModalBlockId(null)
  }

  /**
   * Open delete dialog
   * AC-3.6.7: Confirmation dialog
   */
  const handleDeleteClick = (blockId: string) => {
    setDeleteDialogBlockId(blockId)
  }

  /**
   * Confirm delete block
   * AC-3.6.7: Recalculate order after deletion
   */
  const handleDeleteConfirm = () => {
    if (!deleteDialogBlockId) return

    const updated = pipeline
      .filter((b) => b.id !== deleteDialogBlockId)
      .map((block, index) => ({ ...block, order: index }))

    updateData({ pipeline: updated })
    setDeleteDialogBlockId(null)
  }

  // Get available variables for AI prompt
  const availableVariables = getAvailableVariables(animationData)

  // Get block for config modal
  const configBlock = configModalBlockId
    ? pipeline.find((b) => b.id === configModalBlockId)
    : null

  // Get block for delete dialog
  const deleteBlock = deleteDialogBlockId
    ? pipeline.find((b) => b.id === deleteDialogBlockId)
    : null

  return (
    <>
      <div className="grid grid-cols-[30%_70%] gap-6">
        {/* Left: Block Library */}
        <BlockLibrary onAddBlock={handleAddBlock} />

        {/* Right: Canvas */}
        <div className="border rounded-lg p-6 bg-muted/20">
          <h3 className="text-lg font-semibold mb-2">Pipeline de Traitement</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Ajoutez des blocs pour construire votre pipeline. L&apos;ordre des blocs définit le flow de
            traitement.
          </p>

          {pipeline.length === 0 ? (
            <div className="border-2 border-dashed rounded-lg p-12 text-center text-muted-foreground">
              <p className="text-lg mb-2">Utilisez les boutons &quot;+ Ajouter&quot; pour construire votre pipeline</p>
              <p className="text-sm">
                Astuce : Le premier bloc reçoit les données participant. L&apos;ordre des blocs définit le flow
                de traitement.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pipeline.map((block, index) => (
                <div key={block.id}>
                  <PipelineBlockCard
                    block={block}
                    index={index}
                    onConfigure={() => handleConfigure(block.id)}
                    onDelete={() => handleDeleteClick(block.id)}
                    onMoveUp={() => handleMoveUp(block.id)}
                    onMoveDown={() => handleMoveDown(block.id)}
                    canMoveUp={index > 0}
                    canMoveDown={index < pipeline.length - 1}
                  />
                  {/* Connection line */}
                  {index < pipeline.length - 1 && (
                    <div className="flex justify-center my-2">
                      <div className="w-0.5 h-4 bg-border"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {configModalType === 'crop' && configBlock && (
        <ConfigModalCrop
          isOpen={true}
          initialConfig={configBlock.config}
          onClose={() => {
            setConfigModalType(null)
            setConfigModalBlockId(null)
          }}
          onSave={handleSaveConfig}
        />
      )}

      {configModalType === 'ai-generation' && configBlock && (
        <ConfigModalAIGeneration
          isOpen={true}
          initialConfig={configBlock.config}
          currentBlockId={configModalBlockId || undefined}
          availableVariables={availableVariables}
          onClose={() => {
            setConfigModalType(null)
            setConfigModalBlockId(null)
          }}
          onSave={handleSaveConfig}
        />
      )}

      {deleteBlock && (
        <DeleteBlockDialog
          isOpen={true}
          blockName={deleteBlock.blockName}
          onClose={() => setDeleteDialogBlockId(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </>
  )
}
