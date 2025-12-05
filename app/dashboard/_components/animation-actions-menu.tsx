// Animation actions dropdown menu component
// Contains all actions for a single animation row

'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MoreHorizontal,
  Globe,
  Eye,
  Pencil,
  Copy,
  Archive,
  Trash2,
  RotateCcw,
} from 'lucide-react'
import { AnimationResponse } from '@/lib/services/animation.service'

export type ActionType = 'view' | 'viewDetails' | 'edit' | 'duplicate' | 'archive' | 'restore' | 'delete'

interface AnimationActionsMenuProps {
  animation: AnimationResponse
  onAction: (type: ActionType) => void
}

export function AnimationActionsMenu({ animation, onAction }: AnimationActionsMenuProps) {
  const isPublished = animation.status === 'published'
  const isArchived = animation.status === 'archived'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Menu actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* View public animation - only if published */}
        {isPublished && (
          <DropdownMenuItem onClick={() => onAction('view')}>
            <Globe className="h-4 w-4 mr-2" />
            Voir l'animation
          </DropdownMenuItem>
        )}

        {/* View details page */}
        <DropdownMenuItem onClick={() => onAction('viewDetails')}>
          <Eye className="h-4 w-4 mr-2" />
          Voir les détails
        </DropdownMenuItem>

        {/* Edit - not available for archived */}
        {!isArchived && (
          <DropdownMenuItem onClick={() => onAction('edit')}>
            <Pencil className="h-4 w-4 mr-2" />
            Éditer
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Duplicate - always available */}
        <DropdownMenuItem onClick={() => onAction('duplicate')}>
          <Copy className="h-4 w-4 mr-2" />
          Dupliquer
        </DropdownMenuItem>

        {/* Archive or Restore based on status */}
        {isArchived ? (
          <DropdownMenuItem onClick={() => onAction('restore')}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurer
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={() => onAction('archive')}
            className="text-amber-600"
          >
            <Archive className="h-4 w-4 mr-2" />
            Archiver
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Delete - always available */}
        <DropdownMenuItem
          onClick={() => onAction('delete')}
          className="text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
