'use client'

// Timeline Chart Component (Story 5.2 AC4)
// Displays participations per day with recharts and period selector
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Calendar, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { AnimationTimeline, TimelinePeriod } from '../_hooks/use-animation-timeline'

interface TimelineChartProps {
  timeline: AnimationTimeline | null
  loading?: boolean
  period: TimelinePeriod
  onPeriodChange: (period: TimelinePeriod) => void
}

// Format date for display (e.g., "05 déc")
function formatChartDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

// Custom tooltip component
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null

  const date = new Date(label)
  const formattedDate = date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="bg-popover border rounded-lg shadow-md p-3">
      <p className="text-sm text-muted-foreground mb-1">{formattedDate}</p>
      <p className="text-sm font-semibold">
        {payload[0].value} participation{payload[0].value > 1 ? 's' : ''}
      </p>
    </div>
  )
}

export function TimelineChart({ timeline, loading, period, onPeriodChange }: TimelineChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Participations par jour
          </CardTitle>
          <Skeleton className="h-9 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    )
  }

  const hasData = timeline && timeline.data && timeline.data.length > 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Participations par jour
        </CardTitle>
        <Tabs value={period} onValueChange={(v) => onPeriodChange(v as TimelinePeriod)}>
          <TabsList>
            <TabsTrigger value="7d">7 jours</TabsTrigger>
            <TabsTrigger value="30d">30 jours</TabsTrigger>
            <TabsTrigger value="all">Tout</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={timeline.data}
                margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatChartDate}
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[250px] flex flex-col items-center justify-center text-muted-foreground">
            <Calendar className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">Aucune participation sur cette période</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
