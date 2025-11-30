'use client'

import { Button } from '@/components/ui/button'
import { Save, Send, Loader2 } from 'lucide-react'

interface Step8ActionsProps {
  isValid: boolean
  onSaveDraft: () => void
  onPublish: () => void
  isLoading?: boolean
  loadingAction?: 'draft' | 'publish' | null
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
}: Step8ActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
      {/* Save Draft button - always enabled */}
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
        {loadingAction === 'draft' ? 'Sauvegarde...' : 'Sauvegarder comme brouillon'}
      </Button>

      {/* Publish button - disabled if validation fails */}
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
    </div>
  )
}
