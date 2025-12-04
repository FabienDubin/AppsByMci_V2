'use client'

import { InputElementType } from '@/lib/stores/wizard.store'
import { ELEMENT_TYPES } from '../constants'

interface TypeSelectionGridProps {
  onSelect: (type: InputElementType) => void
  hasSelfie: boolean
}

export function TypeSelectionGrid({ onSelect, hasSelfie }: TypeSelectionGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {ELEMENT_TYPES.map(({ type, icon: Icon, label, description }) => (
        <button
          key={type}
          onClick={() => onSelect(type)}
          disabled={type === 'selfie' && hasSelfie}
          className="flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all hover:bg-accent hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon className="h-6 w-6 text-primary" />
          <div>
            <p className="font-medium">{label}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
            {type === 'selfie' && hasSelfie && (
              <p className="text-xs text-destructive mt-1">(Déjà ajouté)</p>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}
