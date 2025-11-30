import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RotateCcw } from 'lucide-react'

interface WizardHeaderProps {
  mode?: 'create' | 'edit'
  animationName?: string
  onReset: () => void
  isLoading?: boolean
}

export function WizardHeader({
  mode = 'create',
  animationName,
  onReset,
  isLoading = false,
}: WizardHeaderProps) {
  return (
    <div className="mb-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold">
          {mode === 'create' ? 'Créer une animation' : `Éditer : ${animationName || 'Sans nom'}`}
        </h1>
        {mode === 'edit' && (
          <Badge variant="secondary" className="text-sm">
            Mode Édition
          </Badge>
        )}
      </div>
      <Button
        onClick={onReset}
        variant="outline"
        size="sm"
        className="gap-2"
        disabled={isLoading}
      >
        <RotateCcw className="h-4 w-4" />
        Reset
      </Button>
    </div>
  )
}
