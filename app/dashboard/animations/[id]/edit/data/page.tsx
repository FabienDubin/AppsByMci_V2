'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useWizardStore } from '@/lib/stores/wizard.store'
import { useAnimationEdit } from '@/lib/hooks/useAnimationEdit'
import { EditHeader } from '@/components/wizard/edit-header'
import { Step3AdvancedInputs } from '@/components/wizard/steps/step-3-advanced-inputs'
import { StepHeader } from '@/components/wizard/step-header'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Loader2, AlertTriangle, ArrowLeft, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import { step3Schema } from '@/lib/schemas/animation.schema'

export default function EditDataPage({
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
    const inputCollection = animationData.inputCollection

    if (!inputCollection || !inputCollection.elements || inputCollection.elements.length === 0) {
      toast.error('Vous devez ajouter au moins un élément de collecte')
      return
    }

    try {
      // Validate with Zod schema
      step3Schema.parse({ inputCollection })
    } catch (error: any) {
      if (error.errors) {
        toast.error(error.errors[0]?.message || 'Erreur de validation')
      } else {
        toast.error('Erreur de validation des données')
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
        body: JSON.stringify({ inputCollection }),
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
          currentSection="Collecte de Données"
          animationId={animationId}
        />

        <div className="rounded-lg border bg-card p-6">
          <div className="space-y-6">
            <StepHeader
              title="Collecte de Données"
              description="Configurez les éléments avancés à collecter auprès des participants"
            />

            <Step3AdvancedInputs />

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
