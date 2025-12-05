'use client'

import { useState, useEffect } from 'react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, Loader2, AlertTriangle, Archive } from 'lucide-react'

interface DeleteUserModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  userName: string
  animationCount: number
  isLoading?: boolean
}

const CONFIRMATION_TEXT = 'SUPPRIMER'

export function DeleteUserModal({
  isOpen,
  onClose,
  onConfirm,
  userName,
  animationCount,
  isLoading = false,
}: DeleteUserModalProps) {
  const [confirmText, setConfirmText] = useState('')
  const isConfirmationValid = confirmText === CONFIRMATION_TEXT

  // Reset confirmation text when modal closes
  useEffect(() => {
    if (!isOpen) {
      setConfirmText('')
    }
  }, [isOpen])

  const handleConfirm = () => {
    if (isConfirmationValid) {
      onConfirm()
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Supprimer l&apos;utilisateur &quot;{userName}&quot; ?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              <span className="flex items-start gap-2 text-destructive font-medium">
                <Trash2 className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  L&apos;utilisateur sera définitivement supprimé.
                  <strong> Cette action est irréversible.</strong>
                </span>
              </span>

              {animationCount > 0 && (
                <span className="flex items-start gap-2 text-amber-600 dark:text-amber-500">
                  <Archive className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    {animationCount} animation{animationCount > 1 ? 's' : ''} sera{animationCount > 1 ? 'ont' : ''} archivée{animationCount > 1 ? 's' : ''} (non supprimée{animationCount > 1 ? 's' : ''}).
                  </span>
                </span>
              )}

              <div className="space-y-2 pt-2">
                <Label htmlFor="confirm-delete-user" className="text-foreground">
                  Tapez <strong>{CONFIRMATION_TEXT}</strong> pour confirmer :
                </Label>
                <Input
                  id="confirm-delete-user"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={CONFIRMATION_TEXT}
                  disabled={isLoading}
                  className="font-mono"
                  autoComplete="off"
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isConfirmationValid || isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Suppression...
              </>
            ) : (
              'Supprimer définitivement'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
