import { Button } from '@/components/ui/button'

interface WizardNavigationProps {
  onPrev?: () => void
  onNext: () => void | Promise<void>
  isLoading?: boolean
  nextLabel?: string
  showPrev?: boolean
}

export function WizardNavigation({
  onPrev,
  onNext,
  isLoading = false,
  nextLabel = 'Suivant',
  showPrev = true,
}: WizardNavigationProps) {
  return (
    <div className="flex justify-between pt-4 border-t">
      {showPrev && onPrev ? (
        <Button onClick={onPrev} variant="outline" disabled={isLoading}>
          Précédent
        </Button>
      ) : (
        <div /> // Empty div for flex spacing
      )}
      <Button onClick={onNext} disabled={isLoading}>
        {isLoading ? 'Sauvegarde...' : nextLabel}
      </Button>
    </div>
  )
}
