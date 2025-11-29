'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useWizardStore, DEFAULT_PUBLIC_DISPLAY_CONFIG } from '@/lib/stores/wizard.store'
import { step6Schema } from '@/lib/schemas/animation.schema'

// Form values type for React Hook Form
interface PublicDisplayFormValues {
  publicDisplayConfig: {
    enabled: boolean
    layout: 'masonry' | 'grid' | 'carousel'
    columns?: number
    autoScroll?: boolean
    autoScrollSpeed?: 'slow' | 'medium' | 'fast'
    showParticipantName: boolean
    refreshInterval: number
  }
}

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible'
import { Monitor, Info, LayoutGrid, Columns, GalleryHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step6PublicDisplayProps {
  onValidationChange?: (isValid: boolean) => void
}

/**
 * Step 6: Public Display Configuration
 * Configures the gallery display screen for event display
 */
export function Step6PublicDisplay({ onValidationChange }: Step6PublicDisplayProps) {
  const { animationData, updateData } = useWizardStore()

  // Initialize form with stored data or defaults
  const form = useForm<PublicDisplayFormValues>({
    resolver: zodResolver(step6Schema),
    defaultValues: {
      publicDisplayConfig: {
        enabled: animationData.publicDisplayConfig?.enabled ?? DEFAULT_PUBLIC_DISPLAY_CONFIG.enabled,
        layout: animationData.publicDisplayConfig?.layout ?? DEFAULT_PUBLIC_DISPLAY_CONFIG.layout,
        columns: animationData.publicDisplayConfig?.columns ?? DEFAULT_PUBLIC_DISPLAY_CONFIG.columns,
        autoScroll: animationData.publicDisplayConfig?.autoScroll ?? DEFAULT_PUBLIC_DISPLAY_CONFIG.autoScroll,
        autoScrollSpeed: animationData.publicDisplayConfig?.autoScrollSpeed ?? DEFAULT_PUBLIC_DISPLAY_CONFIG.autoScrollSpeed,
        showParticipantName: animationData.publicDisplayConfig?.showParticipantName ?? DEFAULT_PUBLIC_DISPLAY_CONFIG.showParticipantName,
        refreshInterval: animationData.publicDisplayConfig?.refreshInterval ?? DEFAULT_PUBLIC_DISPLAY_CONFIG.refreshInterval,
      },
    },
    mode: 'onChange',
  })

  const { watch } = form
  const enabled = watch('publicDisplayConfig.enabled')
  const layout = watch('publicDisplayConfig.layout')
  const autoScroll = watch('publicDisplayConfig.autoScroll')

  // Sync form values to wizard store
  // This runs on mount AND on every form change
  useEffect(() => {
    // Sync initial values on mount
    const currentValues = form.getValues()
    if (currentValues.publicDisplayConfig) {
      updateData({
        publicDisplayConfig: {
          enabled: currentValues.publicDisplayConfig.enabled ?? true,
          layout: currentValues.publicDisplayConfig.layout ?? 'masonry',
          columns: currentValues.publicDisplayConfig.columns ?? 3,
          autoScroll: currentValues.publicDisplayConfig.autoScroll ?? true,
          autoScrollSpeed: currentValues.publicDisplayConfig.autoScrollSpeed ?? 'medium',
          showParticipantName: currentValues.publicDisplayConfig.showParticipantName ?? true,
          refreshInterval: currentValues.publicDisplayConfig.refreshInterval ?? 10,
        },
      })
    }

    // Subscribe to form changes
    const subscription = form.watch((value) => {
      if (value.publicDisplayConfig) {
        updateData({
          publicDisplayConfig: {
            enabled: value.publicDisplayConfig.enabled ?? true,
            layout: value.publicDisplayConfig.layout ?? 'masonry',
            columns: value.publicDisplayConfig.columns ?? 3,
            autoScroll: value.publicDisplayConfig.autoScroll ?? true,
            autoScrollSpeed: value.publicDisplayConfig.autoScrollSpeed ?? 'medium',
            showParticipantName: value.publicDisplayConfig.showParticipantName ?? true,
            refreshInterval: value.publicDisplayConfig.refreshInterval ?? 10,
          },
        })
      }
    })
    return () => subscription.unsubscribe()
  }, [form, updateData])

  // Report validation state to parent
  useEffect(() => {
    const isValid = form.formState.isValid
    onValidationChange?.(isValid)
  }, [form.formState.isValid, onValidationChange])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Monitor className="h-6 w-6" />
          Étape 6 : Écran Public
        </h2>
        <p className="text-muted-foreground mt-2">
          Configure l&apos;affichage des résultats sur l&apos;écran public de l&apos;événement (galerie).
        </p>
      </div>

      <Form {...form}>
        <form className="space-y-6">
          {/* Enable Toggle */}
          <FormField
            control={form.control}
            name="publicDisplayConfig.enabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Activer l&apos;écran public</FormLabel>
                  <FormDescription>
                    Affiche les résultats générés sur un écran de présentation accessible via une URL dédiée
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Configuration Section (Collapsible) */}
          <Collapsible open={enabled} className="space-y-4">
            <CollapsibleContent className="space-y-6">
              {/* Layout Selection */}
              <FormField
                control={form.control}
                name="publicDisplayConfig.layout"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Type d&apos;affichage</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-3 gap-4"
                      >
                        {/* Masonry */}
                        <FormItem>
                          <FormControl>
                            <label
                              className={cn(
                                'flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-all hover:bg-accent',
                                field.value === 'masonry' && 'border-primary bg-primary/5'
                              )}
                            >
                              <RadioGroupItem value="masonry" className="sr-only" />
                              <LayoutGrid className="h-8 w-8 mb-2" />
                              <span className="font-medium">Masonry</span>
                              <span className="text-xs text-muted-foreground text-center">
                                Grille dynamique
                              </span>
                            </label>
                          </FormControl>
                        </FormItem>

                        {/* Grid */}
                        <FormItem>
                          <FormControl>
                            <label
                              className={cn(
                                'flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-all hover:bg-accent',
                                field.value === 'grid' && 'border-primary bg-primary/5'
                              )}
                            >
                              <RadioGroupItem value="grid" className="sr-only" />
                              <Columns className="h-8 w-8 mb-2" />
                              <span className="font-medium">Grille</span>
                              <span className="text-xs text-muted-foreground text-center">
                                Taille uniforme
                              </span>
                            </label>
                          </FormControl>
                        </FormItem>

                        {/* Carousel */}
                        <FormItem>
                          <FormControl>
                            <label
                              className={cn(
                                'flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-all hover:bg-accent',
                                field.value === 'carousel' && 'border-primary bg-primary/5'
                              )}
                            >
                              <RadioGroupItem value="carousel" className="sr-only" />
                              <GalleryHorizontal className="h-8 w-8 mb-2" />
                              <span className="font-medium">Carrousel</span>
                              <span className="text-xs text-muted-foreground text-center">
                                Défilement plein écran
                              </span>
                            </label>
                          </FormControl>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Columns (only for Masonry/Grid) */}
              {layout !== 'carousel' && (
                <FormField
                  control={form.control}
                  name="publicDisplayConfig.columns"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de colonnes: {field.value}</FormLabel>
                      <FormControl>
                        <Slider
                          min={2}
                          max={5}
                          step={1}
                          value={[field.value ?? 3]}
                          onValueChange={([value]) => field.onChange(value)}
                          className="w-full"
                        />
                      </FormControl>
                      <FormDescription>
                        De 2 à 5 colonnes selon la taille de l&apos;écran
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Auto-scroll (only for Masonry/Grid) */}
              {layout !== 'carousel' && (
                <FormField
                  control={form.control}
                  name="publicDisplayConfig.autoScroll"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Défilement automatique</FormLabel>
                        <FormDescription>
                          Fait défiler automatiquement la galerie pour montrer toutes les images
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}

              {/* Auto-scroll Speed (only if auto-scroll enabled) */}
              {layout !== 'carousel' && autoScroll && (
                <FormField
                  control={form.control}
                  name="publicDisplayConfig.autoScrollSpeed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vitesse de défilement</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner la vitesse" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="slow">Lent</SelectItem>
                          <SelectItem value="medium">Moyen</SelectItem>
                          <SelectItem value="fast">Rapide</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Show Participant Name */}
              <FormField
                control={form.control}
                name="publicDisplayConfig.showParticipantName"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Afficher le nom du participant</FormLabel>
                      <FormDescription>
                        Affiche le nom sous chaque image générée
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Refresh Interval */}
              <FormField
                control={form.control}
                name="publicDisplayConfig.refreshInterval"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Intervalle de rafraîchissement: {field.value}s</FormLabel>
                    <FormControl>
                      <Slider
                        min={5}
                        max={60}
                        step={5}
                        value={[field.value ?? 10]}
                        onValueChange={([value]) => field.onChange(value)}
                        className="w-full"
                      />
                    </FormControl>
                    <FormDescription>
                      Fréquence de vérification des nouvelles images (5 à 60 secondes)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CollapsibleContent>
          </Collapsible>

          {/* Info when disabled */}
          {!enabled && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                L&apos;écran public est désactivé. Les résultats ne seront pas affichés sur un écran de présentation.
                Tu peux passer à l&apos;étape suivante.
              </AlertDescription>
            </Alert>
          )}
        </form>
      </Form>
    </div>
  )
}
