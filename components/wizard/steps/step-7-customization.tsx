'use client'

import { useEffect, useCallback, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useWizardStore, DEFAULT_CUSTOMIZATION, DEFAULT_LOADING_MESSAGES, DEFAULT_TEXT_CARD } from '@/lib/stores/wizard.store'
import { step7Schema } from '@/lib/schemas/animation.schema'
import type { TextCard } from '@/lib/stores/wizard.store'

// Form values type for React Hook Form
interface CustomizationFormValues {
  customization: {
    primaryColor: string
    secondaryColor: string
    logo?: string
    backgroundImage?: string
    backgroundColor?: string
    backgroundColorOpacity?: number
    textCard?: TextCard
    theme: 'light' | 'dark' | 'auto'
    welcomeMessage?: string
    submissionMessage: string
    loadingMessages: string[]
    thankYouMessage: string
  }
}
import {
  parseLoadingMessages,
  messagesToText,
  validateLoadingMessages,
  getLoadingMessagesCountLabel,
} from '@/lib/utils/loading-messages'

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { ColorPicker } from '@/components/ui/color-picker'
import { ImageUpload } from '@/components/ui/image-upload'
import { CustomizationPreview } from '@/components/wizard/customization-preview'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Palette, ChevronDown, Info, Sun, Moon, Monitor, Image as ImageIcon, Type, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step7CustomizationProps {
  onValidationChange?: (isValid: boolean) => void
}

/**
 * Step 7: Customization
 * Branding and personalization configuration
 */
