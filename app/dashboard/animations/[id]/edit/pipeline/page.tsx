'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useWizardStore } from '@/lib/stores/wizard.store'
import { useAnimationEdit } from '@/lib/hooks/useAnimationEdit'
import { EditHeader } from '@/components/wizard/edit-header'
import { Step4Pipeline } from '@/components/wizard/steps/step-4-pipeline'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Loader2, AlertTriangle, ArrowLeft, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import { step4Schema } from '@/lib/schemas/animation.schema'
import { validatePipelineLogic } from '@/lib/utils/pipeline-validator'

export default function EditPipelinePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const animationId = resolvedParams.id
  const router = useRouter()
  const { getAccessToken } = useAuthStore()
  const { animationData } = useWizardStore()

  const [isLoading, setIsLoading] = useState(false)

  // Load animation data
  const {
    loading: loadingAnimation,
    error: loadError,
  } = useAnimationEdit({
    animationId,
    getAccessToken,
  })

  // Handle save and return to summary
  const handleSave = async () => {
    const pipeline = animationData.pipeline || []

    try {
      // Zod validation
      step4Schema.parse({ pipeline })

      // Intelligent pipeline validation
      const validationResult = validatePipelineLogic(
        pipeline,
        animationData.inputCollection
      )

      if (validationResult.type === 'error') {
        toast.error(validationResult.message)
        return
      }

      // Warning/info - show but allow save
      if (validationResult.type === 'warning' || validationResult.type === 'info') {
        toast.warning(validationResult.message)
      }
    } catch (error: any) {
      if (error.errors) {
        toast.error(error.errors[0]?.message || 'Erreur de validation')
      } else {
        toast.error('Erreur de validation du pipeline')
      }
      return
    }

    setIsLoading(true)

    try {
      const token = getAccessToken()
      if (!token) {
        throw new Error('Non authentifié')
      }

      const response = await fetch(`/api/animations/${animationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pipeline }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Erreur lors de la sauvegarde')
      }

      toast.success('Section mise à jour avec succès')
      router.push(`/dashboard/animations/${animationId}/edit`)
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la sauvegarde')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle cancel
  const handleCancel = () => {
    router.push(`/dashboard/animations/${animationId}/edit`)
  }

  // Loading state
  if (loadingAnimation) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (loadError) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-4xl">
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        <EditHeader
          animationName={animationData.name || 'Sans nom'}
          currentSection="Pipeline de Traitement"
          animationId={animationId}
        />

        <div className="rounded-lg border bg-card p-6">
          <div className="space-y-6">
            <Step4Pipeline />

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Sauvegarder
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
