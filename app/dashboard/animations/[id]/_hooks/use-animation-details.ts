// Hook for fetching animation details (Story 5.2 AC1, AC2)
import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/lib/stores/auth.store'
import { AnimationResponse } from '@/lib/services/animation.service'
import { toast } from 'sonner'

export interface UseAnimationDetailsReturn {
  animation: AnimationResponse | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useAnimationDetails(animationId: string): UseAnimationDetailsReturn {
  const { getAccessToken } = useAuthStore()
  const [animation, setAnimation] = useState<AnimationResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnimation = useCallback(async () => {
    try {
      setLoading(true)
      const token = getAccessToken()
      if (!token) {
        setError('Non authentifié')
        return
      }

      const response = await fetch(`/api/animations/${animationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Erreur lors du chargement')
      }

      setAnimation(result.data)
      setError(null)
    } catch (err: any) {
      setError(err.message)
      toast.error("Erreur lors du chargement de l'animation")
    } finally {
      setLoading(false)
    }
  }, [animationId, getAccessToken])

  useEffect(() => {
    if (animationId) {
      fetchAnimation()
    }
  }, [animationId, fetchAnimation])

  return {
    animation,
    loading,
    error,
    refetch: fetchAnimation,
  }
}
