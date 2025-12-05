'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useWizardStore } from '@/lib/stores/wizard.store'
import { usePreferencesStore } from '@/lib/stores/preferences.store'
import { LogoutButton } from '@/components/auth/logout-button'
import { Button } from '@/components/ui/button'
import { Plus, Loader2, Users } from 'lucide-react'

// Local components
import { useAnimations } from './_hooks/use-animations'
import { AnimationsFilters } from './_components/animations-filters'
import { AnimationsTable } from './_components/animations-table'
import { AnimationsEmptyState } from './_components/animations-empty-state'
import { AnimationsModals, createInitialModalState, ModalType } from './_components/animations-modals'
import { AnimationsPagination } from './_components/animations-pagination'
import { ActionType } from './_components/animation-actions-menu'
import { AnimationResponse } from '@/lib/services/animation.service'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { resetWizard } = useWizardStore()
  const { setShowAllAnimations } = usePreferencesStore()
  const router = useRouter()

  // Animation data and actions from hook
  const {
    animations,
    loading,
    error,
    pagination,
    filter,
    setFilter,
    scope,
    search,
    setSearch,
    setPage,
    duplicateAnimation,
    archiveAnimation,
    restoreAnimation,
    deleteAnimation,
    actionLoading,
  } = useAnimations()

  // Modals state
  const [modals, setModals] = useState(createInitialModalState())

  // Modal helpers
  const openModal = useCallback((type: ModalType, animation: AnimationResponse) => {
    setModals((prev) => ({
      ...prev,
      [type]: { isOpen: true, animation },
    }))
  }, [])

  const closeModal = useCallback((type: ModalType) => {
    setModals((prev) => ({
      ...prev,
      [type]: { isOpen: false, animation: null },
    }))
  }, [])

  // Handle modal confirm actions
  const handleModalConfirm = useCallback(async (type: ModalType) => {
    const animation = modals[type].animation
    if (!animation) return

    let success = false
    switch (type) {
      case 'duplicate':
        success = await duplicateAnimation(animation)
        break
      case 'archive':
        success = await archiveAnimation(animation)
        break
      case 'restore':
        success = await restoreAnimation(animation)
        break
      case 'delete':
        success = await deleteAnimation(animation)
        break
    }

    if (success) {
      closeModal(type)
    }
  }, [modals, duplicateAnimation, archiveAnimation, restoreAnimation, deleteAnimation, closeModal])

  // Handle table actions
  const handleAction = useCallback((type: ActionType, animation: AnimationResponse) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin

    switch (type) {
      case 'view':
        window.open(`${baseUrl}/a/${animation.slug}`, '_blank')
        break
      case 'viewDetails':
        router.push(`/dashboard/animations/${animation.id}`)
        break
      case 'edit':
        router.push(`/dashboard/animations/${animation.id}/edit`)
        break
      case 'duplicate':
      case 'archive':
      case 'restore':
      case 'delete':
        openModal(type, animation)
        break
    }
  }, [router, openModal])

  // Handle creating a new animation
  const handleCreateAnimation = useCallback(() => {
    resetWizard()
    router.push('/dashboard/animations/new')
  }, [resetWizard, router])

  // Auth check
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const hasFilters = filter !== 'active' || search !== ''

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <LogoutButton showConfirmation={true} />
        </div>

        <div className="grid gap-6">
          {/* User info card */}
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-4">Bienvenue, {user?.name || user?.email}</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p><strong>Email:</strong> {user?.email}</p>
                  <p><strong>Rôle:</strong> {user?.role}</p>
                </div>
              </div>
              {user?.role === 'admin' && (
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard/users')}
                  className="gap-2"
                >
                  <Users className="h-4 w-4" />
                  Gérer les utilisateurs
                </Button>
              )}
            </div>
          </div>

          {/* Animations section */}
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                {scope === 'all' ? 'Toutes les Animations' : 'Mes Animations'}
              </h2>
              <Button onClick={handleCreateAnimation} className="gap-2">
                <Plus className="h-4 w-4" />
                Nouvelle animation
              </Button>
            </div>

            {/* Filters */}
            <AnimationsFilters
              filter={filter}
              onFilterChange={setFilter}
              scope={scope}
              onScopeChange={setShowAllAnimations}
              search={search}
              onSearchChange={setSearch}
              isAdmin={user?.role === 'admin'}
            />

            {/* Content */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Erreur : {error}</p>
                <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                  Réessayer
                </Button>
              </div>
            ) : animations.length === 0 ? (
              <AnimationsEmptyState onCreateClick={handleCreateAnimation} hasFilters={hasFilters} />
            ) : (
              <>
                <AnimationsTable
                  animations={animations}
                  scope={scope}
                  currentUserId={user?.id || ''}
                  onAction={handleAction}
                />
                {pagination && (
                  <AnimationsPagination pagination={pagination} onPageChange={setPage} />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimationsModals
        modals={modals}
        onClose={closeModal}
        onConfirm={handleModalConfirm}
        actionLoading={actionLoading}
      />
    </div>
  )
}
