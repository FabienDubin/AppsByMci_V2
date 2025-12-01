'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useWizardStore } from '@/lib/stores/wizard.store'
import { LogoutButton } from '@/components/auth/logout-button'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRouter } from 'next/navigation'
import { Plus, MoreHorizontal, Pencil, Eye, Copy, Archive, Trash2, RotateCcw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { AnimationResponse } from '@/lib/services/animation.service'
import { DuplicateAnimationModal } from '@/components/modals/duplicate-animation-modal'
import { ArchiveAnimationModal } from '@/components/modals/archive-animation-modal'
import { RestoreAnimationModal } from '@/components/modals/restore-animation-modal'
import { DeleteAnimationModal } from '@/components/modals/delete-animation-modal'

type FilterType = 'active' | 'archived' | 'all'

interface ModalState {
  duplicate: { isOpen: boolean; animation: AnimationResponse | null }
  archive: { isOpen: boolean; animation: AnimationResponse | null }
  restore: { isOpen: boolean; animation: AnimationResponse | null }
  delete: { isOpen: boolean; animation: AnimationResponse | null }
}

export default function DashboardPage() {
  const { user, getAccessToken } = useAuthStore()
  const { resetWizard } = useWizardStore()
  const router = useRouter()

  const [animations, setAnimations] = useState<AnimationResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('active')
  const [actionLoading, setActionLoading] = useState(false)
  const [modals, setModals] = useState<ModalState>({
    duplicate: { isOpen: false, animation: null },
    archive: { isOpen: false, animation: null },
    restore: { isOpen: false, animation: null },
    delete: { isOpen: false, animation: null },
  })

  // Fetch animations with filter
  const fetchAnimations = useCallback(async (currentFilter: FilterType) => {
    try {
      const token = getAccessToken()
      if (!token) {
        setError('Non authentifié')
        return
      }

      const response = await fetch(`/api/animations?filter=${currentFilter}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Erreur lors du chargement')
      }

      setAnimations(result.data)
      setError(null)
    } catch (err: any) {
      setError(err.message)
      toast.error('Erreur lors du chargement des animations')
    } finally {
      setLoading(false)
    }
  }, [getAccessToken])

  // Fetch animations on mount and filter change
  useEffect(() => {
    if (user) {
      setLoading(true)
      fetchAnimations(filter)
    }
  }, [user, filter, fetchAnimations])

  // AuthProvider ensures we're authenticated
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  // Handle creating a new animation
  const handleCreateAnimation = () => {
    resetWizard()
    router.push('/dashboard/animations/new')
  }

  // Handle editing an animation
  const handleEditAnimation = (id: string) => {
    router.push(`/dashboard/animations/${id}/edit`)
  }

  // Handle viewing an animation
  const handleViewAnimation = (slug: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    window.open(`${baseUrl}/a/${slug}`, '_blank')
  }

  // Modal helpers
  const openModal = (type: keyof ModalState, animation: AnimationResponse) => {
    setModals((prev) => ({
      ...prev,
      [type]: { isOpen: true, animation },
    }))
  }

  const closeModal = (type: keyof ModalState) => {
    setModals((prev) => ({
      ...prev,
      [type]: { isOpen: false, animation: null },
    }))
  }

  // Handle duplicating an animation
  const handleDuplicate = async () => {
    const animation = modals.duplicate.animation
    if (!animation) return

    setActionLoading(true)
    try {
      const token = getAccessToken()
      const response = await fetch(`/api/animations/${animation.id}/duplicate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Erreur lors de la duplication')
      }

      toast.success('Animation dupliquée avec succès')
      closeModal('duplicate')
      // Refresh list to show the new duplicate
      fetchAnimations(filter)
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la duplication')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle archiving an animation
  const handleArchive = async () => {
    const animation = modals.archive.animation
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
        throw new Error(result.error?.message || 'Erreur lors de l\'archivage')
      }

      toast.success('Animation archivée')
      closeModal('archive')
      // Refresh list - animation will disappear from 'active' filter
      fetchAnimations(filter)
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'archivage')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle restoring an animation
  const handleRestore = async () => {
    const animation = modals.restore.animation
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
      closeModal('restore')
      // Refresh list
      fetchAnimations(filter)
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la restauration')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle deleting an animation
  const handleDelete = async () => {
    const animation = modals.delete.animation
    if (!animation) return

    setActionLoading(true)
    try {
      const token = getAccessToken()
      const response = await fetch(`/api/animations/${animation.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Erreur lors de la suppression')
      }

      toast.success('Animation supprimée définitivement')
      closeModal('delete')
      // Refresh list
      fetchAnimations(filter)
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la suppression')
    } finally {
      setActionLoading(false)
    }
  }

  // Format date for display
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800">Publiée</Badge>
      case 'draft':
        return <Badge variant="outline">Brouillon</Badge>
      case 'archived':
        return <Badge variant="secondary">Archivée</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <LogoutButton showConfirmation={true} />
        </div>

        <div className="grid gap-6">
          {/* User info card */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">Bienvenue, {user?.name || user?.email}</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>
                <strong>Email:</strong> {user?.email}
              </p>
              <p>
                <strong>Rôle:</strong> {user?.role}
              </p>
            </div>
          </div>

          {/* Animations section */}
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Mes Animations</h2>
              <Button onClick={handleCreateAnimation} className="gap-2">
                <Plus className="h-4 w-4" />
                Nouvelle animation
              </Button>
            </div>

            {/* Filter tabs */}
            <Tabs value={filter} onValueChange={(value) => setFilter(value as FilterType)} className="mb-6">
              <TabsList>
                <TabsTrigger value="active">Actives</TabsTrigger>
                <TabsTrigger value="archived">Archivées</TabsTrigger>
                <TabsTrigger value="all">Toutes</TabsTrigger>
              </TabsList>
            </Tabs>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Erreur : {error}</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => window.location.reload()}
                >
                  Réessayer
                </Button>
              </div>
            ) : animations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Aucune animation pour le moment.</p>
                <Button onClick={handleCreateAnimation} variant="outline" className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Créer ma première animation
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Créée le</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {animations.map((animation) => (
                    <TableRow key={animation.id}>
                      <TableCell className="font-medium">{animation.name}</TableCell>
                      <TableCell>{getStatusBadge(animation.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(animation.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Menu actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {animation.status === 'published' && (
                              <DropdownMenuItem
                                onClick={() => handleViewAnimation(animation.slug)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Voir
                              </DropdownMenuItem>
                            )}
                            {animation.status !== 'archived' && (
                              <DropdownMenuItem
                                onClick={() => handleEditAnimation(animation.id)}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Éditer
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openModal('duplicate', animation)}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Dupliquer
                            </DropdownMenuItem>
                            {animation.status === 'archived' ? (
                              <DropdownMenuItem
                                onClick={() => openModal('restore', animation)}
                              >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Restaurer
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => openModal('archive', animation)}
                                className="text-amber-600"
                              >
                                <Archive className="h-4 w-4 mr-2" />
                                Archiver
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openModal('delete', animation)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <DuplicateAnimationModal
        isOpen={modals.duplicate.isOpen}
        onClose={() => closeModal('duplicate')}
        onConfirm={handleDuplicate}
        animationName={modals.duplicate.animation?.name || ''}
        isLoading={actionLoading}
      />

      <ArchiveAnimationModal
        isOpen={modals.archive.isOpen}
        onClose={() => closeModal('archive')}
        onConfirm={handleArchive}
        animationName={modals.archive.animation?.name || ''}
        isLoading={actionLoading}
      />

      <RestoreAnimationModal
        isOpen={modals.restore.isOpen}
        onClose={() => closeModal('restore')}
        onConfirm={handleRestore}
        animationName={modals.restore.animation?.name || ''}
        isLoading={actionLoading}
      />

      <DeleteAnimationModal
        isOpen={modals.delete.isOpen}
        onClose={() => closeModal('delete')}
        onConfirm={handleDelete}
        animationName={modals.delete.animation?.name || ''}
        isLoading={actionLoading}
      />
    </div>
  )
}
