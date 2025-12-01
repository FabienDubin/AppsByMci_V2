import { useState, useEffect } from 'react'
import { useWizardStore } from '@/lib/stores/wizard.store'

interface UseAnimationEditOptions {
  animationId?: string | null
  getAccessToken: () => string | null
}

interface UseAnimationEditReturn {
  loading: boolean
  error: string | null
  originalStatus: 'draft' | 'published' | null
  isEditMode: boolean
  canEditSlug: boolean
  qrCodeUrl: string | null
}

/**
 * Hook to load animation data in edit mode
 * Fetches animation by ID and populates wizard store
 */
export function useAnimationEdit({
  animationId,
  getAccessToken,
}: UseAnimationEditOptions): UseAnimationEditReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [originalStatus, setOriginalStatus] = useState<'draft' | 'published' | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const { updateData } = useWizardStore()

  useEffect(() => {
    if (!animationId) return

    const loadAnimation = async () => {
      setLoading(true)
      setError(null)

      try {
        const token = getAccessToken()
        if (!token) {
          throw new Error('Non authentifié')
        }

        const response = await fetch(`/api/animations/${animationId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.error?.message || 'Erreur lors du chargement')
        }

        // Store original status and QR code URL
        setOriginalStatus(result.data.status || 'draft')
        setQrCodeUrl(result.data.qrCodeUrl || null)

        // Inject data into wizard store
        updateData(result.data)
      } catch (error: any) {
        console.error('Error loading animation:', error)
        setError(error.message || 'Erreur lors du chargement')
      } finally {
        setLoading(false)
      }
    }

    loadAnimation()
  }, [animationId, getAccessToken, updateData])

  return {
    loading,
    error,
    originalStatus,
    isEditMode: !!animationId,
    canEditSlug: originalStatus === 'draft', // Can only edit slug if draft
    qrCodeUrl,
  }
}
