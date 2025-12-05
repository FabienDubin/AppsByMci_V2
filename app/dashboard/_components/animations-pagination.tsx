// Animations pagination component
// Displays pagination controls under the table

'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { PaginationInfo } from '../_hooks/use-animations'

interface AnimationsPaginationProps {
  pagination: PaginationInfo
  onPageChange: (page: number) => void
}

export function AnimationsPagination({ pagination, onPageChange }: AnimationsPaginationProps) {
  const { page, totalPages, total, limit } = pagination

  // Don't show pagination if only one page
  if (totalPages <= 1) {
    return null
  }

  // Calculate range for display
  const start = (page - 1) * limit + 1
  const end = Math.min(page * limit, total)

  return (
    <div className="flex items-center justify-between border-t pt-4 mt-4">
      <p className="text-sm text-muted-foreground">
        {start}-{end} sur {total} animation{total > 1 ? 's' : ''}
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Précédent
        </Button>

        <span className="text-sm text-muted-foreground px-2">
          Page {page} sur {totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Suivant
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
