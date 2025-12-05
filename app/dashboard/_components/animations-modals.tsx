// Animations modals wrapper component
// Groups all confirmation modals for animation actions

'use client'

import { AnimationResponse } from '@/lib/services/animation.service'
import { DuplicateAnimationModal } from '@/components/modals/duplicate-animation-modal'
import { ArchiveAnimationModal } from '@/components/modals/archive-animation-modal'
import { RestoreAnimationModal } from '@/components/modals/restore-animation-modal'
import { DeleteAnimationModal } from '@/components/modals/delete-animation-modal'

export interface ModalState {
  duplicate: { isOpen: boolean; animation: AnimationResponse | null }
  archive: { isOpen: boolean; animation: AnimationResponse | null }
  restore: { isOpen: boolean; animation: AnimationResponse | null }
  delete: { isOpen: boolean; animation: AnimationResponse | null }
}

export type ModalType = keyof ModalState

interface AnimationsModalsProps {
  modals: ModalState
  onClose: (type: ModalType) => void
  onConfirm: (type: ModalType) => void
  actionLoading: boolean
}

export function AnimationsModals({
  modals,
  onClose,
  onConfirm,
  actionLoading,
}: AnimationsModalsProps) {
  return (
    <>
      <DuplicateAnimationModal
        isOpen={modals.duplicate.isOpen}
        onClose={() => onClose('duplicate')}
        onConfirm={() => onConfirm('duplicate')}
        animationName={modals.duplicate.animation?.name || ''}
        isLoading={actionLoading}
      />

      <ArchiveAnimationModal
        isOpen={modals.archive.isOpen}
        onClose={() => onClose('archive')}
        onConfirm={() => onConfirm('archive')}
        animationName={modals.archive.animation?.name || ''}
        isLoading={actionLoading}
      />

      <RestoreAnimationModal
        isOpen={modals.restore.isOpen}
        onClose={() => onClose('restore')}
        onConfirm={() => onConfirm('restore')}
        animationName={modals.restore.animation?.name || ''}
        isLoading={actionLoading}
      />

      <DeleteAnimationModal
        isOpen={modals.delete.isOpen}
        onClose={() => onClose('delete')}
        onConfirm={() => onConfirm('delete')}
        animationName={modals.delete.animation?.name || ''}
        isLoading={actionLoading}
      />
    </>
  )
}

// Helper to create initial modal state
export function createInitialModalState(): ModalState {
  return {
    duplicate: { isOpen: false, animation: null },
    archive: { isOpen: false, animation: null },
    restore: { isOpen: false, animation: null },
    delete: { isOpen: false, animation: null },
  }
}
