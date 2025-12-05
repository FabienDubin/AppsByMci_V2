'use client'

// Action Buttons Component (Story 5.2 AC5)
// Quick actions: View results, Edit, Archive/Restore
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, Pencil, Archive, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimationResponse } from '@/lib/services/animation.service'
import { ArchiveAnimationModal } from '@/components/modals/archive-animation-modal'
import { RestoreAnimationModal } from '@/components/modals/restore-animation-modal'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/lib/stores/auth.store'
import { toast } from 'sonner'

interface ActionButtonsProps {
  animation: AnimationResponse | null
  loading?: boolean
  onStatusChange?: () => void
}

export function ActionButtons({ animation, loading, onStatusChange }: ActionButtonsProps) {
  const router = useRouter()
  const { getAccessToken } = useAuthStore()
  const [archiveModalOpen, setArchiveModalOpen] = useState(false)
  const [restoreModalOpen, setRestoreModalOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const handleArchive = useCallback(async () => {
    if (!animation) return

    setActionLoading(true)
    try {
      const token = getAccessToken()
      const response = await fetch(`/api/animations/${animation.id}/archive`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || "Erreur lors de l'archivage")
      }

      toast.success('Animation archivée')
      setArchiveModalOpen(false)
      onStatusChange?.()
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'archivage")
    } finally {
      setActionLoading(false)
    }
  }, [animation, getAccessToken, onStatusChange])

  const handleRestore = useCallback(async () => {
    if (!animation) return

    setActionLoading(true)
    try {
      const token = getAccessToken()
      const response = await fetch(`/api/animations/${animation.id}/restore`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Erreur lors de la restauration')
      }

      toast.success('Animation restaurée')
      setRestoreModalOpen(false)
      onStatusChange?.()
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la restauration')
    } finally {
      setActionLoading(false)
    }
  }, [animation, getAccessToken, onStatusChange])

  if (loading) {
    return (
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-28" />
      </div>
    )
  }

  if (!animation) {
    return null
  }

  const isArchived = animation.status === 'archived'

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => router.push(`/dashboard/animations/${animation.id}/results`)}
          className="gap-2"
        >
          <Eye className="h-4 w-4" />
          Voir les résultats
        </Button>

        <Button
          variant="outline"
          onClick={() => router.push(`/dashboard/animations/${animation.id}/edit`)}
          className="gap-2"
        >
          <Pencil className="h-4 w-4" />
          Éditer
        </Button>

        {isArchived ? (
          <Button
            variant="outline"
            onClick={() => setRestoreModalOpen(true)}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Restaurer
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => setArchiveModalOpen(true)}
            className="gap-2 text-destructive hover:text-destructive"
          >
            <Archive className="h-4 w-4" />
            Archiver
          </Button>
        )}
      </div>

      {/* Archive Modal */}
      <ArchiveAnimationModal
        isOpen={archiveModalOpen}
        onClose={() => setArchiveModalOpen(false)}
        onConfirm={handleArchive}
        animationName={animation.name}
        isLoading={actionLoading}
      />

      {/* Restore Modal */}
      <RestoreAnimationModal
        isOpen={restoreModalOpen}
        onClose={() => setRestoreModalOpen(false)}
        onConfirm={handleRestore}
        animationName={animation.name}
        isLoading={actionLoading}
      />
    </>
  )
}
