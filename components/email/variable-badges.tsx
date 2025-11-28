'use client'

import { Badge } from '@/components/ui/badge'

interface VariableBadgesProps {
  variables: string[]
  onInsert: (variable: string) => void
  emptyMessage?: string
}

/**
 * Variable badges component for email templates
 * Displays clickable badges that insert variables at cursor position
 */
export function VariableBadges({
  variables,
  onInsert,
  emptyMessage = 'Aucune variable disponible',
}: VariableBadgesProps) {
  if (variables.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{emptyMessage}</p>
    )
  }

  // Get display label for variable
  const getVariableLabel = (variable: string): string => {
    // Special display for known variables
    const labels: Record<string, string> = {
      '{nom}': '👤 Nom',
      '{prenom}': '👤 Prénom',
      '{email}': '📧 Email',
      '{imageUrl}': '🖼️ Image générée',
    }

    if (labels[variable]) {
      return labels[variable]
    }

    // Question variables: {question1} → "❓ Question 1"
    const match = variable.match(/\{question(\d+)\}/)
    if (match) {
      return `❓ Question ${match[1]}`
    }

    return variable
  }

  // Check if it's the image variable (special styling)
  const isImageVariable = (variable: string) => variable === '{imageUrl}'

  return (
    <div className="flex flex-wrap gap-2">
      {variables.map((variable) => (
        <Badge
          key={variable}
          variant={isImageVariable(variable) ? 'default' : 'secondary'}
          className={`
            cursor-pointer transition-all
            ${
              isImageVariable(variable)
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                : 'hover:bg-primary hover:text-primary-foreground'
            }
          `}
          onClick={() => onInsert(variable)}
        >
          {getVariableLabel(variable)}
        </Badge>
      ))}
    </div>
  )
}
