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
import { InputElementType } from '@/lib/stores/wizard.store'

interface DeleteElementDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  elementType: InputElementType | null
}

// Helper function to get element type label in French
const getElementTypeLabel = (type: InputElementType | null): string => {
  if (!type) return 'élément'

  const labels: Record<InputElementType, string> = {
    selfie: 'Selfie',
    choice: 'Question choix multiple',
    slider: 'Question slider',
    'free-text': 'Réponse libre',
  }

  return labels[type] || 'élément'
}

export function DeleteElementDialog({
  isOpen,
  onClose,
  onConfirm,
  elementType,
}: DeleteElementDialogProps) {
  const typeLabel = getElementTypeLabel(elementType)

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer cet élément ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. L'élément "{typeLabel}" sera retiré de la liste.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
