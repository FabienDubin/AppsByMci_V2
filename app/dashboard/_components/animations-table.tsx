// Animations table component
// Displays the list of animations with columns and action menu

'use client'

import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AnimationResponse } from '@/lib/services/animation.service'
import { AnimationActionsMenu, ActionType } from './animation-actions-menu'
import { formatDate, formatRelativeDate, getStatusBadgeProps } from '../_lib/animations-utils'
import type { ScopeType } from '../_hooks/use-animations'

interface AnimationsTableProps {
  animations: AnimationResponse[]
  scope: ScopeType
  currentUserId: string
  onAction: (type: ActionType, animation: AnimationResponse) => void
}

export function AnimationsTable({
  animations,
  scope,
  currentUserId,
  onAction,
}: AnimationsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nom</TableHead>
          {scope === 'all' && <TableHead>Propriétaire</TableHead>}
          <TableHead>Statut</TableHead>
          <TableHead>Participations</TableHead>
          <TableHead>Créée le</TableHead>
          <TableHead>Dernière activité</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {animations.map((animation) => {
          const isOwnAnimation = animation.userId === currentUserId
          const statusProps = getStatusBadgeProps(animation.status)

          // Get participation count and last activity from animation
          // These will be added to AnimationResponse after Task 2
          const participationCount = (animation as any).participationCount ?? 0
          const lastActivity = (animation as any).lastActivity

          return (
            <TableRow key={animation.id}>
              {/* Name - clickable */}
              <TableCell className="font-medium">
                <button
                  onClick={() => onAction('viewDetails', animation)}
                  className="hover:underline text-left"
                >
                  {animation.name}
                </button>
              </TableCell>

              {/* Owner column - only in admin "all" scope */}
              {scope === 'all' && (
                <TableCell>
                  {isOwnAnimation ? (
                    <Badge variant="outline" className="text-xs">Moi</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {(animation as any).ownerName || 'Utilisateur inconnu'}
                    </span>
                  )}
                </TableCell>
              )}

              {/* Status badge */}
              <TableCell>
                <Badge
                  variant={statusProps.variant}
                  className={statusProps.className}
                >
                  {statusProps.label}
                </Badge>
              </TableCell>

              {/* Participation count */}
              <TableCell className="text-muted-foreground">
                {participationCount}
              </TableCell>

              {/* Created date */}
              <TableCell className="text-muted-foreground">
                {formatDate(animation.createdAt)}
              </TableCell>

              {/* Last activity - relative date or "-" */}
              <TableCell className="text-muted-foreground">
                {formatRelativeDate(lastActivity) || '-'}
              </TableCell>

              {/* Actions menu */}
              <TableCell className="text-right">
                <AnimationActionsMenu
                  animation={animation}
                  onAction={(type) => onAction(type, animation)}
                />
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
