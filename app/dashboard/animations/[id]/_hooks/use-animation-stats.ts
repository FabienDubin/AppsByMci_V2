// Hook for fetching animation stats (Story 5.2 AC3)
import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/lib/stores/auth.store'
import { toast } from 'sonner'

export interface AnimationStats {
  totalParticipations: number
  successfulGenerations: number
  failedGenerations: number
  successRate: number
  averageGenerationTime: number
  emailsSent: number
}

export interface UseAnimationStatsReturn {
  stats: AnimationStats | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

interface UseAnimationStatsOptions {
  /** Enable polling for real-time updates (default: false) */
  enablePolling?: boolean
  /** Polling interval in milliseconds (default: 30000 = 30s) */
  pollingInterval?: number
}

export function useAnimationStats(
  animationId: string,
  options: UseAnimationStatsOptions = {}
): UseAnimationStatsReturn {
  const { enablePolling = false, pollingInterval = 30000 } = options
  const { getAccessToken } = useAuthStore()
  const [stats, setStats] = useState<AnimationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      // Don't show loading on polling refetch
      if (!stats) setLoading(true)

      const token = getAccessToken()
      if (!token) {
        setError('Non authentifié')
        return
      }

      const response = await fetch(`/api/animations/${animationId}/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Erreur lors du chargement des statistiques')
      }

      setStats(result.data)
      setError(null)
    } catch (err: any) {
      setError(err.message)
      // Only show toast on initial load, not on polling errors
      if (!stats) {
        toast.error('Erreur lors du chargement des statistiques')
      }
    } finally {
      setLoading(false)
    }
  }, [animationId, getAccessToken, stats])

  // Initial fetch
  useEffect(() => {
    if (animationId) {
      fetchStats()
    }
  }, [animationId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Polling for real-time updates
  useEffect(() => {
    if (!enablePolling || !animationId) return

    const intervalId = setInterval(fetchStats, pollingInterval)
    return () => clearInterval(intervalId)
  }, [enablePolling, pollingInterval, animationId, fetchStats])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  }
}
