'use client'

import { useEffect } from 'react'
import { ParticipantWizard } from '@/components/participant/ParticipantWizard'
import { useParticipantFormStore } from '@/lib/stores/participantForm.store'

/**
 * Participant page for an animation
 * Displays the multi-step form wizard
 * The layout handles animation fetching and customization
 */
export default function ParticipantPage() {
  const { reset } = useParticipantFormStore()

  // Reset form store on mount (fresh start for each visit)
  useEffect(() => {
    reset()
  }, [reset])

  return (
    <div className="py-4">
      <ParticipantWizard />
    </div>
  )
}
