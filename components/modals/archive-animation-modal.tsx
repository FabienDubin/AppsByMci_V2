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
import { Archive, Loader2, AlertTriangle } from 'lucide-react'

interface ArchiveAnimationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  animationName: string
  isLoading?: boolean
}

export function ArchiveAnimationModal({
  isOpen,
  onClose,
  onConfirm,
  animationName,
  isLoading = false,
}: ArchiveAnimationModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Archiver &quot;{animationName}&quot; ?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm text-muted-foreground">
              <span className="flex items-start gap-2 text-amber-600">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  L&apos;animation ne sera plus accessible aux participants (lien et QR
                  code désactivés).
                </span>
              </span>
              <span className="block">Vous pourrez restaurer l&apos;animation à tout moment depuis la vue &quot;Archivées&quot;.</span>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Archivage...
              </>
            ) : (
              'Archiver'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
