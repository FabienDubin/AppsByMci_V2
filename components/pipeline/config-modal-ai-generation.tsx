'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertTriangle, ChevronDown, HelpCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { PipelineBlockConfig, useWizardStore, PipelineBlock } from '@/lib/stores/wizard.store'
import { AIModel, ReferenceImage, AspectRatio } from '@/lib/types'
import { AI_MODELS } from '@/lib/ai-models'
import { ReferenceImageList } from './ReferenceImageList'

// Validation schema for AI Generation block
const aiGenerationConfigSchema = z.object({
  modelId: z.string().min(1, 'La sélection du modèle IA est requise'),
  promptTemplate: z
    .string()
    .min(1, 'Le prompt template est requis')
    .max(2000, 'Le prompt ne peut pas dépasser 2000 caractères'),
  aspectRatio: z.enum(['1:1', '9:16', '16:9', '2:3', '3:2']).optional(),
  // referenceImages is managed separately (not in form but in state)
})

// Available aspect ratio options with labels
const ASPECT_RATIO_OPTIONS: { value: AspectRatio; label: string }[] = [
  { value: '1:1', label: '1:1 (Carré)' },
  { value: '9:16', label: '9:16 (Portrait)' },
  { value: '16:9', label: '16:9 (Paysage)' },
  { value: '2:3', label: '2:3 (Portrait)' },
  { value: '3:2', label: '3:2 (Paysage)' },
]

type AIGenerationConfigFormData = z.infer<typeof aiGenerationConfigSchema>

interface ConfigModalAIGenerationProps {
  isOpen: boolean
  initialConfig?: PipelineBlockConfig
  currentBlockId?: string // ID of the block being edited
  availableVariables: string[] // From getAvailableVariables()
  onClose: () => void
  onSave: (config: PipelineBlockConfig) => void
}

/**
 * Modal for configuring AI Generation block
 * AC-3.6.4, AC-3.6.5: Dialog with model selection + prompt template
 * Extended with image usage mode and source selection
 */
