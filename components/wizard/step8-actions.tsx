'use client'

import { Button } from '@/components/ui/button'
import { Save, Send, Loader2 } from 'lucide-react'

interface Step8ActionsProps {
  isValid: boolean
  onSaveDraft: () => void
  onPublish: () => void
  isLoading?: boolean
  loadingAction?: 'draft' | 'publish' | null
  mode?: 'create' | 'edit'
  currentStatus?: 'draft' | 'published'
}

/**
 * Step 8 action buttons component
 * Displays Save Draft and Publish buttons with proper states
 */
export function Step8Actions({
  isValid,
  onSaveDraft,
  onPublish,
  isLoading = false,
  loadingAction = null,
  mode = 'create',
  currentStatus,
}: Step8ActionsProps) {
  // Determine save button label based on mode
  const saveButtonLabel = mode === 'edit'
    ? 'Sauvegarder les modifications'
    : 'Sauvegarder comme brouillon'

  const saveButtonLoadingLabel = mode === 'edit'
    ? 'Sauvegarde...'
    : 'Sauvegarde...'

  // Show publish button:
  // - In create mode: always
  // - In edit mode: only if currentStatus is 'draft'
  const showPublishButton = mode === 'create' || currentStatus === 'draft'

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
      {/* Save button - always enabled */}
      <Button
        variant="outline"
        onClick={onSaveDraft}
        disabled={isLoading}
        className="w-full sm:w-auto"
      >
        {loadingAction === 'draft' ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        {loadingAction === 'draft' ? saveButtonLoadingLabel : saveButtonLabel}
      </Button>

      {/* Publish button - disabled if validation fails, hidden if published in edit mode */}
      {showPublishButton && (
        <Button
          onClick={onPublish}
          disabled={!isValid || isLoading}
          className="w-full sm:w-auto"
        >
          {loadingAction === 'publish' ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          {loadingAction === 'publish' ? 'Publication...' : 'Publier l\'animation'}
        </Button>
      )}
    </div>
  )
}
