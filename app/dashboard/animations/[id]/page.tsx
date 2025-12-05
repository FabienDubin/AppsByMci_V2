'use client'

// Animation Details Page (Story 5.2)
// Displays animation info, stats, timeline, and quick actions
import { useParams } from 'next/navigation'
import { useCallback } from 'react'
import {
  AnimationHeader,
  AnimationInfoCard,
  QrCodeCard,
  StatsCards,
  TimelineChart,
  ActionButtons,
} from './_components'
import {
  useAnimationDetails,
  useAnimationStats,
  useAnimationTimeline,
} from './_hooks'

export default function AnimationDetailsPage() {
  const params = useParams()
  const animationId = params.id as string

  // Fetch animation details
  const { animation, loading: animationLoading, refetch: refetchAnimation } = useAnimationDetails(animationId)

  // Fetch stats with optional polling for real-time updates
  const { stats, loading: statsLoading } = useAnimationStats(animationId, {
    enablePolling: true,
    pollingInterval: 30000, // 30 seconds
  })

  // Fetch timeline data
  const { timeline, loading: timelineLoading, period, setPeriod } = useAnimationTimeline(animationId)

  // Handle status change (archive/restore)
  const handleStatusChange = useCallback(() => {
    refetchAnimation()
  }, [refetchAnimation])

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header with name, badge, back button */}
        <AnimationHeader animation={animation} loading={animationLoading} />

        {/* Info and QR code cards in grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <AnimationInfoCard animation={animation} loading={animationLoading} />
          </div>
          <div className="md:col-span-1">
            <QrCodeCard animation={animation} loading={animationLoading} />
          </div>
        </div>

        {/* Stats cards */}
        <StatsCards stats={stats} loading={statsLoading} />

        {/* Timeline chart */}
        <TimelineChart
          timeline={timeline}
          loading={timelineLoading}
          period={period}
          onPeriodChange={setPeriod}
        />

        {/* Action buttons */}
        <ActionButtons
          animation={animation}
          loading={animationLoading}
          onStatusChange={handleStatusChange}
        />
      </div>
    </div>
  )
}
