import { toast } from 'sonner'
import { useWizardStore } from '@/lib/stores/wizard.store'
import type { Step1Data } from '@/lib/schemas/animation.schema'

interface UseWizardNavigationOptions {
  mode?: 'create' | 'edit'
  getAccessToken: () => string | null
}

export function useWizardNavigation({ mode = 'create', getAccessToken }: UseWizardNavigationOptions) {
  const {
    animationId,
    setAnimationId,
    updateData,
    nextStep,
    prevStep,
    setStep,
    setLoading,
    setError,
    resetWizard,
  } = useWizardStore()

  /**
   * Handle Step 1 submission
   * Creates draft animation via POST /api/animations OR updates via PUT if animationId exists
   */
  const handleStep1Next = async (data: Step1Data) => {
    setLoading(true)
    setError(null) // Clear any previous errors

    try {
      const token = getAccessToken()
      if (!token) {
        throw new Error('Non authentifié')
      }

      // If animation already exists (user navigated back), try to update it
      if (animationId) {
        const response = await fetch(`/api/animations/${animationId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        })

        const result = await response.json()

        // If animation not found (deleted or session expired), create a new one
        if (response.status === 404 || result.error?.code === 'NOT_FOUND_3001') {
          console.warn('Animation not found, creating new one')
          // Clear old animationId and fall through to create new
          setAnimationId('')
        } else if (!response.ok || !result.success) {
          // Handle error without throwing
          setError(result.error?.message || 'Erreur lors de la mise à jour')
          setLoading(false)
          return
        } else {
          // Update successful
          updateData(result.data)
          nextStep()
          setLoading(false)
          return
        }
      }

      // Create new animation (either animationId was empty or update failed with 404)
      {
        const response = await fetch('/api/animations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        })

        const result = await response.json()

        if (!response.ok || !result.success) {
          // Handle error without throwing
          setError(result.error?.message || 'Erreur lors de la création')
          setLoading(false)
          return
        }

        // Store animation ID and data
        setAnimationId(result.data.id)
        updateData(result.data)

        // Move to next step
        nextStep()
      }
    } catch (error: any) {
      // Only catch unexpected errors (network issues, etc.)
      console.error('Unexpected error with animation:', error)
      setError('Une erreur inattendue est survenue')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Save animation data without advancing to next step
   * Used for intermediate saves (e.g., enabling email collection from Step 5)
   */
  const saveData = async (data: any): Promise<boolean> => {
    if (!animationId) {
      toast.error('Aucune animation en cours')
      return false
    }

    try {
      const token = getAccessToken()
      if (!token) {
        throw new Error('Non authentifié')
      }

      const response = await fetch(`/api/animations/${animationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Erreur lors de la mise à jour')
      }

      // Update local data
      updateData(result.data)
      return true
    } catch (error: any) {
      console.error('Error saving animation:', error)
      toast.error(error.message || 'Une erreur est survenue')
      return false
    }
  }

  /**
   * Handle subsequent steps (2-8)
   * Updates animation via PUT /api/animations/[id]
   */
  const handleNextStep = async (data: any) => {
    if (!animationId) {
      toast.error('Aucune animation en cours')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const token = getAccessToken()
      if (!token) {
        throw new Error('Non authentifié')
      }

      // Call PUT /api/animations/[id] to update
      const response = await fetch(`/api/animations/${animationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Erreur lors de la mise à jour')
      }

      // Update local data
      updateData(result.data)

      toast.success('Étape sauvegardée')

      // Move to next step
      nextStep()
    } catch (error: any) {
      console.error('Error updating animation:', error)
      setError(error.message)
      toast.error(error.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle previous step
   */
  const handlePrevStep = () => {
    prevStep()
  }

  /**
   * Handle go to specific step (used by Step 8 summary edit buttons)
   */
  const handleGoToStep = (step: number) => {
    if (step >= 1 && step <= 8) {
      setStep(step)
    }
  }

  /**
   * Handle reset wizard
   */
  const handleReset = () => {
    if (confirm('Es-tu sûr de vouloir réinitialiser le wizard ? Toutes les données seront perdues.')) {
      resetWizard()
      toast.success('Wizard réinitialisé')
    }
  }

  return {
    handleStep1Next,
    handleNextStep,
    saveData,
    handlePrevStep,
    handleGoToStep,
    handleReset,
  }
}
