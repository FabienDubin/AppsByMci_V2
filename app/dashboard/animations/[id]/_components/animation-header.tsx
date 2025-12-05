'use client'

// Animation Header Component (Story 5.2 AC1)
// Displays animation name, status badge, and back button
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import { AnimationResponse } from '@/lib/services/animation.service'
import { getStatusBadgeProps } from '@/app/dashboard/_lib/animations-utils'
import { Skeleton } from '@/components/ui/skeleton'

interface AnimationHeaderProps {
  animation: AnimationResponse | null
  loading?: boolean
}

export function AnimationHeader({ animation, loading }: AnimationHeaderProps) {
  const router = useRouter()

  if (loading) {
    return (
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
      </div>
    )
  }

  if (!animation) {
    return null
  }

  const badgeProps = getStatusBadgeProps(animation.status)

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/dashboard')}
          aria-label="Retour au dashboard"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{animation.name}</h1>
          <Badge variant={badgeProps.variant} className={badgeProps.className}>
            {badgeProps.label}
          </Badge>
        </div>
      </div>
    </div>
  )
}
