'use client'

import { use, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useWizardStore } from '@/lib/stores/wizard.store'
import { useAnimationEdit } from '@/lib/hooks/useAnimationEdit'
import { EditHeader } from '@/components/wizard/edit-header'
import { Step8Summary } from '@/components/wizard/steps/step-8-summary'
import { Step8Actions } from '@/components/wizard/step8-actions'
import { PublishConfirmationModal } from '@/components/wizard/publish-confirmation-modal'
import { PublishSuccessModal } from '@/components/wizard/publish-success-modal'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  Download,
  Copy,
  QrCode,
} from 'lucide-react'
import { toast } from 'sonner'
import { generateSummary } from '@/lib/utils/animation-summary'

// Section route mapping
const SECTION_ROUTES: Record<number, string> = {
  1: 'general',
  2: 'access',
  3: 'data',
  4: 'pipeline',
  5: 'email',
  6: 'display',
  7: 'customization',
}

export default function EditAnimationPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const animationId = resolvedParams.id
  const router = useRouter()
  const { getAccessToken } = useAuthStore()
  const { animationData, resetWizard } = useWizardStore()

  // Local state
  const [isLoading, setIsLoading] = useState(false)
  const [loadingAction, setLoadingAction] = useState<'draft' | 'publish' | null>(null)
  const [showPublishConfirm, setShowPublishConfirm] = useState(false)
  const [showPublishSuccess, setShowPublishSuccess] = useState(false)
  const [publishedQrCode, setPublishedQrCode] = useState<string | null>(null)

  // Load animation data
  const {
    loading: loadingAnimation,
    error: loadError,
    originalStatus,
    qrCodeUrl: existingQrCodeUrl,
  } = useAnimationEdit({
    animationId,
    getAccessToken,
  })

  // Build public URL
  const publicUrl = animationData.slug
    ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://avatar.appsbymci.com'}/a/${animationData.slug}`
    : null

  // Copy URL to clipboard
  const handleCopyUrl = async () => {
    if (publicUrl) {
      await navigator.clipboard.writeText(publicUrl)
      toast.success('URL copiée !')
    }
  }

  // Download QR code
  const handleDownloadQrCode = async () => {
    if (existingQrCodeUrl) {
      try {
        const response = await fetch(existingQrCodeUrl)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `qrcode-${animationData.slug || 'animation'}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        toast.success('QR code téléchargé !')
      } catch {
        toast.error('Erreur lors du téléchargement')
      }
    }
  }

  // Calculate validation status
  const summary = useMemo(() => generateSummary(animationData), [animationData])
  const isValid = summary.isComplete

  // Navigate to section edit page
  const handleGoToSection = (step: number) => {
    const section = SECTION_ROUTES[step]
    if (section) {
      router.push(`/dashboard/animations/${animationId}/edit/${section}`)
    }
  }

  // Save all modifications
  const handleSave = async () => {
    setIsLoading(true)
    setLoadingAction('draft')

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
        body: JSON.stringify(animationData),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Erreur lors de la sauvegarde')
      }

      toast.success('Modifications sauvegardées')
      resetWizard()
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la sauvegarde')
      setIsLoading(false)
      setLoadingAction(null)
    }
  }

  // Handle publish button click
  const handlePublishClick = () => {
    setShowPublishConfirm(true)
  }

  // Confirm and publish animation
  const handlePublishConfirm = async () => {
    setShowPublishConfirm(false)
    setIsLoading(true)
    setLoadingAction('publish')

    try {
      const token = getAccessToken()
      if (!token) {
        throw new Error('Non authentifié')
      }

      // First save all changes
      const saveResponse = await fetch(`/api/animations/${animationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(animationData),
      })

      const saveResult = await saveResponse.json()

      if (!saveResponse.ok || !saveResult.success) {
        throw new Error(saveResult.error?.message || 'Erreur lors de la sauvegarde')
      }

      // Then publish
      const publishResponse = await fetch(`/api/animations/${animationId}/publish`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const publishResult = await publishResponse.json()

      if (!publishResponse.ok || !publishResult.success) {
        throw new Error(publishResult.error?.message || 'Erreur lors de la publication')
      }

      // Show success modal with QR code
      setPublishedQrCode(publishResult.data.qrCodeUrl || null)
      setShowPublishSuccess(true)
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la publication')
    } finally {
      setIsLoading(false)
      setLoadingAction(null)
    }
  }

  // Handle success modal close
  const handleSuccessClose = () => {
    setShowPublishSuccess(false)
    resetWizard()
    router.push('/dashboard')
  }

  // Loading state
  if (loadingAnimation) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Chargement de l&apos;animation...</p>
            </div>
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
            <AlertDescription>
              {loadError.includes('404') || loadError.includes('introuvable')
                ? 'Animation non trouvée'
                : loadError}
            </AlertDescription>
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
        {/* Header with breadcrumb */}
        <EditHeader animationName={animationData.name || 'Sans nom'} animationId={animationId} />

        {/* Published animation info - URL & QR Code */}
        {originalStatus === 'published' && publicUrl && (
          <div className="rounded-lg border bg-card p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <QrCode className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-green-600">Animation publiée</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* URL Section */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground">URL publique</label>
                <div className="flex gap-2">
                  <div className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono truncate">
                    {publicUrl}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyUrl}
                    title="Copier l'URL"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(publicUrl, '_blank')}
                    title="Ouvrir dans un nouvel onglet"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* QR Code Section */}
              {existingQrCodeUrl && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground">QR Code</label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 border rounded-lg overflow-hidden bg-white p-1">
                      <img
                        src={existingQrCodeUrl}
                        alt="QR Code"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <Button variant="outline" onClick={handleDownloadQrCode} className="gap-2">
                      <Download className="h-4 w-4" />
                      Télécharger
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Summary cards */}
        <div className="rounded-lg border bg-card p-6">
          <Step8Summary onGoToStep={handleGoToSection} mode="edit" />

          {/* Action buttons */}
          <div className="mt-8 pt-6 border-t">
            <Step8Actions
              isValid={isValid}
              onSaveDraft={handleSave}
              onPublish={handlePublishClick}
              isLoading={isLoading}
              loadingAction={loadingAction}
              mode="edit"
              currentStatus={originalStatus || undefined}
            />
          </div>
        </div>
      </div>

      {/* Publish confirmation modal */}
      <PublishConfirmationModal
        open={showPublishConfirm}
        onOpenChange={setShowPublishConfirm}
        onConfirm={handlePublishConfirm}
        animationName={animationData.name || ''}
        slug={animationData.slug || ''}
      />

      {/* Publish success modal */}
      <PublishSuccessModal
        open={showPublishSuccess}
        onOpenChange={setShowPublishSuccess}
        animationName={animationData.name || ''}
        publicUrl={`${process.env.NEXT_PUBLIC_APP_URL || 'https://avatar.appsbymci.com'}/a/${
          animationData.slug || ''
        }`}
        qrCodeUrl={publishedQrCode || undefined}
        onGoToDashboard={handleSuccessClose}
        onViewAnimation={() => {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
          window.open(`${baseUrl}/a/${animationData.slug}`, '_blank')
          handleSuccessClose()
        }}
      />
    </div>
  )
}
