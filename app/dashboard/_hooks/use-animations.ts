// Dashboard animations hook
// Centralizes all animation data fetching and CRUD operations

import { useState, useCallback, useEffect } from 'react'
import { useAuthStore } from '@/lib/stores/auth.store'
import { usePreferencesStore } from '@/lib/stores/preferences.store'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { AnimationResponse } from '@/lib/services/animation.service'
import { toast } from 'sonner'

export type FilterType = 'active' | 'archived' | 'all'
export type ScopeType = 'mine' | 'all'

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface UseAnimationsReturn {
  // Data
  animations: AnimationResponse[]
  loading: boolean
  error: string | null
  pagination: PaginationInfo | null

  // Filters
  filter: FilterType
  setFilter: (filter: FilterType) => void
  scope: ScopeType
  search: string
  setSearch: (search: string) => void
  page: number
  setPage: (page: number) => void

  // Actions
  fetchAnimations: () => Promise<void>
  duplicateAnimation: (animation: AnimationResponse) => Promise<boolean>
  archiveAnimation: (animation: AnimationResponse) => Promise<boolean>
  restoreAnimation: (animation: AnimationResponse) => Promise<boolean>
  deleteAnimation: (animation: AnimationResponse) => Promise<boolean>
  actionLoading: boolean
}

export function useAnimations(): UseAnimationsReturn {
  const { user, getAccessToken } = useAuthStore()
  const { showAllAnimations } = usePreferencesStore()

  // State
  const [animations, setAnimations] = useState<AnimationResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('active')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Derive scope from admin preference
  const scope: ScopeType = user?.role === 'admin' && showAllAnimations ? 'all' : 'mine'

  // Debounce search value (300ms delay before API call)
  const debouncedSearch = useDebounce(search, 300)

  // Reset page when filter/debouncedSearch/scope changes
  useEffect(() => {
    setPage(1)
  }, [filter, debouncedSearch, scope])

  // Fetch animations
  const fetchAnimations = useCallback(async () => {
    try {
      setLoading(true)
      const token = getAccessToken()
      if (!token) {
        setError('Non authentifié')
        return
      }

      // Build URL with params (use debouncedSearch for API call)
      const params = new URLSearchParams({ filter })
      if (user?.role === 'admin' && scope === 'all') {
        params.set('scope', 'all')
      }
      if (debouncedSearch) {
        params.set('search', debouncedSearch)
      }
      params.set('page', page.toString())
      params.set('limit', '10')

      const response = await fetch(`/api/animations?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Erreur lors du chargement')
      }

      setAnimations(result.data)
      if (result.pagination) {
        setPagination(result.pagination)
      } else {
        // Backwards compatibility when pagination not returned
        setPagination(null)
      }
      setError(null)
    } catch (err: any) {
      setError(err.message)
      toast.error('Erreur lors du chargement des animations')
    } finally {
      setLoading(false)
    }
  }, [getAccessToken, user?.role, filter, scope, debouncedSearch, page])

  // Initial fetch and refetch on dependency changes
  useEffect(() => {
    if (user) {
      fetchAnimations()
    }
  }, [user, fetchAnimations])

  // CRUD Operations
  const duplicateAnimation = useCallback(async (animation: AnimationResponse): Promise<boolean> => {
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
      await fetchAnimations()
      return true
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la duplication')
      return false
    } finally {
      setActionLoading(false)
    }
  }, [getAccessToken, fetchAnimations])

  const archiveAnimation = useCallback(async (animation: AnimationResponse): Promise<boolean> => {
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
      await fetchAnimations()
      return true
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'archivage")
      return false
    } finally {
      setActionLoading(false)
    }
  }, [getAccessToken, fetchAnimations])

  const restoreAnimation = useCallback(async (animation: AnimationResponse): Promise<boolean> => {
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
      await fetchAnimations()
      return true
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la restauration')
      return false
    } finally {
      setActionLoading(false)
    }
  }, [getAccessToken, fetchAnimations])

  const deleteAnimation = useCallback(async (animation: AnimationResponse): Promise<boolean> => {
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
      await fetchAnimations()
      return true
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la suppression')
      return false
    } finally {
      setActionLoading(false)
    }
  }, [getAccessToken, fetchAnimations])

  return {
    // Data
    animations,
    loading,
    error,
    pagination,

    // Filters
    filter,
    setFilter,
    scope,
    search,
    setSearch,
    page,
    setPage,

    // Actions
    fetchAnimations,
    duplicateAnimation,
    archiveAnimation,
    restoreAnimation,
    deleteAnimation,
    actionLoading,
  }
}
