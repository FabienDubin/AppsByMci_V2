'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface EditHeaderProps {
  animationName: string
  currentSection?: string
  animationId?: string
}

/**
 * Header component for edit mode with breadcrumb navigation
 * Displays: "Éditer : {nom animation}" or "Éditer : {nom} > {section}"
 */
export function EditHeader({
  animationName,
  currentSection,
  animationId,
}: EditHeaderProps) {
  const router = useRouter()

  // Handle back navigation
  const handleBack = () => {
    if (currentSection && animationId) {
      // Go back to edit summary
      router.push(`/dashboard/animations/${animationId}/edit`)
    } else {
      // Go back to dashboard
      router.push('/dashboard')
    }
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>

        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">
            Éditer : {animationName || 'Sans nom'}
          </h1>

          {currentSection && (
            <>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
              <span className="text-xl text-muted-foreground">{currentSection}</span>
            </>
          )}

          {!currentSection && (
            <Badge variant="secondary" className="ml-2">
              Mode Édition
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}
