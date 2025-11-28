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

interface DeleteBlockDialogProps {
  isOpen: boolean
  blockName: string
  onClose: () => void
  onConfirm: () => void
}

/**
 * Confirmation dialog for deleting a pipeline block
 * AC-3.6.7: Alert Dialog with confirmation message
 */
export function DeleteBlockDialog({
  isOpen,
  blockName,
  onClose,
  onConfirm,
}: DeleteBlockDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer ce bloc ?</AlertDialogTitle>
          <AlertDialogDescription>
            Le bloc &quot;{blockName}&quot; sera retiré du pipeline. Cette action est
            irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
