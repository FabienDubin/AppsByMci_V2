'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { InputElement, InputElementType } from '@/lib/stores/wizard.store'
import {
  TypeSelectionGrid,
  SelfieEditSection,
  ChoiceConfigForm,
  SliderConfigForm,
  FreeTextConfigForm,
} from './sections'
import {
  choiceSchema,
  sliderSchema,
  freeTextSchema,
  ChoiceFormData,
  SliderFormData,
  FreeTextFormData,
} from './constants'

interface AddElementModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (element: Omit<InputElement, 'id' | 'order'>) => void
  existingElement?: InputElement | null
  hasSelfie: boolean
}

type ModalMode = 'select-type' | 'edit-selfie' | 'edit-choice' | 'edit-slider' | 'edit-free-text'

export function AddElementModal({
  isOpen,
  onClose,
  onSave,
  existingElement,
  hasSelfie,
}: AddElementModalProps) {
  const [mode, setMode] = useState<ModalMode>('select-type')
  const [validationError, setValidationError] = useState<string | null>(null)

  // Choice form
  const choiceForm = useForm<ChoiceFormData>({
    resolver: zodResolver(choiceSchema),
    defaultValues: { question: '', options: ['', ''], required: true },
  })

  // Slider form
  const sliderForm = useForm<SliderFormData>({
    resolver: zodResolver(sliderSchema),
    defaultValues: { question: '', min: 0, max: 10, minLabel: '', maxLabel: '', required: true },
  })

  // Free-text form
  const freeTextForm = useForm<FreeTextFormData>({
    resolver: zodResolver(freeTextSchema),
    defaultValues: { question: '', maxLength: 500, placeholder: '', required: true },
  })

  // Initialize for editing
  useEffect(() => {
    if (existingElement && isOpen) {
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
    }
  }, [existingElement, isOpen, choiceForm, sliderForm, freeTextForm])

  const handleTypeSelect = (type: InputElementType) => {
    if (type === 'selfie') setMode('edit-selfie')
    else if (type === 'choice') setMode('edit-choice')
    else if (type === 'slider') setMode('edit-slider')
    else if (type === 'free-text') setMode('edit-free-text')
  }

  const handleSaveSelfie = () => {
    onSave({ type: 'selfie' } as any)
    onClose()
  }

  const handleSaveChoice = (data: ChoiceFormData) => {
    const validOptions = data.options.filter(opt => opt.trim() !== '')
    if (validOptions.length < 2) {
      setValidationError('Vous devez ajouter au moins 2 options de réponse')
      return
    }
    setValidationError(null)
    onSave({ type: 'choice', ...data, options: validOptions } as any)
    onClose()
  }

  const handleSaveSlider = (data: SliderFormData) => {
    onSave({ type: 'slider', ...data } as any)
    onClose()
  }

  const handleSaveFreeText = (data: FreeTextFormData) => {
    onSave({ type: 'free-text', ...data } as any)
    onClose()
  }

  const handleCancel = () => {
    setValidationError(null)
    if (mode !== 'select-type') {
      setMode('select-type')
    } else {
      onClose()
    }
  }

  const getTitle = () => {
    if (existingElement) {
      const labels: Record<InputElementType, string> = {
        selfie: 'Modifier Selfie',
        choice: 'Modifier Question choix multiple',
        slider: 'Modifier Question slider',
        'free-text': 'Modifier Réponse libre',
      }
      return labels[existingElement.type]
    }
    if (mode === 'select-type') return 'Ajouter un élément'
    const labels: Record<string, string> = {
      'edit-selfie': 'Selfie',
      'edit-choice': 'Question choix multiple',
      'edit-slider': 'Question slider',
      'edit-free-text': 'Réponse libre',
    }
    return labels[mode] || 'Ajouter un élément'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>
            {mode === 'select-type' && "Sélectionnez le type d'élément à ajouter"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {mode === 'select-type' && (
            <TypeSelectionGrid onSelect={handleTypeSelect} hasSelfie={hasSelfie} />
          )}

          {mode === 'edit-selfie' && (
            <SelfieEditSection
              onCancel={handleCancel}
              onSave={handleSaveSelfie}
              isEditing={!!existingElement}
            />
          )}

          {mode === 'edit-choice' && (
            <ChoiceConfigForm
              form={choiceForm}
              onSubmit={handleSaveChoice}
              onCancel={handleCancel}
              isEditing={!!existingElement}
              validationError={validationError}
            />
          )}

          {mode === 'edit-slider' && (
            <SliderConfigForm
              form={sliderForm}
              onSubmit={handleSaveSlider}
              onCancel={handleCancel}
              isEditing={!!existingElement}
            />
          )}

          {mode === 'edit-free-text' && (
            <FreeTextConfigForm
              form={freeTextForm}
              onSubmit={handleSaveFreeText}
              onCancel={handleCancel}
              isEditing={!!existingElement}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