export function ConfigModalAIGeneration({
  isOpen,
  initialConfig,
  currentBlockId,
  availableVariables,
  onClose,
  onSave,
}: ConfigModalAIGenerationProps) {
  const [aiModels, setAIModels] = useState<AIModel[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [showUnusedImagesWarning, setShowUnusedImagesWarning] = useState(false)
  const [pendingSubmitData, setPendingSubmitData] = useState<AIGenerationConfigFormData | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // State for reference images (managed outside form for better UX)
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>(
    initialConfig?.referenceImages || []
  )

  const form = useForm<AIGenerationConfigFormData>({
    resolver: zodResolver(aiGenerationConfigSchema),
    defaultValues: {
      modelId: initialConfig?.modelId || '',
      promptTemplate: initialConfig?.promptTemplate || '',
      aspectRatio: initialConfig?.aspectRatio as AspectRatio | undefined,
    },
    mode: 'onSubmit', // Only validate on submit, not on change/blur
  })

  const selectedModelId = form.watch('modelId')
  const selectedModel = aiModels.find((m) => m.id === selectedModelId)

  // Check if selfie is configured in Step 3 input collection
  const { animationData } = useWizardStore()
  const hasSelfie =
    animationData.inputCollection?.elements?.some((el) => el.type === 'selfie') || false

  // Get previous AI blocks for source selection
  const pipeline = animationData.pipeline || []
  const previousAIBlocks = pipeline.filter(
    (b) => b.type === 'ai-generation' && b.id !== currentBlockId
  ) as PipelineBlock[]

  // Get animation ID for image uploads
  const animationId = animationData.id || 'temp-animation'

  // Computed: all available variables including reference images (AC10)
  const allAvailableVariables = useMemo(() => {
    const imageVariables = referenceImages.map((img) => `{${img.name}}`)
    return [...availableVariables, ...imageVariables]
  }, [availableVariables, referenceImages])

  // Computed: get variables used in prompt
  const promptTemplate = form.watch('promptTemplate')
  const usedVariables = useMemo((): string[] => {
    const matches = promptTemplate.match(/\{([^}]+)\}/g)
    return matches ? [...matches] : []
  }, [promptTemplate])

  // Computed: undefined variables (used in prompt but not available) (AC11)
  const undefinedVariables = useMemo(() => {
    return usedVariables.filter((v) => !allAvailableVariables.includes(v))
  }, [usedVariables, allAvailableVariables])

  // Computed: unused image variables (defined but not in prompt) (AC11)
  const unusedImageVariables = useMemo(() => {
    const imageVars = referenceImages.map((img) => `{${img.name}}`)
    return imageVars.filter((v) => !usedVariables.includes(v))
  }, [referenceImages, usedVariables])

  // Computed: unused question variables (exclude nom, prenom, email - only questions)
  const unusedQuestionVariables = useMemo(() => {
    // Base fields to exclude (not relevant for prompt)
    const baseFieldVars = ['{nom}', '{prenom}', '{email}']
    // Filter to only question variables (question1, question2, etc.)
    const questionVars = availableVariables.filter((v) => !baseFieldVars.includes(v))
    return questionVars.filter((v) => !usedVariables.includes(v))
  }, [availableVariables, usedVariables])

  /**
   * Insert variable at cursor position
   */
  const handleInsertVariable = (variable: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentValue = form.getValues('promptTemplate')

    // Insert variable at cursor position
    const newValue = currentValue.substring(0, start) + variable + currentValue.substring(end)

    // Update form value
    form.setValue('promptTemplate', newValue)

    // Set cursor position after inserted variable
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + variable.length, start + variable.length)
    }, 0)
  }

  // Load AI models from API
  useEffect(() => {
    if (isOpen) {
      setIsLoadingModels(true)
      fetch('/api/ai-models')
        .then((res) => res.json())
        .then((data) => {
          setAIModels(data.models || [])
        })
        .catch((err) => {
          console.error('Failed to load AI models:', err)
          // Fallback to local models
          setAIModels(AI_MODELS)
        })
        .finally(() => {
          setIsLoadingModels(false)
        })
    }
  }, [isOpen])

  const handleSubmit = (data: AIGenerationConfigFormData) => {
    // Check for unused reference images or question variables before saving
    if (unusedImageVariables.length > 0 || unusedQuestionVariables.length > 0) {
      setPendingSubmitData(data)
      setShowUnusedImagesWarning(true)
      return
    }

    // No unused variables, save directly
    doSave(data)
  }

  const doSave = (data: AIGenerationConfigFormData) => {
    onSave({
      modelId: data.modelId,
      promptTemplate: data.promptTemplate,
      aspectRatio: data.aspectRatio as AspectRatio | undefined,
      referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
    })
    onClose()
  }

  const handleConfirmSaveWithUnusedImages = () => {
    if (pendingSubmitData) {
      doSave(pendingSubmitData)
    }
    setShowUnusedImagesWarning(false)
    setPendingSubmitData(null)
  }

  const handleCancelSaveWithUnusedImages = () => {
    setShowUnusedImagesWarning(false)
    setPendingSubmitData(null)
  }

  // Get supported aspect ratios for selected model
  const supportedAspectRatios = selectedModel?.capabilities.supportedAspectRatios || []

  // Reset form and reference images when modal opens with new config
  useEffect(() => {
    if (isOpen) {
      // Reset form values
      form.reset({
        modelId: initialConfig?.modelId || '',
        promptTemplate: initialConfig?.promptTemplate || '',
        aspectRatio: initialConfig?.aspectRatio as AspectRatio | undefined,
      })
      // Reset reference images state
      setReferenceImages(initialConfig?.referenceImages || [])
    }
  }, [isOpen, initialConfig, form])

  // Check if model supports image usage
  const modelSupportsImage = selectedModel?.capabilities.supportedModes.some((m) => m !== 'none')

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurer IA Generation</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Model selection */}
            <FormField
              control={form.control}
              name="modelId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modèle IA</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoadingModels}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            isLoadingModels
                              ? 'Chargement des modèles...'
                              : 'Sélectionner un modèle IA'
                          }
                        >
                          {selectedModel && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{selectedModel.name}</span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                                {selectedModel.provider}
                              </Badge>
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent
                      position="popper"
                      className="w-[var(--radix-select-trigger-width)] max-h-[300px]"
                      sideOffset={4}
                    >
                      {aiModels.map((model) => (
                        <SelectItem key={model.id} value={model.id} className="cursor-pointer">
                          <div className="flex flex-col gap-1.5 py-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">{model.name}</span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                                {model.provider}
                              </Badge>
                              {model.capabilities.supportedModes.includes('edit') && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-800"
                                >
                                  ✏️ Édition
                                </Badge>
                              )}
                              {model.capabilities.supportedModes.includes('reference') && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-800"
                                >
                                  📷 Référence
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed whitespace-normal">
                              {model.description}
                            </p>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Aspect Ratio selector - only show if model has aspect ratio support (AC2) */}
            {selectedModel && supportedAspectRatios.length > 0 && (
              <FormField
                control={form.control}
                name="aspectRatio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ratio d&apos;image</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Défaut du modèle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ASPECT_RATIO_OPTIONS.filter((opt) =>
                          supportedAspectRatios.includes(opt.value)
                        ).map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Ratio de sortie pour l&apos;image générée
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Reference Images section - only show if model supports reference mode (AC1) */}
            {selectedModel && modelSupportsImage && (
              <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                {/* How to use reference images - Collapsible help box */}
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 transition-colors w-full group">
                    <HelpCircle className="h-4 w-4" />
                    <span className="font-medium">Comment utiliser les images de référence ?</span>
                    <ChevronDown className="h-4 w-4 ml-auto transition-transform group-data-[state=open]:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-2 space-y-2">
                      <ol className="text-xs text-blue-800 space-y-1.5 list-decimal list-inside">
                        <li>
                          <strong>Ajoutez une image</strong> ci-dessous (selfie, upload, ou résultat d&apos;un bloc précédent)
                        </li>
                        <li>
                          <strong>Donnez-lui un nom</strong> (ex: &quot;portrait&quot;, &quot;background&quot;)
                        </li>
                        <li>
                          <strong>Cliquez sur la variable</strong> <Badge variant="secondary" className="text-[10px] px-1.5 py-0 mx-1">{'{nom_image}'}</Badge> dans la section &quot;Variables disponibles&quot; pour l&apos;insérer dans votre prompt
                        </li>
                      </ol>
                      <p className="text-xs text-blue-700 mt-2 border-t border-blue-200 pt-2">
                        ⚠️ Une image non référencée dans le prompt (variable en jaune) ne sera pas utilisée par le modèle.
                      </p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <ReferenceImageList
                  images={referenceImages}
                  hasSelfie={hasSelfie}
                  previousAIBlocks={previousAIBlocks}
                  animationId={animationId}
                  modelId={selectedModelId}
                  onChange={setReferenceImages}
                />
              </div>
            )}

            {/* Prompt template */}
            <FormField
              control={form.control}
              name="promptTemplate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prompt template</FormLabel>

                  {/* Variables as clickable badges - BEFORE the textarea (AC10) */}
                  <div className="space-y-2 py-2">
                    <p className="text-xs text-muted-foreground">
                      Cliquez sur une variable pour l&apos;insérer dans le prompt :
                    </p>

                    {/* Base variables from steps */}
                    {availableVariables.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Champs et questions :</p>
                        <div className="flex flex-wrap gap-1.5">
                          {availableVariables.map((variable) => (
                            <Badge
                              key={variable}
                              variant="secondary"
                              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                              onClick={() => handleInsertVariable(variable)}
                            >
                              {variable}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Image reference variables */}
                    {referenceImages.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Images de référence :</p>
                        <div className="flex flex-wrap gap-1.5">
                          {referenceImages.map((img) => {
                            const variable = `{${img.name}}`
                            const isUnused = unusedImageVariables.includes(variable)
                            return (
                              <Badge
                                key={img.id}
                                variant={isUnused ? 'outline' : 'secondary'}
                                className={`cursor-pointer transition-colors text-xs ${
                                  isUnused
                                    ? 'border-yellow-500 text-yellow-700 hover:bg-yellow-100'
                                    : 'hover:bg-primary hover:text-primary-foreground'
                                }`}
                                onClick={() => handleInsertVariable(variable)}
                                title={isUnused ? 'Non utilisée dans le prompt' : undefined}
                              >
                                {variable}
                                {isUnused && ' ⚠️'}
                              </Badge>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Empty state */}
                    {availableVariables.length === 0 && referenceImages.length === 0 && (
                      <p className="text-xs text-muted-foreground italic">
                        Aucune variable disponible. Configurez les champs de base (Step 2), les
                        questions (Step 3), ou ajoutez des images de référence ci-dessus.
                      </p>
                    )}
                  </div>

                  <FormControl>
                    <Textarea
                      placeholder="Create a futuristic portrait of {nom} in {question1} style"
                      className="min-h-[120px] font-mono text-sm"
                      maxLength={2000}
                      {...field}
                      ref={(e) => {
                        field.ref(e)
                        textareaRef.current = e
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Max 2000 caractères
                  </FormDescription>
                  <FormMessage />

                  {/* Warning for undefined variables (AC11) */}
                  {undefinedVariables.length > 0 && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Variables non définies dans le prompt : {undefinedVariables.join(', ')}
                      </AlertDescription>
                    </Alert>
                  )}
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit">Sauvegarder</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>

      {/* Warning dialog for unused variables */}
      <AlertDialog open={showUnusedImagesWarning} onOpenChange={setShowUnusedImagesWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Variables non utilisées
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 text-muted-foreground text-sm">
                {/* Unused question variables */}
                {unusedQuestionVariables.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-medium text-foreground">
                      {unusedQuestionVariables.length === 1
                        ? 'Réponse à une question non utilisée :'
                        : 'Réponses aux questions non utilisées :'}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {unusedQuestionVariables.map((v) => (
                        <Badge key={v} variant="outline" className="border-orange-500 text-orange-700">
                          {v}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Unused image variables */}
                {unusedImageVariables.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-medium text-foreground">
                      {unusedImageVariables.length === 1
                        ? 'Image de référence non utilisée :'
                        : 'Images de référence non utilisées :'}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {unusedImageVariables.map((v) => (
                        <Badge key={v} variant="outline" className="border-yellow-500 text-yellow-700">
                          {v}
                        </Badge>
                      ))}
                    </div>
                    <span className="block text-xs text-muted-foreground">
                      Ces images ne seront pas envoyées au modèle IA.
                    </span>
                  </div>
                )}

                <span className="block pt-2 border-t">
                  Voulez-vous continuer quand même ?
                </span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelSaveWithUnusedImages}>
              Retour
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSaveWithUnusedImages}>
              Sauvegarder quand même
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
