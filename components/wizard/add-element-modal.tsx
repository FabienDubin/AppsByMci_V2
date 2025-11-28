'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { InputElement, InputElementType } from '@/lib/stores/wizard.store'
import { Camera, CheckSquare, BarChart3, FileText, Plus, X, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface AddElementModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (element: Omit<InputElement, 'id' | 'order'>) => void
  existingElement?: InputElement | null
  hasSelfie: boolean
}

type ModalMode = 'select-type' | 'edit-selfie' | 'edit-choice' | 'edit-slider' | 'edit-free-text'

// Zod schemas pour les formulaires
const choiceSchema = z.object({
  question: z.string().min(1, 'La question est requise').max(500),
  options: z.array(z.string().max(100)).min(2).max(6),
  required: z.boolean(),
}).refine(
  (data) => {
    const nonEmptyOptions = data.options.filter(opt => opt.trim() !== '')
    return nonEmptyOptions.length >= 2
  },
  { message: 'Vous devez ajouter au moins 2 options de réponse', path: ['options'] }
)

const sliderSchema = z.object({
  question: z.string().min(1, 'La question est requise').max(500),
  min: z.number(),
  max: z.number(),
  minLabel: z.string().max(50).optional(),
  maxLabel: z.string().max(50).optional(),
  required: z.boolean(),
}).refine(data => data.max > data.min, { message: 'Max doit être > Min', path: ['max'] })

const freeTextSchema = z.object({
  question: z.string().min(1, 'La question est requise').max(500),
  maxLength: z.number().int().min(50).max(2000),
  placeholder: z.string().max(100).optional(),
  required: z.boolean(),
})

const elementTypes = [
  {
    type: 'selfie' as const,
    icon: Camera,
    label: '📸 Selfie',
    description: 'Capture ou upload photo via webcam/appareil',
  },
  {
    type: 'choice' as const,
    icon: CheckSquare,
    label: '☑️ Question choix multiple',
    description: 'Question avec 2 à 6 options de réponse',
  },
  {
    type: 'slider' as const,
    icon: BarChart3,
    label: '📊 Question slider',
    description: 'Échelle de valeurs avec labels personnalisables',
  },
  {
    type: 'free-text' as const,
    icon: FileText,
    label: '✍️ Réponse libre',
    description: 'Champ texte libre avec limite de caractères',
  },
]

