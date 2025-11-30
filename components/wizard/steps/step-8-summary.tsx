'use client'

import { useMemo } from 'react'
import { useWizardStore } from '@/lib/stores/wizard.store'
import { generateSummary, getLayoutDisplayName, getScrollSpeedDisplayName, getThemeDisplayName, getInputTypeDisplayName } from '@/lib/utils/animation-summary'
import { isSectionComplete } from '@/lib/services/animation-validation.service'
import { SummaryCard, SummaryItem, ColorPreview } from '@/components/wizard/summary-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Check, AlertTriangle, Copy, Camera, Mail, Monitor, Palette, Settings, Layers } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface Step8SummaryProps {
  onGoToStep: (step: number) => void
}

/**
 * Step 8 Summary Component
 * Displays a complete recap of the animation configuration
 * with 7 sections matching Steps 1-7 of the wizard
 */
export function Step8Summary({ onGoToStep }: Step8SummaryProps) {
  const { animationData } = useWizardStore()

  // Generate summary from animation data
  const summary = useMemo(() => generateSummary(animationData), [animationData])

  // Get error for each section
  const getErrorForSection = (section: string): string | undefined => {
    const error = summary.validationErrors.find((e) => e.section === section)
    return error?.message
  }

  // Copy slug URL to clipboard
  const copySlugUrl = () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://appsbymci.com'
    const url = `${baseUrl}/a/${summary.generalInfo.slug}`
    navigator.clipboard.writeText(url)
    toast.success('URL copiée dans le presse-papier')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Récapitulatif & Publication</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Vérifiez votre configuration avant de publier
        </p>
      </div>

      {/* Global validation status */}
      {summary.isComplete ? (
        <Alert className="border-green-200 bg-green-50">
          <Check className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Configuration complète</AlertTitle>
          <AlertDescription className="text-green-700">
            Votre animation est prête à être publiée ou sauvegardée comme brouillon.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800">Configuration incomplète</AlertTitle>
          <AlertDescription className="text-orange-700">
            Veuillez corriger les erreurs ci-dessous avant de publier.
            Vous pouvez toujours sauvegarder comme brouillon.
            <ul className="mt-2 list-disc list-inside">
              {summary.validationErrors.map((error, index) => (
                <li key={index}>{error.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Summary cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Section 1: General Info */}
        <SummaryCard
          title="Informations Générales"
          stepNumber={1}
          isComplete={isSectionComplete(animationData, 'generalInfo')}
          onEdit={() => onGoToStep(1)}
          error={getErrorForSection('generalInfo')}
        >
          <dl className="space-y-3">
            <SummaryItem
              label="Nom"
              value={summary.generalInfo.name || <span className="text-muted-foreground">Non défini</span>}
            />
            <SummaryItem
              label="Description"
              value={summary.generalInfo.description || <span className="text-muted-foreground">Aucune description</span>}
            />
            <div>
              <dt className="text-sm font-medium text-muted-foreground">URL publique</dt>
              <dd className="mt-0.5 flex items-center gap-2">
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {process.env.NEXT_PUBLIC_APP_URL || 'https://appsbymci.com'}/a/{summary.generalInfo.slug || '...'}
                </code>
                {summary.generalInfo.slug && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2"
                    onClick={copySlugUrl}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                )}
              </dd>
            </div>
          </dl>
        </SummaryCard>

        {/* Section 2: Access Config */}
        <SummaryCard
          title="Configuration d'Accès"
          stepNumber={2}
          isComplete={isSectionComplete(animationData, 'accessConfig')}
          onEdit={() => onGoToStep(2)}
        >
          <dl className="space-y-3">
            <SummaryItem
              label="Type de validation"
              value={
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  {summary.accessConfig.displayText}
                </div>
              }
            />
          </dl>
        </SummaryCard>

        {/* Section 3: Data Collection */}
        <SummaryCard
          title="Collecte de Données"
          stepNumber={3}
          isComplete={isSectionComplete(animationData, 'dataCollection')}
          onEdit={() => onGoToStep(3)}
          error={getErrorForSection('dataCollection')}
          className="md:col-span-2"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Champs de base</h4>
              <ul className="space-y-1 text-sm">
                {summary.dataCollection.baseFields.map((field) => (
                  <li key={field.fieldType} className="flex items-center gap-2">
                    {field.active ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <span className="h-4 w-4 text-muted-foreground">-</span>
                    )}
                    <span className={!field.active ? 'text-muted-foreground' : ''}>
                      {field.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Inputs avancés</h4>
              {summary.dataCollection.selfieRequired && (
                <div className="flex items-center gap-2 text-sm mb-2">
                  <Camera className="h-4 w-4 text-green-600" />
                  <span>Selfie requis</span>
                </div>
              )}
              {summary.dataCollection.advancedInputsCount > 0 ? (
                <ul className="space-y-1 text-sm">
                  {summary.dataCollection.advancedInputs.map((input, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>{input.label}</span>
                      <Badge variant="outline" className="text-xs">
                        {getInputTypeDisplayName(input.type)}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                !summary.dataCollection.selfieRequired && (
                  <span className="text-muted-foreground text-sm">Aucune question configurée</span>
                )
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t">
            <Badge variant="secondary">
              {summary.dataCollection.totalFields} champ{summary.dataCollection.totalFields > 1 ? 's' : ''} à collecter au total
            </Badge>
          </div>
        </SummaryCard>

        {/* Section 4: Pipeline */}
        <SummaryCard
          title="Pipeline de Traitement"
          stepNumber={4}
          isComplete={isSectionComplete(animationData, 'pipeline')}
          onEdit={() => onGoToStep(4)}
          error={getErrorForSection('pipeline')}
        >
          <dl className="space-y-3">
            <SummaryItem
              label="Nombre de blocs"
              value={`${summary.pipeline.blocksCount} bloc${summary.pipeline.blocksCount > 1 ? 's' : ''}`}
            />
            <SummaryItem
              label="Modèle IA"
              value={
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  {summary.pipeline.aiModel}
                </div>
              }
            />
            {summary.pipeline.blocks.length > 0 && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground mb-1">Blocs configurés</dt>
                <dd>
                  <ol className="space-y-1 text-sm list-decimal list-inside">
                    {summary.pipeline.blocks.map((block, index) => (
                      <li key={index}>
                        <span className="text-muted-foreground">{block.type}:</span>{' '}
                        {block.summary}
                      </li>
                    ))}
                  </ol>
                </dd>
              </div>
            )}
          </dl>
        </SummaryCard>

        {/* Section 5: Email */}
        <SummaryCard
          title="Configuration Email"
          stepNumber={5}
          isComplete={isSectionComplete(animationData, 'email')}
          onEdit={() => onGoToStep(5)}
        >
          <dl className="space-y-3">
            <SummaryItem
              label="Envoi d'emails"
              value={
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {summary.email.enabled ? (
                    <Badge className="bg-green-100 text-green-800">Activé</Badge>
                  ) : (
                    <Badge variant="outline">Désactivé</Badge>
                  )}
                </div>
              }
            />
            {summary.email.enabled && (
              <>
                <SummaryItem
                  label="Sujet"
                  value={summary.email.subject || <span className="text-muted-foreground">Non défini</span>}
                />
                <SummaryItem
                  label="Variables dynamiques"
                  value={`${summary.email.variablesCount || 0} variable${(summary.email.variablesCount || 0) > 1 ? 's' : ''}`}
                />
              </>
            )}
          </dl>
        </SummaryCard>

        {/* Section 6: Public Display */}
        <SummaryCard
          title="Écran Public"
          stepNumber={6}
          isComplete={isSectionComplete(animationData, 'publicDisplay')}
          onEdit={() => onGoToStep(6)}
        >
          <dl className="space-y-3">
            <SummaryItem
              label="Écran public"
              value={
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                  {summary.publicDisplay.enabled ? (
                    <Badge className="bg-green-100 text-green-800">Activé</Badge>
                  ) : (
                    <Badge variant="outline">Désactivé</Badge>
                  )}
                </div>
              }
            />
            {summary.publicDisplay.enabled && (
              <>
                <SummaryItem
                  label="Layout"
                  value={getLayoutDisplayName(summary.publicDisplay.layout || 'masonry')}
                />
                {summary.publicDisplay.layout !== 'carousel' && (
                  <SummaryItem
                    label="Colonnes"
                    value={summary.publicDisplay.columns}
                  />
                )}
                <SummaryItem
                  label="Auto-scroll"
                  value={
                    summary.publicDisplay.autoScroll
                      ? `Oui (${getScrollSpeedDisplayName(summary.publicDisplay.autoScrollSpeed || 'medium')})`
                      : 'Non'
                  }
                />
                <SummaryItem
                  label="Rafraîchissement"
                  value={`Toutes les ${summary.publicDisplay.refreshInterval} secondes`}
                />
              </>
            )}
          </dl>
        </SummaryCard>

        {/* Section 7: Customization */}
        <SummaryCard
          title="Personnalisation"
          stepNumber={7}
          isComplete={isSectionComplete(animationData, 'customization')}
          onEdit={() => onGoToStep(7)}
        >
          <dl className="space-y-3">
            <div className="flex gap-4">
              <div className="flex-1">
                <dt className="text-sm font-medium text-muted-foreground mb-1">Couleur primaire</dt>
                <dd>
                  <ColorPreview color={summary.customization.primaryColor} />
                </dd>
              </div>
              <div className="flex-1">
                <dt className="text-sm font-medium text-muted-foreground mb-1">Couleur secondaire</dt>
                <dd>
                  <ColorPreview color={summary.customization.secondaryColor} />
                </dd>
              </div>
            </div>

            <SummaryItem
              label="Logo"
              value={
                summary.customization.hasLogo ? (
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded border bg-muted overflow-hidden">
                      <Image
                        src={summary.customization.logoUrl || ''}
                        alt="Logo"
                        width={40}
                        height={40}
                        className="object-contain w-full h-full"
                      />
                    </div>
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Uploadé</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Non fourni</span>
                )
              }
            />

            <SummaryItem
              label="Thème"
              value={
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  {getThemeDisplayName(summary.customization.theme)}
                </div>
              }
            />

            <SummaryItem
              label="Messages de chargement"
              value={`${summary.customization.loadingMessagesCount} messages configurés`}
            />
          </dl>
        </SummaryCard>
      </div>
    </div>
  )
}
