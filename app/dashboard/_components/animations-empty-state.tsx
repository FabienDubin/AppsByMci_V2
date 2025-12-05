// Animations empty state component
// Displayed when no animations match the current filters

'use client'

import { Button } from '@/components/ui/button'
import { Plus, FileQuestion } from 'lucide-react'

interface AnimationsEmptyStateProps {
  onCreateClick: () => void
  hasFilters?: boolean
}

export function AnimationsEmptyState({ onCreateClick, hasFilters }: AnimationsEmptyStateProps) {
  if (hasFilters) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileQuestion className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium mb-2">Aucune animation trouvée</p>
        <p className="text-sm">Essayez de modifier vos filtres ou votre recherche.</p>
      </div>
    )
  }

  return (
    <div className="text-center py-12 text-muted-foreground">
      <p className="text-lg font-medium mb-4">Aucune animation créée</p>
      <Button onClick={onCreateClick} variant="outline" className="gap-2">
        <Plus className="h-4 w-4" />
        Créer ma première animation
      </Button>
    </div>
  )
}