export function AddElementModal({
  isOpen,
  onClose,
  onSave,
  existingElement,
  hasSelfie,
}: AddElementModalProps) {
  const [mode, setMode] = useState<ModalMode>('select-type')
  const [selectedType, setSelectedType] = useState<InputElementType | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Choice form
  const choiceForm = useForm<z.infer<typeof choiceSchema>>({
    resolver: zodResolver(choiceSchema),
    defaultValues: { question: '', options: ['', ''], required: true },
  })

  // Slider form
  const sliderForm = useForm<z.infer<typeof sliderSchema>>({
    resolver: zodResolver(sliderSchema),
    defaultValues: { question: '', min: 0, max: 10, minLabel: '', maxLabel: '', required: true },
  })

  // Free-text form
  const freeTextForm = useForm<z.infer<typeof freeTextSchema>>({
    resolver: zodResolver(freeTextSchema),
    defaultValues: { question: '', maxLength: 500, placeholder: '', required: true },
  })

  // Initialize for editing
  useEffect(() => {
    if (existingElement && isOpen) {
      setSelectedType(existingElement.type)
      if (existingElement.type === 'choice') {
        setMode('edit-choice')
        choiceForm.reset({
          question: existingElement.question || '',
          options: existingElement.options || ['', ''],
          required: existingElement.required !== false,
        })
      } else if (existingElement.type === 'slider') {
        setMode('edit-slider')
        sliderForm.reset({
          question: existingElement.question || '',
          min: existingElement.min ?? 0,
          max: existingElement.max ?? 10,
          minLabel: existingElement.minLabel || '',
          maxLabel: existingElement.maxLabel || '',
          required: existingElement.required !== false,
        })
      } else if (existingElement.type === 'free-text') {
        setMode('edit-free-text')
        freeTextForm.reset({
          question: existingElement.question || '',
          maxLength: existingElement.maxLength ?? 500,
          placeholder: existingElement.placeholder || '',
          required: existingElement.required !== false,
        })
      } else if (existingElement.type === 'selfie') {
        setMode('edit-selfie')
      }
    } else if (isOpen) {
      setMode('select-type')
      setSelectedType(null)
    }
  }, [existingElement, isOpen, choiceForm, sliderForm, freeTextForm])

  const handleTypeSelect = (type: InputElementType) => {
    setSelectedType(type)
    if (type === 'selfie') {
      setMode('edit-selfie')
    } else if (type === 'choice') {
      setMode('edit-choice')
    } else if (type === 'slider') {
      setMode('edit-slider')
    } else if (type === 'free-text') {
      setMode('edit-free-text')
    }
  }

  const handleSaveSelfie = () => {
    onSave({ type: 'selfie' } as any)
    onClose()
  }

  const handleSaveChoice = (data: z.infer<typeof choiceSchema>) => {
    // Validate that we have at least 2 options
    const validOptions = data.options.filter(opt => opt.trim() !== '')
    if (validOptions.length < 2) {
      setValidationError('Vous devez ajouter au moins 2 options de réponse')
      return
    }

    setValidationError(null)
    onSave({ type: 'choice', ...data, options: validOptions } as any)
    onClose()
  }

  const handleSaveSlider = (data: z.infer<typeof sliderSchema>) => {
    onSave({ type: 'slider', ...data } as any)
    onClose()
  }

  const handleSaveFreeText = (data: z.infer<typeof freeTextSchema>) => {
    onSave({ type: 'free-text', ...data } as any)
    onClose()
  }

  const handleCancel = () => {
    setValidationError(null)
    if (mode !== 'select-type') {
      setMode('select-type')
      setSelectedType(null)
    } else {
      onClose()
    }
  }

  const getTitle = () => {
    if (existingElement) {
      const labels = {
        selfie: 'Modifier Selfie',
        choice: 'Modifier Question choix multiple',
        slider: 'Modifier Question slider',
        'free-text': 'Modifier Réponse libre',
      }
      return labels[existingElement.type]
    }
    if (mode === 'select-type') return 'Ajouter un élément'
    const labels = {
      'edit-selfie': 'Selfie',
      'edit-choice': 'Question choix multiple',
      'edit-slider': 'Question slider',
      'edit-free-text': 'Réponse libre',
    }
    return labels[mode as keyof typeof labels] || 'Ajouter un élément'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>
            {mode === 'select-type' && 'Sélectionnez le type d\'élément à ajouter'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Type Selection */}
          {mode === 'select-type' && (
            <div className="grid grid-cols-2 gap-3">
              {elementTypes.map(({ type, icon: Icon, label, description }) => (
                <button
                  key={type}
                  onClick={() => handleTypeSelect(type)}
                  disabled={type === 'selfie' && hasSelfie}
                  className="flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all hover:bg-accent hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-medium">{label}</p>
                    <p className="text-sm text-muted-foreground">{description}</p>
                    {type === 'selfie' && hasSelfie && (
                      <p className="text-xs text-destructive mt-1">(Déjà ajouté)</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Selfie Edit */}
          {mode === 'edit-selfie' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Le selfie sera ajouté à la liste. Les participants pourront uploader ou capturer une photo via leur webcam/appareil.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancel}>
                  Annuler
                </Button>
                <Button onClick={handleSaveSelfie}>
                  {existingElement ? 'Sauvegarder' : 'Ajouter'}
                </Button>
              </div>
            </div>
          )}

          {/* Choice Edit */}
          {mode === 'edit-choice' && (
            <Form {...choiceForm}>
              <form onSubmit={choiceForm.handleSubmit(handleSaveChoice)} className="space-y-4">
                <FormField
                  control={choiceForm.control}
                  name="question"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Quel est ton langage de programmation préféré ?"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel>Options de réponse</FormLabel>
                  {choiceForm.watch('options').map((_, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`Option ${index + 1}`}
                        value={choiceForm.watch(`options.${index}`)}
                        onChange={(e) => {
                          const options = [...choiceForm.watch('options')]
                          options[index] = e.target.value
                          choiceForm.setValue('options', options)
                        }}
                      />
                      {choiceForm.watch('options').length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const options = choiceForm.watch('options').filter((_, i) => i !== index)
                            choiceForm.setValue('options', options)
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {choiceForm.watch('options').length < 6 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        choiceForm.setValue('options', [...choiceForm.watch('options'), ''])
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Ajouter une option
                    </Button>
                  )}
                </div>

                <FormField
                  control={choiceForm.control}
                  name="required"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <FormLabel className="cursor-pointer">Question requise</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {(validationError || choiceForm.formState.errors.options) && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {validationError || choiceForm.formState.errors.options?.message}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Annuler
                  </Button>
                  <Button type="submit">{existingElement ? 'Sauvegarder' : 'Ajouter'}</Button>
                </div>
              </form>
            </Form>
          )}

          {/* Slider Edit */}
          {mode === 'edit-slider' && (
            <Form {...sliderForm}>
              <form onSubmit={sliderForm.handleSubmit(handleSaveSlider)} className="space-y-4">
                <FormField
                  control={sliderForm.control}
                  name="question"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question *</FormLabel>
                      <FormControl>
                        <Textarea placeholder="À quel point aimes-tu le café ?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={sliderForm.control}
                    name="min"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valeur minimale</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={sliderForm.control}
                    name="max"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valeur maximale</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={sliderForm.control}
                    name="minLabel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Label minimum (optionnel)</FormLabel>
                        <FormControl>
                          <Input placeholder="Pas du tout" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={sliderForm.control}
                    name="maxLabel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Label maximum (optionnel)</FormLabel>
                        <FormControl>
                          <Input placeholder="Totalement" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={sliderForm.control}
                  name="required"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <FormLabel className="cursor-pointer">Question requise</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Annuler
                  </Button>
                  <Button type="submit">{existingElement ? 'Sauvegarder' : 'Ajouter'}</Button>
                </div>
              </form>
            </Form>
          )}

          {/* Free-text Edit */}
          {mode === 'edit-free-text' && (
            <Form {...freeTextForm}>
              <form onSubmit={freeTextForm.handleSubmit(handleSaveFreeText)} className="space-y-4">
                <FormField
                  control={freeTextForm.control}
                  name="question"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question *</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Décris ton superpouvoir idéal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={freeTextForm.control}
                  name="maxLength"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Limite de caractères (50-2000)</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Slider
                            min={50}
                            max={2000}
                            step={50}
                            value={[field.value]}
                            onValueChange={([value]) => field.onChange(value)}
                          />
                          <p className="text-sm text-muted-foreground text-right">
                            {field.value} caractères max
                          </p>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={freeTextForm.control}
                  name="placeholder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Placeholder réponse (optionnel)</FormLabel>
                      <FormControl>
                        <Input placeholder="Tape ta réponse ici..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={freeTextForm.control}
                  name="required"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <FormLabel className="cursor-pointer">Question requise</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Annuler
                  </Button>
                  <Button type="submit">{existingElement ? 'Sauvegarder' : 'Ajouter'}</Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
