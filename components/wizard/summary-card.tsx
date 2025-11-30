'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, Check, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SummaryCardProps {
  title: string
  isComplete: boolean
  onEdit: () => void
  children: React.ReactNode
  stepNumber?: number
  className?: string
  error?: string
}

/**
 * Reusable summary card component for Step 8 recap
 * Displays a section of the animation configuration with:
 * - Title with step number
 * - Completion badge (green check or orange warning)
 * - Edit button on hover
 * - Error message if validation fails
 */
export function SummaryCard({
  title,
  isComplete,
  onEdit,
  children,
  stepNumber,
  className,
  error,
}: SummaryCardProps) {
  return (
    <Card
      className={cn(
        'relative group transition-all duration-200 hover:shadow-md',
        !isComplete && 'border-orange-300',
        error && 'border-red-300',
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            {stepNumber && (
              <span className="text-sm text-muted-foreground font-normal">
                Étape {stepNumber}
              </span>
            )}
            {title}
          </CardTitle>

          <div className="flex items-center gap-2">
            {/* Completion badge */}
            <Badge
              variant={isComplete ? 'default' : 'secondary'}
              className={cn(
                'text-xs',
                isComplete
                  ? 'bg-green-100 text-green-800 hover:bg-green-100'
                  : 'bg-orange-100 text-orange-800 hover:bg-orange-100'
              )}
            >
              {isComplete ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Complète
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Incomplète
                </>
              )}
            </Badge>

            {/* Edit button - visible on hover */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 px-2"
            >
              <Pencil className="h-4 w-4 mr-1" />
              Modifier
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {children}

        {/* Error message */}
        {error && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Summary item component for displaying key-value pairs
 */
interface SummaryItemProps {
  label: string
  value: React.ReactNode
  className?: string
}

export function SummaryItem({ label, value, className }: SummaryItemProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm mt-0.5">{value}</dd>
    </div>
  )
}

/**
 * Summary list component for displaying lists with bullets
 */
interface SummaryListProps {
  items: string[]
  emptyText?: string
}

export function SummaryList({ items, emptyText = 'Aucun' }: SummaryListProps) {
  if (items.length === 0) {
    return <span className="text-muted-foreground text-sm">{emptyText}</span>
  }

  return (
    <ul className="list-disc list-inside space-y-1 text-sm">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  )
}

/**
 * Color preview component
 */
interface ColorPreviewProps {
  color: string
  label?: string
}

export function ColorPreview({ color, label }: ColorPreviewProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-6 h-6 rounded border border-gray-200 shadow-sm"
        style={{ backgroundColor: color }}
      />
      <span className="text-sm font-mono">{color}</span>
      {label && <span className="text-sm text-muted-foreground">({label})</span>}
    </div>
  )
}
