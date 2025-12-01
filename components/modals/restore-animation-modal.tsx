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
import { RotateCcw, Loader2 } from 'lucide-react'

interface RestoreAnimationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  animationName: string
  isLoading?: boolean
}

export function RestoreAnimationModal({
  isOpen,
  onClose,
  onConfirm,
  animationName,
  isLoading = false,
}: RestoreAnimationModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Restaurer &quot;{animationName}&quot; ?
          </AlertDialogTitle>
          <AlertDialogDescription>
            L&apos;animation reviendra à son statut précédent (brouillon ou publiée).
            Si elle était publiée, elle sera à nouveau accessible aux participants.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Restauration...
              </>
            ) : (
              'Restaurer'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
