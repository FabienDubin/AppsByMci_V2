'use client'

// Stats Cards Component (Story 5.2 AC3)
// Displays 6 stats cards: participations, successful, failed, success rate, avg time, emails sent
import { Users, CheckCircle, XCircle, Percent, Clock, Mail } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AnimationStats } from '../_hooks/use-animation-stats'

interface StatsCardsProps {
  stats: AnimationStats | null
  loading?: boolean
}

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  iconColor?: string
}

function StatCard({ title, value, icon, iconColor = 'text-muted-foreground' }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={iconColor}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-6 w-6 rounded" />
        </div>
      </CardContent>
    </Card>
  )
}

// Format number with French number separators
function formatNumber(num: number): string {
  return num.toLocaleString('fr-FR')
}

// Format duration in seconds
function formatDuration(seconds: number): string {
  if (seconds === 0) return '0s'
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <StatCard
        title="Participations totales"
        value={formatNumber(stats.totalParticipations)}
        icon={<Users className="h-6 w-6" />}
        iconColor="text-blue-500"
      />
      <StatCard
        title="Générations réussies"
        value={formatNumber(stats.successfulGenerations)}
        icon={<CheckCircle className="h-6 w-6" />}
        iconColor="text-green-500"
      />
      <StatCard
        title="Générations échouées"
        value={formatNumber(stats.failedGenerations)}
        icon={<XCircle className="h-6 w-6" />}
        iconColor="text-red-500"
      />
      <StatCard
        title="Taux de succès"
        value={`${stats.successRate}%`}
        icon={<Percent className="h-6 w-6" />}
        iconColor="text-purple-500"
      />
      <StatCard
        title="Temps moyen de génération"
        value={formatDuration(stats.averageGenerationTime)}
        icon={<Clock className="h-6 w-6" />}
        iconColor="text-orange-500"
      />
      <StatCard
        title="Emails envoyés"
        value={formatNumber(stats.emailsSent)}
        icon={<Mail className="h-6 w-6" />}
        iconColor="text-cyan-500"
      />
    </div>
  )
}
