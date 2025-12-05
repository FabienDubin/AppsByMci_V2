'use client'

// Animation Info Card Component (Story 5.2 AC2)
// Displays slug (clickable), description, creation/modification dates
import { ExternalLink, Calendar, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AnimationResponse } from '@/lib/services/animation.service'
import { formatDate } from '@/app/dashboard/_lib/animations-utils'
import { Skeleton } from '@/components/ui/skeleton'

interface AnimationInfoCardProps {
  animation: AnimationResponse | null
  loading?: boolean
}

export function AnimationInfoCard({ animation, loading }: AnimationInfoCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-12 w-full" />
          <div className="flex gap-8">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-32" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!animation) {
    return null
  }

  // Build public URL for animation
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://avatar.appsbymci.com'
  const publicUrl = `${baseUrl}/a/${animation.slug}`
  const isPublished = animation.status === 'published'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Informations générales</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Slug with link */}
        <div>
          <p className="text-sm text-muted-foreground mb-1">Slug</p>
          {isPublished ? (
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium"
            >
              /a/{animation.slug}
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : (
            <span className="text-muted-foreground font-medium">/a/{animation.slug}</span>
          )}
        </div>

        {/* Description */}
        {animation.description && (
          <div>
            <p className="text-sm text-muted-foreground mb-1">Description</p>
            <p className="text-sm line-clamp-3">{animation.description}</p>
          </div>
        )}

        {/* Dates */}
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>Créée le {formatDate(animation.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>Modifiée le {formatDate(animation.updatedAt)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
