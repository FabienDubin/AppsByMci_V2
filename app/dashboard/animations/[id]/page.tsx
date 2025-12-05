'use client'

import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Pencil, Construction } from 'lucide-react'

/**
 * Animation Details Page - Placeholder for Story 5.2
 * This page will display animation statistics, timeline, and quick actions.
 */
export default function AnimationDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const animationId = params.id as string

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au dashboard
          </Button>
        </div>

        {/* Placeholder content */}
        <div className="rounded-lg border bg-card p-12 text-center">
          <Construction className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-4">Détails de l'animation</h1>
          <p className="text-muted-foreground mb-6">
            Cette page affichera les statistiques détaillées de l'animation,
            le graphique timeline des participations, et les actions rapides.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            ID: {animationId}
          </p>

          {/* Story 5.2 Preview */}
          <div className="bg-muted/50 rounded-lg p-6 mb-8 text-left">
            <h2 className="font-semibold mb-4">Fonctionnalités prévues (Story 5.2)</h2>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>- Header avec nom, badges statut, actions</li>
              <li>- Section infos générales avec slug cliquable, QR code téléchargeable</li>
              <li>- Stats cards : participations, réussies, échouées, taux succès, temps moyen, emails</li>
              <li>- Graphique timeline avec filtre période (7j/30j/all)</li>
              <li>- Boutons actions rapides vers résultats et exports</li>
            </ul>
          </div>

          {/* Quick action */}
          <Button
            onClick={() => router.push(`/dashboard/animations/${animationId}/edit`)}
            className="gap-2"
          >
            <Pencil className="h-4 w-4" />
            Éditer l'animation
          </Button>
        </div>
      </div>
    </div>
  )
}
