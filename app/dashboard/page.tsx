'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useWizardStore } from '@/lib/stores/wizard.store'
import { LogoutButton } from '@/components/auth/logout-button'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'
import { Plus, MoreHorizontal, Pencil, Eye, Copy, Archive, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { AnimationResponse } from '@/lib/services/animation.service'

export default function DashboardPage() {
  const { user, getAccessToken } = useAuthStore()
  const { resetWizard } = useWizardStore()
  const router = useRouter()

  const [animations, setAnimations] = useState<AnimationResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch animations on mount
  useEffect(() => {
    const fetchAnimations = async () => {
      try {
        const token = getAccessToken()
        if (!token) {
          setError('Non authentifié')
          return
        }

        const response = await fetch('/api/animations', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.error?.message || 'Erreur lors du chargement')
        }

        setAnimations(result.data)
      } catch (err: any) {
        setError(err.message)
        toast.error('Erreur lors du chargement des animations')
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchAnimations()
    }
  }, [user, getAccessToken])

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
    resetWizard()
    router.push('/dashboard/animations/new')
  }

  // Handle editing an animation
  const handleEditAnimation = (id: string) => {
    router.push(`/dashboard/animations/${id}/edit`)
  }

  // Handle viewing an animation (future feature)
  const handleViewAnimation = (slug: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    window.open(`${baseUrl}/a/${slug}`, '_blank')
  }

  // Handle duplicating an animation (future feature - Story 3.11)
  const handleDuplicateAnimation = (_id: string) => {
    toast.info('Fonctionnalité à venir dans Story 3.11')
  }

  // Handle archiving an animation (future feature - Story 3.11)
  const handleArchiveAnimation = (_id: string) => {
    toast.info('Fonctionnalité à venir dans Story 3.11')
  }

  // Format date for display
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800">Publiée</Badge>
      case 'draft':
        return <Badge variant="outline">Brouillon</Badge>
      case 'archived':
        return <Badge variant="secondary">Archivée</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-6xl">
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

          {/* Animations section */}
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Mes Animations</h2>
              <Button onClick={handleCreateAnimation} className="gap-2">
                <Plus className="h-4 w-4" />
                Nouvelle animation
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Erreur : {error}</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => window.location.reload()}
                >
                  Réessayer
                </Button>
              </div>
            ) : animations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Aucune animation pour le moment.</p>
                <Button onClick={handleCreateAnimation} variant="outline" className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Créer ma première animation
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Créée le</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {animations.map((animation) => (
                    <TableRow key={animation.id}>
                      <TableCell className="font-medium">{animation.name}</TableCell>
                      <TableCell>{getStatusBadge(animation.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(animation.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Menu actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {animation.status === 'published' && (
                              <DropdownMenuItem
                                onClick={() => handleViewAnimation(animation.slug)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Voir
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleEditAnimation(animation.id)}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Éditer
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDuplicateAnimation(animation.id)}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Dupliquer
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleArchiveAnimation(animation.id)}
                              className="text-destructive"
                            >
                              <Archive className="h-4 w-4 mr-2" />
                              Archiver
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
