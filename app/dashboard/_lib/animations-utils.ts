// Dashboard animations utility functions
// Used by AnimationsTable and other dashboard components

import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

/**
 * Format a date for dashboard display
 * @param date - Date to format
 * @returns Formatted date string in French locale (e.g., "05 déc. 2025")
 */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Get status label in French
 * @param status - Animation status
 * @returns French status label
 */
export function getStatusLabel(status: string): string {
  switch (status) {
    case 'published':
      return 'Publiée'
    case 'draft':
      return 'Brouillon'
    case 'archived':
      return 'Archivée'
    default:
      return status
  }
}

/**
 * Format a date as relative time (e.g., "Il y a 2 heures")
 * @param date - Date to format
 * @returns Relative time string in French locale, or null if no date
 */
export function formatRelativeDate(date: Date | string | null | undefined): string | null {
  if (!date) return null

  try {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: fr,
    })
  } catch {
    return null
  }
}

/**
 * Get badge variant and class for status
 * @param status - Animation status
 * @returns Object with variant and className for Badge component
 */
export function getStatusBadgeProps(status: string): {
  variant: 'default' | 'secondary' | 'outline' | 'destructive'
  className?: string
  label: string
} {
  switch (status) {
    case 'published':
      return {
        variant: 'default',
        className: 'bg-green-100 text-green-800 hover:bg-green-100',
        label: 'Publiée',
      }
    case 'draft':
      return {
        variant: 'outline',
        label: 'Brouillon',
      }
    case 'archived':
      return {
        variant: 'secondary',
        className: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
        label: 'Archivée',
      }
    default:
      return {
        variant: 'outline',
        label: status,
      }
  }
}
