'use client'

import { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PipelineBlockConfig, useWizardStore } from '@/lib/stores/wizard.store'
import { AIModel, ImageUsageMode, ImageSourceType } from '@/lib/types'
import { AI_MODELS } from '@/lib/ai-models'

// Validation schema for AI Generation block
const aiGenerationConfigSchema = z.object({
  modelId: z.string().min(1, 'La sélection du modèle IA est requise'),
  promptTemplate: z
    .string()
    .min(1, 'Le prompt template est requis')
    .max(2000, 'Le prompt ne peut pas dépasser 2000 caractères'),
  imageUsageMode: z.enum(['none', 'reference', 'edit']),
  imageSource: z.enum(['selfie', 'url', 'ai-block-output']).optional(),
  imageUrl: z.string().url('URL invalide').optional().or(z.literal('')),
  sourceBlockId: z.string().optional(),
})

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

  const form = useForm<AIGenerationConfigFormData>({
    resolver: zodResolver(aiGenerationConfigSchema),
    defaultValues: {
      modelId: initialConfig?.modelId || '',
      promptTemplate: initialConfig?.promptTemplate || '',
      imageUsageMode: (initialConfig?.imageUsageMode as ImageUsageMode) || 'none',
      imageSource: initialConfig?.imageSource as ImageSourceType | undefined,
      imageUrl: initialConfig?.imageUrl || '',
      sourceBlockId: initialConfig?.sourceBlockId || '',
    },
  })

  const selectedModelId = form.watch('modelId')
  const selectedModel = aiModels.find((m) => m.id === selectedModelId)
  const imageUsageMode = form.watch('imageUsageMode')
  const imageSource = form.watch('imageSource')

  // Check if selfie is configured in Step 3 input collection
  const { animationData } = useWizardStore()
  const hasSelfie =
    animationData.inputCollection?.elements?.some((el) => el.type === 'selfie') || false

  // Get previous AI blocks for source selection
  const pipeline = animationData.pipeline || []
  const previousAIBlocks = pipeline.filter(
    (b) => b.type === 'ai-generation' && b.id !== currentBlockId
  )

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

  // Reset imageSource when imageUsageMode changes to 'none'
  useEffect(() => {
    if (imageUsageMode === 'none') {
      form.setValue('imageSource', undefined)
      form.setValue('imageUrl', '')
      form.setValue('sourceBlockId', '')
    }
  }, [imageUsageMode, form])

  // Reset dependent fields when imageSource changes
  useEffect(() => {
    if (imageSource !== 'url') {
      form.setValue('imageUrl', '')
    }
    if (imageSource !== 'ai-block-output') {
      form.setValue('sourceBlockId', '')
    }
  }, [imageSource, form])

  const handleSubmit = (data: AIGenerationConfigFormData) => {
    onSave({
      modelId: data.modelId,
      promptTemplate: data.promptTemplate,
      imageUsageMode: data.imageUsageMode as ImageUsageMode,
      imageSource: data.imageSource as ImageSourceType | undefined,
      imageUrl: data.imageSource === 'url' ? data.imageUrl : undefined,
      sourceBlockId: data.imageSource === 'ai-block-output' ? data.sourceBlockId : undefined,
    })
    onClose()
  }

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
                    onValueChange={(value) => {
                      field.onChange(value)
                      // Reset image mode when model changes
                      form.setValue('imageUsageMode', 'none')
                    }}
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

            {/* Image Usage Mode - only show if model supports image */}
            {selectedModel && modelSupportsImage && (
              <FormField
                control={form.control}
                name="imageUsageMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mode d&apos;utilisation de l&apos;image</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sélectionner un mode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {selectedModel.capabilities.supportedModes.includes('none') && (
                          <SelectItem value="none">Pas d&apos;image</SelectItem>
                        )}
                        {selectedModel.capabilities.supportedModes.includes('reference') && (
                          <SelectItem value="reference">📷 Référence de style</SelectItem>
                        )}
                        {selectedModel.capabilities.supportedModes.includes('edit') && (
                          <SelectItem value="edit">✏️ Édition directe</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {imageUsageMode === 'reference' &&
                        "L'image servira de référence de style pour guider la génération."}
                      {imageUsageMode === 'edit' &&
                        "L'image sera directement transformée/éditée par l'IA."}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Image Source - only show if imageUsageMode !== 'none' */}
            {imageUsageMode && imageUsageMode !== 'none' && (
              <FormField
                control={form.control}
                name="imageSource"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source de l&apos;image</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sélectionner une source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {hasSelfie && (
                          <SelectItem value="selfie">Selfie du participant</SelectItem>
                        )}
                        <SelectItem value="url">URL d&apos;une image externe</SelectItem>
                        {previousAIBlocks.length > 0 && (
                          <SelectItem value="ai-block-output">
                            Image générée par un bloc IA précédent
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {!hasSelfie && previousAIBlocks.length === 0 && (
                      <FormDescription className="text-yellow-600">
                        ⚠️ Seule l&apos;URL externe est disponible. Ajoutez un selfie (Step 3) ou un
                        bloc IA précédent pour plus d&apos;options.
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* URL Input - visible if imageSource === 'url' */}
            {imageSource === 'url' && (
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL de l&apos;image</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/image.jpg" {...field} />
                    </FormControl>
                    <FormDescription>
                      Fournir l&apos;URL complète d&apos;une image accessible publiquement
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Block selector - visible if imageSource === 'ai-block-output' */}
            {imageSource === 'ai-block-output' && (
              <FormField
                control={form.control}
                name="sourceBlockId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bloc IA source</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sélectionner un bloc" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {previousAIBlocks.map((block) => {
                          const blockModel = AI_MODELS.find(
                            (m) => m.id === block.config.modelId
                          )
                          const blockNumber = block.order + 1
                          const modelName = blockModel?.name || block.config.modelId || 'IA'
                          return (
                            <SelectItem key={block.id} value={block.id}>
                              Bloc {blockNumber} - {modelName}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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

                  {/* Variables as clickable badges */}
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium">Variables disponibles :</p>
                    {availableVariables.length > 0 ? (
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
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Aucune variable disponible. Configurez les champs de base (Step 2) et/ou les
                        questions (Step 3).
                      </p>
                    )}
                    {imageUsageMode !== 'none' && (
                      <p className="text-xs text-muted-foreground mt-2">
                        💡 Note : L&apos;image source est passée automatiquement au modèle IA selon
                        le mode sélectionné ({imageUsageMode === 'reference' ? 'référence' : 'édition'}).
                      </p>
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
