'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
    onSave({
      modelId: data.modelId,
      promptTemplate: data.promptTemplate,
      aspectRatio: data.aspectRatio as AspectRatio | undefined,
      referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
    })
    onClose()
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
              <div className="space-y-2 border rounded-lg p-4 bg-muted/30">
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
                    Cliquez sur une variable ci-dessous pour l&apos;insérer dans le prompt (max 2000
                    caractères)
                  </FormDescription>
                  <FormMessage />

                  {/* Variables as clickable badges (AC10) */}
                  <div className="mt-3 space-y-3">
                    <p className="text-sm font-medium">Variables disponibles :</p>

                    {/* Base variables from steps */}
                    {availableVariables.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Champs et questions :</p>
                        <div className="flex flex-wrap gap-2">
                          {availableVariables.map((variable) => (
                            <Badge
                              key={variable}
                              variant="secondary"
                              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
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
                        <p className="text-xs text-muted-foreground">Images de référence :</p>
                        <div className="flex flex-wrap gap-2">
                          {referenceImages.map((img) => {
                            const variable = `{${img.name}}`
                            const isUnused = unusedImageVariables.includes(variable)
                            return (
                              <Badge
                                key={img.id}
                                variant={isUnused ? 'outline' : 'secondary'}
                                className={`cursor-pointer transition-colors ${
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
                      <p className="text-sm text-muted-foreground">
                        Aucune variable disponible. Configurez les champs de base (Step 2), les
                        questions (Step 3), ou ajoutez des images de référence ci-dessus.
                      </p>
                    )}

                    {/* Warning for undefined variables (AC11) */}
                    {undefinedVariables.length > 0 && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          Variables non définies dans le prompt : {undefinedVariables.join(', ')}
                        </AlertDescription>
                      </Alert>
                    )}


                  </div>
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
    </Dialog>
  )
}
