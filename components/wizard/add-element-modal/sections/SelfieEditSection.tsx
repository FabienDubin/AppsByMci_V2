'use client'

import { Button } from '@/components/ui/button'

interface SelfieEditSectionProps {
  onCancel: () => void
  onSave: () => void
  isEditing: boolean
}

export function SelfieEditSection({ onCancel, onSave, isEditing }: SelfieEditSectionProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Le selfie sera ajouté à la liste. Les participants pourront uploader ou capturer une photo via leur webcam/appareil.
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button onClick={onSave}>
          {isEditing ? 'Sauvegarder' : 'Ajouter'}
        </Button>
      </div>
    </div>
  )
}
