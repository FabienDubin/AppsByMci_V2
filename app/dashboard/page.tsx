'use client'

import { useAuthStore } from '@/lib/stores/auth.store'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const { user, isAuthenticated, clearAuth } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  const handleLogout = () => {
    clearAuth()
    router.push('/login')
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>
            Déconnexion
          </Button>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">Bienvenue, {user?.name || user?.email}</h2>
          <div className="space-y-2 text-muted-foreground">
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Rôle:</strong> {user?.role}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
