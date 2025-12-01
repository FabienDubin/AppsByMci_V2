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
import { Copy, Loader2 } from 'lucide-react'

interface DuplicateAnimationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  animationName: string
  isLoading?: boolean
}

export function DuplicateAnimationModal({
  isOpen,
  onClose,
  onConfirm,
  animationName,
  isLoading = false,
}: DuplicateAnimationModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Dupliquer &quot;{animationName}&quot; ?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Une copie complète sera créée en brouillon. Vous pourrez ensuite la
            modifier indépendamment de l&apos;originale.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Duplication...
              </>
            ) : (
              'Dupliquer'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
