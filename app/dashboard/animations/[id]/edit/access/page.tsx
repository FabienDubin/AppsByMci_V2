'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useWizardStore } from '@/lib/stores/wizard.store'
import { useAnimationEdit } from '@/lib/hooks/useAnimationEdit'
import { EditHeader } from '@/components/wizard/edit-header'
import { Step2AccessAndBaseFields } from '@/components/wizard/steps/step-2-access-and-base-fields'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Loader2, AlertTriangle, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

export default function EditAccessPage({
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
  const handleSave = async (data: any) => {
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
        body: JSON.stringify(data),
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
          currentSection="Configuration d'Accès"
          animationId={animationId}
        />

        <div className="rounded-lg border bg-card p-6">
          <Step2AccessAndBaseFields
            initialData={animationData}
            onNext={handleSave}
            onPrev={handleCancel}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  )
}
