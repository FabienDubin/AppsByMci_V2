'use client'

import { PipelineCanvas } from '@/components/pipeline/pipeline-canvas'

/**
 * Step 4: Pipeline de Traitement (Blocs Drag-and-Drop)
 * AC-3.6.1 to AC-3.6.10
 *
 * This component wraps PipelineCanvas which handles all the pipeline logic
 */
export function Step4Pipeline() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Étape 4 : Pipeline de Traitement</h2>
        <p className="text-muted-foreground mt-2">
          Composez un pipeline flexible en ajoutant des blocs de traitement. L&apos;ordre des blocs
          définit le processus de génération.
        </p>
      </div>

      <PipelineCanvas />
    </div>
  )
}
