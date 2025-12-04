'use client'

import { Button } from '@/components/ui/button'

interface FormActionButtonsProps {
  onCancel: () => void
  submitLabel: string
  isSubmit?: boolean
}

export function FormActionButtons({ onCancel, submitLabel, isSubmit = true }: FormActionButtonsProps) {
  return (
    <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" onClick={onCancel}>
        Annuler
      </Button>
      <Button type={isSubmit ? 'submit' : 'button'}>
        {submitLabel}
      </Button>
    </div>
  )
}
