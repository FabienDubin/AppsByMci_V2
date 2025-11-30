'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Send } from 'lucide-react'

interface PublishConfirmationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  animationName: string
  slug: string
  isLoading?: boolean
}

/**
 * Modal de confirmation avant publication
 * Affiche les informations de l'animation et demande confirmation
 */
export function PublishConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
  animationName,
  slug,
  isLoading = false,
}: PublishConfirmationModalProps) {
  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://appsbymci.com'}/a/${slug}`

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Confirmer la publication
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                Vous êtes sur le point de publier l'animation{' '}
                <strong>"{animationName}"</strong>.
              </p>

              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm font-medium mb-1">URL publique :</p>
                <code className="text-xs bg-background px-2 py-1 rounded block break-all">
                  {publicUrl}
                </code>
              </div>

              <Alert variant="default" className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700 text-sm">
                  Une fois publiée, l'animation sera accessible à tous via l'URL ci-dessus
                  et un QR code sera généré automatiquement.
                </AlertDescription>
              </Alert>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <span className="animate-spin">⏳</span>
                Publication...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Publier maintenant
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
