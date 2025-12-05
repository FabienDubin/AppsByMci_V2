'use client'

import { useState } from 'react'
import { Step8Summary } from '@/components/wizard/steps/step-8-summary'
import { Step8Actions } from '@/components/wizard/step8-actions'
import { PublishConfirmationModal } from '@/components/wizard/publish-confirmation-modal'
import { PublishSuccessModal } from '@/components/wizard/publish-success-modal'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { validateForPublication } from '@/lib/services/animation-validation.service'

/**
 * Step 8 Content Component
 * Handles summary display, save draft, and publish actions
 */
interface Step8ContentProps {
  animationId: string | null
  animationData: any
  onGoToStep: (step: number) => void
  onPrev: () => void
  isLoading: boolean
  setLoading: (loading: boolean) => void
  getAccessToken: () => string | null
  resetWizard: () => void
  router: any
}

export function Step8Content({
  animationId,
  animationData,
  onGoToStep,
  onPrev,
  isLoading,
  setLoading,
  getAccessToken,
  resetWizard,
  router,
}: Step8ContentProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [loadingAction, setLoadingAction] = useState<'draft' | 'publish' | null>(null)
  const [publishedData, setPublishedData] = useState<{
    publicUrl: string
    qrCodeUrl?: string
  } | null>(null)

  // Validate animation data for publication
  const validation = validateForPublication(animationData)
  const isValid = validation.isValid

  /**
   * Handle save as draft
   */
  const handleSaveDraft = async () => {
    if (!animationId) {
      toast.error('Aucune animation en cours')
      return
    }

    setLoading(true)
    setLoadingAction('draft')

    try {
      const token = getAccessToken()
      if (!token) {
        throw new Error('Non authentifié')
      }

      // Update animation status to draft (in case it was already published)
      const response = await fetch(`/api/animations/${animationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'draft' }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Erreur lors de la sauvegarde')
      }

      toast.success('Animation sauvegardée comme brouillon')

      // Reset wizard and redirect to dashboard
      resetWizard()
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
      setLoadingAction(null)
    }
  }

  /**
   * Handle publish - opens confirmation modal
   */
  const handlePublish = () => {
    if (!isValid) {
      toast.error('Configuration incomplète. Veuillez corriger les erreurs.')
      return
    }
    setShowConfirmModal(true)
  }

  /**
   * Handle publish confirmation
   */
  const handleConfirmPublish = async () => {
    if (!animationId) {
      toast.error('Aucune animation en cours')
      return
    }

    setLoading(true)
    setLoadingAction('publish')

    try {
      const token = getAccessToken()
      if (!token) {
        throw new Error('Non authentifié')
      }

      // Call publish endpoint
      const response = await fetch(`/api/animations/${animationId}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Erreur lors de la publication')
      }

      // Close confirmation modal
      setShowConfirmModal(false)

      // Store published data for success modal
      setPublishedData({
        publicUrl: result.data.publicUrl,
        qrCodeUrl: result.data.qrCodeUrl,
      })

      // Show success modal
      setShowSuccessModal(true)

      toast.success('Animation publiée avec succès !')
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la publication')
      setShowConfirmModal(false)
    } finally {
      setLoading(false)
      setLoadingAction(null)
    }
  }

  /**
   * Handle go to dashboard after success
   */
  const handleGoToDashboard = () => {
    setShowSuccessModal(false)
    resetWizard()
    router.push('/dashboard')
  }

  /**
   * Handle view animation after success
   */
  const handleViewAnimation = () => {
    setShowSuccessModal(false)
    resetWizard()
    if (publishedData?.publicUrl) {
      window.open(publishedData.publicUrl, '_blank')
    }
    router.push('/dashboard')
  }

  return (
    <div className="space-y-6">
      {/* Summary display */}
      <Step8Summary onGoToStep={onGoToStep} />

      {/* Navigation and actions */}
      <div className="flex flex-col gap-4 pt-4 border-t">
        <div className="flex justify-between">
          <Button onClick={onPrev} variant="outline" disabled={isLoading}>
            Précédent
          </Button>
        </div>

        <Step8Actions
          isValid={isValid}
          onSaveDraft={handleSaveDraft}
          onPublish={handlePublish}
          isLoading={isLoading}
          loadingAction={loadingAction}
        />
      </div>

      {/* Confirmation Modal */}
      <PublishConfirmationModal
        open={showConfirmModal}
        onOpenChange={setShowConfirmModal}
        onConfirm={handleConfirmPublish}
        animationName={animationData.name || 'Sans nom'}
        slug={animationData.slug || ''}
        isLoading={loadingAction === 'publish'}
      />

      {/* Success Modal */}
      <PublishSuccessModal
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        animationId={animationId || ''}
        animationName={animationData.name || 'Sans nom'}
        publicUrl={publishedData?.publicUrl || ''}
        qrCodeUrl={publishedData?.qrCodeUrl}
        onGoToDashboard={handleGoToDashboard}
        onViewAnimation={handleViewAnimation}
      />
    </div>
  )
}
