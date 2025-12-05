'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth.store'
import { LogoutButton } from '@/components/auth/logout-button'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { UserTable } from '@/components/dashboard/users/user-table'
import { UserFormModal, type CreateUserData, type EditUserData } from '@/components/dashboard/users/user-form-modal'
import { DeleteUserModal } from '@/components/dashboard/users/delete-user-modal'
import { useDebounce } from '@/lib/hooks/useDebounce'
import type { UserRole } from '@/lib/schemas/user.schema'

// User type from API response
export interface UserWithStats {
  id: string
  email: string
  name?: string
  role: 'admin' | 'editor' | 'viewer'
  createdAt: string
  animationCount: number
}

type FilterRole = UserRole | 'all'

interface ModalState {
  create: boolean
  edit: { isOpen: boolean; user: UserWithStats | null }
  delete: { isOpen: boolean; user: UserWithStats | null }
}

export default function UsersPage() {
  const { user, getAccessToken } = useAuthStore()
  const router = useRouter()

  const [users, setUsers] = useState<UserWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<FilterRole>('all')
  const [actionLoading, setActionLoading] = useState(false)
  const [modals, setModals] = useState<ModalState>({
    create: false,
    edit: { isOpen: false, user: null },
    delete: { isOpen: false, user: null },
  })

  // Debounce search value (300ms per AC7)
  const debouncedSearch = useDebounce(search, 300)

  // Verify admin access
  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast.error('Accès réservé aux administrateurs')
      router.push('/dashboard')
    }
  }, [user, router])

  // Fetch users with filters
  const fetchUsers = useCallback(async () => {
    try {
      const token = getAccessToken()
      if (!token) {
        setError('Non authentifié')
        return
      }

      const params = new URLSearchParams()
      if (debouncedSearch.trim()) {
        params.set('search', debouncedSearch.trim())
      }
      if (roleFilter !== 'all') {
        params.set('role', roleFilter)
      }

      const response = await fetch(`/api/users?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Erreur lors du chargement')
      }

      setUsers(result.data)
      setError(null)
    } catch (err: any) {
      setError(err.message)
      toast.error('Erreur lors du chargement des utilisateurs')
    } finally {
      setLoading(false)
    }
  }, [getAccessToken, debouncedSearch, roleFilter])

  // Fetch users on mount and when filters change
  useEffect(() => {
    if (user && user.role === 'admin') {
      setLoading(true)
      fetchUsers()
    }
  }, [user, fetchUsers])

  // Modal helpers
  const openCreateModal = () => {
    setModals((prev) => ({ ...prev, create: true }))
  }

  const openEditModal = (userToEdit: UserWithStats) => {
    setModals((prev) => ({ ...prev, edit: { isOpen: true, user: userToEdit } }))
  }

  const openDeleteModal = (userToDelete: UserWithStats) => {
    setModals((prev) => ({ ...prev, delete: { isOpen: true, user: userToDelete } }))
  }

  const closeModals = () => {
    setModals({
      create: false,
      edit: { isOpen: false, user: null },
      delete: { isOpen: false, user: null },
    })
  }

  // Handle creating a new user
  const handleCreateUser = async (data: CreateUserData) => {
    setActionLoading(true)
    try {
      const token = getAccessToken()
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Erreur lors de la création')
      }

      toast.success('Utilisateur créé avec succès')
      closeModals()
      fetchUsers()
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la création')
      throw err // Re-throw to let the modal handle it
    } finally {
      setActionLoading(false)
    }
  }

  // Handle updating a user
  const handleUpdateUser = async (userId: string, data: EditUserData) => {
    setActionLoading(true)
    try {
      const token = getAccessToken()
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Erreur lors de la modification')
      }

      toast.success('Utilisateur modifié avec succès')
      closeModals()
      fetchUsers()
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la modification')
      throw err
    } finally {
      setActionLoading(false)
    }
  }

  // Handle deleting a user
  const handleDeleteUser = async (userId: string) => {
    setActionLoading(true)
    try {
      const token = getAccessToken()
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Erreur lors de la suppression')
      }

      toast.success('Utilisateur supprimé avec succès')
      closeModals()
      fetchUsers()
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la suppression')
    } finally {
      setActionLoading(false)
    }
  }

  // Prevent rendering for non-admin users
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/dashboard')}
              aria-label="Retour au dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">Gestion des utilisateurs</h1>
          </div>
          <LogoutButton showConfirmation={true} />
        </div>

        {/* Users section */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Utilisateurs</h2>
            <Button onClick={openCreateModal} className="gap-2">
              <Plus className="h-4 w-4" />
              Nouvel utilisateur
            </Button>
          </div>

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
                onClick={() => fetchUsers()}
              >
                Réessayer
              </Button>
            </div>
          ) : (
            <UserTable
              users={users}
              search={search}
              onSearchChange={setSearch}
              roleFilter={roleFilter}
              onRoleFilterChange={setRoleFilter}
              onEdit={openEditModal}
              onDelete={openDeleteModal}
              currentUserId={user.id}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <UserFormModal
        mode="create"
        isOpen={modals.create}
        onClose={closeModals}
        onSubmit={handleCreateUser}
        isLoading={actionLoading}
      />

      <UserFormModal
        mode="edit"
        isOpen={modals.edit.isOpen}
        onClose={closeModals}
        onSubmit={async (data) => {
          if (modals.edit.user) {
            await handleUpdateUser(modals.edit.user.id, data)
          }
        }}
        isLoading={actionLoading}
        initialData={modals.edit.user || undefined}
      />

      <DeleteUserModal
        isOpen={modals.delete.isOpen}
        onClose={closeModals}
        onConfirm={() =>
          modals.delete.user && handleDeleteUser(modals.delete.user.id)
        }
        userName={modals.delete.user?.name || modals.delete.user?.email || ''}
        animationCount={modals.delete.user?.animationCount || 0}
        isLoading={actionLoading}
      />
    </div>
  )
}