export function Step7Customization({ onValidationChange }: Step7CustomizationProps) {
  const { getAccessToken } = useAuthStore()
  const { animationData, updateData } = useWizardStore()

  // Collapsible sections state
  const [openSections, setOpenSections] = useState({
    colors: true,
    background: true,
    textCard: true,
    messages: true,
  })

  // Loading messages as text state
  const [loadingMessagesText, setLoadingMessagesText] = useState(
    messagesToText(animationData.customization?.loadingMessages ?? DEFAULT_LOADING_MESSAGES)
  )
  const [loadingMessagesError, setLoadingMessagesError] = useState<string | null>(null)

  // Initialize form with stored data or defaults
  const form = useForm<CustomizationFormValues>({
    resolver: zodResolver(step7Schema),
    defaultValues: {
      customization: {
        primaryColor: animationData.customization?.primaryColor ?? DEFAULT_CUSTOMIZATION.primaryColor,
        secondaryColor: animationData.customization?.secondaryColor ?? DEFAULT_CUSTOMIZATION.secondaryColor,
        logo: animationData.customization?.logo,
        backgroundImage: animationData.customization?.backgroundImage,
        backgroundColor: animationData.customization?.backgroundColor,
        backgroundColorOpacity: animationData.customization?.backgroundColorOpacity ?? DEFAULT_CUSTOMIZATION.backgroundColorOpacity,
        textCard: animationData.customization?.textCard ?? DEFAULT_TEXT_CARD,
        theme: animationData.customization?.theme ?? DEFAULT_CUSTOMIZATION.theme,
        welcomeMessage: animationData.customization?.welcomeMessage,
        submissionMessage: animationData.customization?.submissionMessage ?? DEFAULT_CUSTOMIZATION.submissionMessage,
        loadingMessages: animationData.customization?.loadingMessages ?? DEFAULT_CUSTOMIZATION.loadingMessages,
        thankYouMessage: animationData.customization?.thankYouMessage ?? DEFAULT_CUSTOMIZATION.thankYouMessage,
      },
    },
    mode: 'onChange',
  })

  const { watch, setValue } = form
  const watchedCustomization = watch('customization')
  const backgroundImage = watch('customization.backgroundImage')
  const backgroundColor = watch('customization.backgroundColor')
  const textCardEnabled = watch('customization.textCard.enabled')
  // Watch all textCard fields for real-time preview updates
  const textCardBackgroundColor = watch('customization.textCard.backgroundColor')
  const textCardOpacity = watch('customization.textCard.opacity')
  const textCardBorderRadius = watch('customization.textCard.borderRadius')
  const textCardPadding = watch('customization.textCard.padding')

  // Check if no background is configured
  const hasNoBackground = !backgroundImage && !backgroundColor

  // Handle loading messages text change
  const handleLoadingMessagesChange = useCallback((text: string) => {
    setLoadingMessagesText(text)
    const messages = parseLoadingMessages(text)
    const validation = validateLoadingMessages(messages)

    if (!validation.isValid) {
      setLoadingMessagesError(validation.error || null)
      // Still update the value so user can see their input
      setValue('customization.loadingMessages', messages.length > 0 ? messages : DEFAULT_LOADING_MESSAGES)
    } else {
      setLoadingMessagesError(null)
      setValue('customization.loadingMessages', messages)
    }
  }, [setValue])

  // Get auth token from store
  const getAuthToken = useCallback(async (): Promise<string | null> => {
    return getAccessToken()
  }, [getAccessToken])

  // Sync form values to wizard store
  // This runs on mount AND on every form change
  useEffect(() => {
    // Sync initial values on mount
    const currentValues = form.getValues()
    if (currentValues.customization) {
      updateData({
        customization: {
          primaryColor: currentValues.customization.primaryColor ?? DEFAULT_CUSTOMIZATION.primaryColor,
          secondaryColor: currentValues.customization.secondaryColor ?? DEFAULT_CUSTOMIZATION.secondaryColor,
          logo: currentValues.customization.logo,
          backgroundImage: currentValues.customization.backgroundImage,
          backgroundColor: currentValues.customization.backgroundColor,
          backgroundColorOpacity: currentValues.customization.backgroundColorOpacity ?? DEFAULT_CUSTOMIZATION.backgroundColorOpacity,
          textCard: currentValues.customization.textCard ?? DEFAULT_TEXT_CARD,
          theme: currentValues.customization.theme ?? DEFAULT_CUSTOMIZATION.theme,
          welcomeMessage: currentValues.customization.welcomeMessage,
          submissionMessage: currentValues.customization.submissionMessage ?? DEFAULT_CUSTOMIZATION.submissionMessage,
          loadingMessages: (currentValues.customization.loadingMessages?.filter((m): m is string => m !== undefined) ?? DEFAULT_CUSTOMIZATION.loadingMessages),
          thankYouMessage: currentValues.customization.thankYouMessage ?? DEFAULT_CUSTOMIZATION.thankYouMessage,
        },
      })
    }

    // Subscribe to form changes
    const subscription = form.watch((value) => {
      if (value.customization) {
        updateData({
          customization: {
            primaryColor: value.customization.primaryColor ?? DEFAULT_CUSTOMIZATION.primaryColor,
            secondaryColor: value.customization.secondaryColor ?? DEFAULT_CUSTOMIZATION.secondaryColor,
            logo: value.customization.logo,
            backgroundImage: value.customization.backgroundImage,
            backgroundColor: value.customization.backgroundColor,
            backgroundColorOpacity: value.customization.backgroundColorOpacity ?? DEFAULT_CUSTOMIZATION.backgroundColorOpacity,
            textCard: value.customization.textCard as TextCard ?? DEFAULT_TEXT_CARD,
            theme: value.customization.theme ?? DEFAULT_CUSTOMIZATION.theme,
            welcomeMessage: value.customization.welcomeMessage,
            submissionMessage: value.customization.submissionMessage ?? DEFAULT_CUSTOMIZATION.submissionMessage,
            loadingMessages: (value.customization.loadingMessages?.filter((m): m is string => m !== undefined) ?? DEFAULT_CUSTOMIZATION.loadingMessages),
            thankYouMessage: value.customization.thankYouMessage ?? DEFAULT_CUSTOMIZATION.thankYouMessage,
          },
        })
      }
    })
    return () => subscription.unsubscribe()
  }, [form, updateData])

  // Report validation state to parent
  useEffect(() => {
    // Form is valid if no schema errors AND no loading messages errors
    const isValid = form.formState.isValid && !loadingMessagesError
    onValidationChange?.(isValid)
  }, [form.formState.isValid, loadingMessagesError, onValidationChange])

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Palette className="h-6 w-6" />
          Étape 7 : Personnalisation
        </h2>
        <p className="text-muted-foreground mt-2">
          Personnalise l&apos;apparence et les messages de ton animation pour correspondre à ton événement.
        </p>
      </div>

      <Form {...form}>
        <form className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Form Column (60%) */}
            <div className="lg:col-span-3 space-y-4">
              {/* Colors Section */}
              <Collapsible open={openSections.colors} onOpenChange={() => toggleSection('colors')}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardTitle className="flex items-center justify-between text-lg">
                        <span className="flex items-center gap-2">
                          <Palette className="h-5 w-5" />
                          Couleurs
                        </span>
                        <ChevronDown
                          className={cn(
                            'h-5 w-5 transition-transform',
                            openSections.colors && 'rotate-180'
                          )}
                        />
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      {/* Primary Color */}
                      <Controller
                        name="customization.primaryColor"
                        control={form.control}
                        render={({ field }) => (
                          <ColorPicker
                            value={field.value}
                            onChange={field.onChange}
                            label="Couleur principale"
                            helpText="Utilisée pour les boutons et éléments d'action"
                          />
                        )}
                      />

                      {/* Secondary Color */}
                      <Controller
                        name="customization.secondaryColor"
                        control={form.control}
                        render={({ field }) => (
                          <ColorPicker
                            value={field.value}
                            onChange={field.onChange}
                            label="Couleur secondaire"
                            helpText="Utilisée pour les textes secondaires et bordures"
                          />
                        )}
                      />

                      {/* Theme */}
                      <FormField
                        control={form.control}
                        name="customization.theme"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Thème</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="grid grid-cols-3 gap-4"
                              >
                                <FormItem>
                                  <FormControl>
                                    <label
                                      className={cn(
                                        'flex flex-col items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-all hover:bg-accent',
                                        field.value === 'light' && 'border-primary bg-primary/5'
                                      )}
                                    >
                                      <RadioGroupItem value="light" className="sr-only" />
                                      <Sun className="h-5 w-5 mb-1" />
                                      <span className="text-sm">Clair</span>
                                    </label>
                                  </FormControl>
                                </FormItem>
                                <FormItem>
                                  <FormControl>
                                    <label
                                      className={cn(
                                        'flex flex-col items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-all hover:bg-accent',
                                        field.value === 'dark' && 'border-primary bg-primary/5'
                                      )}
                                    >
                                      <RadioGroupItem value="dark" className="sr-only" />
                                      <Moon className="h-5 w-5 mb-1" />
                                      <span className="text-sm">Sombre</span>
                                    </label>
                                  </FormControl>
                                </FormItem>
                                <FormItem>
                                  <FormControl>
                                    <label
                                      className={cn(
                                        'flex flex-col items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-all hover:bg-accent',
                                        field.value === 'auto' && 'border-primary bg-primary/5'
                                      )}
                                    >
                                      <RadioGroupItem value="auto" className="sr-only" />
                                      <Monitor className="h-5 w-5 mb-1" />
                                      <span className="text-sm">Auto</span>
                                    </label>
                                  </FormControl>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Background Section */}
              <Collapsible open={openSections.background} onOpenChange={() => toggleSection('background')}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardTitle className="flex items-center justify-between text-lg">
                        <span className="flex items-center gap-2">
                          <ImageIcon className="h-5 w-5" />
                          Fond
                          {hasNoBackground && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
                              <AlertTriangle className="mr-1 h-3 w-3" />
                              Non configuré
                            </span>
                          )}
                        </span>
                        <ChevronDown
                          className={cn(
                            'h-5 w-5 transition-transform',
                            openSections.background && 'rotate-180'
                          )}
                        />
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-6">
                      {/* Warning if no background */}
                      {hasNoBackground && (
                        <Alert variant="default" className="border-orange-200 bg-orange-50">
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                          <AlertDescription className="text-orange-800">
                            Aucun fond n&apos;est configuré. L&apos;animation utilisera le fond par défaut du thème.
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Logo Upload */}
                      <Controller
                        name="customization.logo"
                        control={form.control}
                        render={({ field }) => (
                          <ImageUpload
                            value={field.value}
                            onChange={field.onChange}
                            uploadEndpoint="/api/uploads/logo"
                            acceptedTypes={['image/png', 'image/jpeg', 'image/svg+xml']}
                            maxSize={2 * 1024 * 1024}
                            label="Logo"
                            helpText="PNG, JPG ou SVG. Max 2MB."
                            previewHeight={80}
                            getAuthToken={getAuthToken}
                          />
                        )}
                      />

                      {/* Background Image Upload */}
                      <Controller
                        name="customization.backgroundImage"
                        control={form.control}
                        render={({ field }) => (
                          <ImageUpload
                            value={field.value}
                            onChange={field.onChange}
                            uploadEndpoint="/api/uploads/background"
                            acceptedTypes={['image/png', 'image/jpeg']}
                            maxSize={5 * 1024 * 1024}
                            label="Image de fond"
                            helpText="PNG ou JPG. Max 5MB. Sera affichée en arrière-plan."
                            previewWidth={300}
                            previewHeight={180}
                            getAuthToken={getAuthToken}
                          />
                        )}
                      />

                      {/* Background Color with Color Picker */}
                      <Controller
                        name="customization.backgroundColor"
                        control={form.control}
                        render={({ field }) => (
                          <ColorPicker
                            value={field.value || '#1a1a2e'}
                            onChange={field.onChange}
                            label="Couleur de fond (overlay)"
                            helpText={backgroundImage
                              ? "Cette couleur sera superposée à l'image de fond avec l'opacité définie ci-dessous"
                              : "Cette couleur sera utilisée comme fond si aucune image n'est définie"
                            }
                          />
                        )}
                      />

                      {/* Background Color Opacity (only if background image exists) */}
                      {backgroundImage && (
                        <FormField
                          control={form.control}
                          name="customization.backgroundColorOpacity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Opacité de l&apos;overlay: {field.value ?? 50}%</FormLabel>
                              <FormControl>
                                <Slider
                                  min={0}
                                  max={100}
                                  step={5}
                                  value={[field.value ?? 50]}
                                  onValueChange={([value]) => field.onChange(value)}
                                  className="w-full"
                                />
                              </FormControl>
                              <FormDescription>
                                Permet de teinter l&apos;image de fond avec la couleur sélectionnée
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Text Card Section */}
              <Collapsible open={openSections.textCard} onOpenChange={() => toggleSection('textCard')}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardTitle className="flex items-center justify-between text-lg">
                        <span className="flex items-center gap-2">
                          <Type className="h-5 w-5" />
                          Carte de contenu
                        </span>
                        <ChevronDown
                          className={cn(
                            'h-5 w-5 transition-transform',
                            openSections.textCard && 'rotate-180'
                          )}
                        />
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        La carte de contenu garantit la lisibilité du texte sur n&apos;importe quel fond.
                        Elle sera utilisée pour les questions, le selfie et les résultats.
                      </p>

                      {/* Enable Toggle */}
                      <FormField
                        control={form.control}
                        name="customization.textCard.enabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Activer la carte</FormLabel>
                              <FormDescription>
                                Affiche le contenu dans une carte semi-transparente
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

                      {/* Card Configuration (only if enabled) */}
                      {textCardEnabled && (
                        <div className="space-y-4 pt-2">
                          {/* Card Background Color */}
                          <Controller
                            name="customization.textCard.backgroundColor"
                            control={form.control}
                            render={({ field }) => (
                              <ColorPicker
                                value={field.value || '#FFFFFF'}
                                onChange={field.onChange}
                                label="Couleur de la carte"
                                helpText="Couleur de fond de la carte de contenu"
                              />
                            )}
                          />

                          {/* Card Opacity */}
                          <FormField
                            control={form.control}
                            name="customization.textCard.opacity"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Opacité: {field.value ?? 90}%</FormLabel>
                                <FormControl>
                                  <Slider
                                    min={0}
                                    max={100}
                                    step={5}
                                    value={[field.value ?? 90]}
                                    onValueChange={([value]) => field.onChange(value)}
                                    className="w-full"
                                  />
                                </FormControl>
                                <FormDescription>
                                  0% = transparent, 100% = opaque
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Card Border Radius */}
                          <FormField
                            control={form.control}
                            name="customization.textCard.borderRadius"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Arrondi des coins: {field.value ?? 12}px</FormLabel>
                                <FormControl>
                                  <Slider
                                    min={0}
                                    max={24}
                                    step={2}
                                    value={[field.value ?? 12]}
                                    onValueChange={([value]) => field.onChange(value)}
                                    className="w-full"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Card Padding */}
                          <FormField
                            control={form.control}
                            name="customization.textCard.padding"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Espacement interne: {field.value ?? 16}px</FormLabel>
                                <FormControl>
                                  <Slider
                                    min={8}
                                    max={32}
                                    step={4}
                                    value={[field.value ?? 16]}
                                    onValueChange={([value]) => field.onChange(value)}
                                    className="w-full"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Messages Section */}
              <Collapsible open={openSections.messages} onOpenChange={() => toggleSection('messages')}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardTitle className="flex items-center justify-between text-lg">
                        <span>Messages personnalisés</span>
                        <ChevronDown
                          className={cn(
                            'h-5 w-5 transition-transform',
                            openSections.messages && 'rotate-180'
                          )}
                        />
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      {/* Welcome Message */}
                      <FormField
                        control={form.control}
                        name="customization.welcomeMessage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message de bienvenue (optionnel)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ''}
                                placeholder="Bienvenue à notre événement !"
                                maxLength={200}
                              />
                            </FormControl>
                            <FormDescription>
                              Affiché en haut du formulaire. Max 200 caractères.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Submission Message */}
                      <FormField
                        control={form.control}
                        name="customization.submissionMessage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message après soumission</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Merci ! Votre résultat arrive..."
                                maxLength={100}
                              />
                            </FormControl>
                            <FormDescription>
                              Affiché juste après l&apos;envoi du formulaire. Max 100 caractères.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Loading Messages */}
                      <div className="space-y-2">
                        <FormLabel className="flex items-center justify-between">
                          <span>Messages de chargement</span>
                          <span className="text-sm text-muted-foreground">
                            {getLoadingMessagesCountLabel(parseLoadingMessages(loadingMessagesText))}
                          </span>
                        </FormLabel>
                        <Textarea
                          value={loadingMessagesText}
                          onChange={(e) => handleLoadingMessagesChange(e.target.value)}
                          placeholder={DEFAULT_LOADING_MESSAGES.join('\n')}
                          rows={5}
                          className={cn(loadingMessagesError && 'border-destructive')}
                        />
                        <p className="text-sm text-muted-foreground">
                          Un message par ligne. Min 3, max 10 messages. Chaque max 100 caractères.
                        </p>
                        {loadingMessagesError && (
                          <p className="text-sm text-destructive">{loadingMessagesError}</p>
                        )}
                      </div>

                      {/* Thank You Message */}
                      <FormField
                        control={form.control}
                        name="customization.thankYouMessage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message de remerciement</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Merci d'avoir participé !"
                                maxLength={100}
                              />
                            </FormControl>
                            <FormDescription>
                              Affiché après la génération. Max 100 caractères.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </div>

            {/* Preview Column (40%) */}
            <div className="lg:col-span-2">
              <div className="sticky top-4">
                <CustomizationPreview
                  customization={{
                    ...watchedCustomization,
                    // Override textCard with directly watched values for real-time updates
                    textCard: {
                      enabled: textCardEnabled ?? DEFAULT_TEXT_CARD.enabled,
                      backgroundColor: textCardBackgroundColor ?? DEFAULT_TEXT_CARD.backgroundColor,
                      opacity: textCardOpacity ?? DEFAULT_TEXT_CARD.opacity,
                      borderRadius: textCardBorderRadius ?? DEFAULT_TEXT_CARD.borderRadius,
                      padding: textCardPadding ?? DEFAULT_TEXT_CARD.padding,
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Tu peux personnaliser ces éléments à tout moment depuis le tableau de bord de l&apos;animation.
            </AlertDescription>
          </Alert>
        </form>
      </Form>
    </div>
  )
}
