// Hook for fetching animation timeline data (Story 5.2 AC4)
import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/lib/stores/auth.store'
import { toast } from 'sonner'

export type TimelinePeriod = '7d' | '30d' | 'all'

export interface TimelineDataPoint {
  date: string
  count: number
}

export interface AnimationTimeline {
  period: TimelinePeriod
  data: TimelineDataPoint[]
}

export interface UseAnimationTimelineReturn {
  timeline: AnimationTimeline | null
  loading: boolean
  error: string | null
  period: TimelinePeriod
  setPeriod: (period: TimelinePeriod) => void
  refetch: () => Promise<void>
}

export function useAnimationTimeline(
  animationId: string,
  initialPeriod: TimelinePeriod = '30d'
): UseAnimationTimelineReturn {
  const { getAccessToken } = useAuthStore()
  const [timeline, setTimeline] = useState<AnimationTimeline | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<TimelinePeriod>(initialPeriod)

  const fetchTimeline = useCallback(async () => {
    try {
      setLoading(true)
      const token = getAccessToken()
      if (!token) {
        setError('Non authentifié')
        return
      }

      const response = await fetch(`/api/animations/${animationId}/timeline?period=${period}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Erreur lors du chargement de la timeline')
      }

      setTimeline(result.data)
      setError(null)
    } catch (err: any) {
      setError(err.message)
      toast.error('Erreur lors du chargement de la timeline')
    } finally {
      setLoading(false)
    }
  }, [animationId, period, getAccessToken])

  // Fetch on animationId or period change
  useEffect(() => {
    if (animationId) {
      fetchTimeline()
    }
  }, [animationId, period, fetchTimeline])

  return {
    timeline,
    loading,
    error,
    period,
    setPeriod,
    refetch: fetchTimeline,
  }
}
