'use client'

import { InputElement } from '@/lib/stores/wizard.store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, GripVertical, Camera, CheckSquare, BarChart3, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface ElementBlockProps {
  element: InputElement
  onEdit: (element: InputElement) => void
  onDelete: (elementId: string) => void
  dragHandleProps?: Record<string, any>
  isDragging?: boolean
}

// Helper function to get icon by element type
const getElementIcon = (type: InputElement['type']) => {
  const iconMap = {
    selfie: Camera,
    choice: CheckSquare,
    slider: BarChart3,
    'free-text': FileText,
  }
  return iconMap[type] || FileText
}

// Helper function to truncate text
const truncate = (text: string, maxLength: number): string => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Helper function to get preview text
const getPreviewText = (element: InputElement): string => {
  switch (element.type) {
    case 'selfie':
      return 'Upload ou capture via webcam'

    case 'choice': {
      const optionsCount = element.options?.length || 0
      if (optionsCount === 0) return 'Aucune option'
      const optionsList = element.options!.slice(0, 3).join(', ')
      if (optionsCount > 3) {
        return `${optionsCount} options : ${optionsList}, ...`
      }
      return `${optionsCount} options : ${optionsList}`
    }

    case 'slider': {
      if (element.min === undefined || element.max === undefined) {
        return 'Échelle non configurée'
      }
      if (element.minLabel && element.maxLabel) {
        return `${element.min} (${element.minLabel}) - ${element.max} (${element.maxLabel})`
      }
      return `Échelle ${element.min}-${element.max}`
    }

    case 'free-text':
      return `max ${element.maxLength || 500} caractères`

    default:
      return ''
  }
}

export function ElementBlock({
  element,
  onEdit,
  onDelete,
  dragHandleProps,
  isDragging = false,
}: ElementBlockProps) {
  const Icon = getElementIcon(element.type)
  const title = element.type === 'selfie' ? 'Selfie' : truncate(element.question || '', 50)
  const fullTitle = element.type === 'selfie' ? 'Selfie' : element.question || ''
  const preview = getPreviewText(element)
  const isTruncated = title !== fullTitle && element.type !== 'selfie'

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border bg-card p-4 transition-all',
        isDragging ? 'opacity-50' : 'opacity-100',
        'hover:bg-accent/50'
      )}
    >
      {/* Drag Handle */}
      <div
        {...dragHandleProps}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      {/* Icon */}
      <div className="flex-shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <h4 className="text-sm font-medium leading-none mb-1 truncate">{title}</h4>
            </TooltipTrigger>
            {isTruncated && (
              <TooltipContent>
                <p className="max-w-sm">{fullTitle}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
        <p className="text-sm text-muted-foreground">{preview}</p>
      </div>

      {/* Required Badge */}
      {element.required && element.type !== 'selfie' && (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Requis
        </Badge>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(element)}
                className="h-8 w-8"
              >
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Éditer</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Éditer</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(element.id)}
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Supprimer</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Supprimer</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}
