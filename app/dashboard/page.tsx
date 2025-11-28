'use client'

import { useAuthStore } from '@/lib/stores/auth.store'
import { useWizardStore } from '@/lib/stores/wizard.store'
import { LogoutButton } from '@/components/auth/logout-button'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { resetWizard } = useWizardStore()
  const router = useRouter()

  // AuthProvider ensures we're authenticated
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  // Handle creating a new animation
  const handleCreateAnimation = () => {
    resetWizard() // Reset wizard state before creating
    router.push('/dashboard/animations/new')
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <LogoutButton showConfirmation={true} />
        </div>

        <div className="grid gap-6">
          {/* User info card */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">Bienvenue, {user?.name || user?.email}</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>
                <strong>Email:</strong> {user?.email}
              </p>
              <p>
                <strong>Rôle:</strong> {user?.role}
              </p>
            </div>
          </div>

          {/* Actions card */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">Actions rapides</h2>
            <Button
              onClick={handleCreateAnimation}
              size="lg"
              className="gap-2"
            >
              <Plus className="h-5 w-5" />
              Créer une nouvelle animation
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
