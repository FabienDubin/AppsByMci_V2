'use client'

import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PipelineBlockConfig, useWizardStore } from '@/lib/stores/wizard.store'
import { cn } from '@/lib/utils'

// Profile schema
const profileSchema = z.object({
  key: z
    .string()
    .min(1, 'La clé est requise')
    .max(5, 'La clé ne peut pas dépasser 5 caractères')
    .regex(/^[A-Za-z]+$/, 'La clé ne doit contenir que des lettres'),
  name: z
    .string()
    .min(1, 'Le nom est requis')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  description: z
    .string()
    .max(2000, 'La description ne peut pas dépasser 2000 caractères'),
  imageStyle: z
    .string()
    .max(500, 'Le style visuel ne peut pas dépasser 500 caractères'),
})

// Option mapping schema
const optionMappingSchema = z.object({
  optionText: z.string(),
  profileKey: z.string(),
})

// Question mapping schema
const questionMappingSchema = z.object({
  elementId: z.string(),
  optionMappings: z.array(optionMappingSchema),
})

// Main form schema
const quizScoringConfigSchema = z.object({
  name: z
    .string()
    .min(1, 'Le nom du bloc est requis')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères')
    .regex(/^[a-z0-9_]+$/, 'Le nom doit être en minuscules, sans espaces (underscore autorisé)'),
  selectedQuestionIds: z
    .array(z.string())
    .min(1, 'Au moins 1 question doit être sélectionnée'),
  questionMappings: z.array(questionMappingSchema),
  profiles: z
    .array(profileSchema)
    .min(2, 'Au moins 2 profils sont requis'),
})

type QuizScoringConfigFormData = z.infer<typeof quizScoringConfigSchema>

interface ConfigModalQuizScoringProps {
  isOpen: boolean
  initialConfig?: PipelineBlockConfig
  onClose: () => void
  onSave: (config: PipelineBlockConfig) => void
}

/**
 * Modal for configuring Quiz Scoring block
 * Uses tabs: 1. Define Profiles, 2. Map Questions to Profiles
 */
export function ConfigModalQuizScoring({
  isOpen,
  initialConfig,
  onClose,
  onSave,
}: ConfigModalQuizScoringProps) {
  const { animationData } = useWizardStore()

  // Get choice questions from animation
  const choiceQuestions = (animationData.inputCollection?.elements || []).filter(
    (el) => el.type === 'choice'
  )

  // Current tab
  const [activeTab, setActiveTab] = useState('profiles')

  // Track which questions are expanded in UI
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())

  const form = useForm<QuizScoringConfigFormData>({
    resolver: zodResolver(quizScoringConfigSchema),
    defaultValues: {
      name: initialConfig?.quizScoring?.name || '',
      selectedQuestionIds: initialConfig?.quizScoring?.selectedQuestionIds || [],
      questionMappings: initialConfig?.quizScoring?.questionMappings || [],
      profiles: initialConfig?.quizScoring?.profiles || [
        { key: 'A', name: '', description: '', imageStyle: '' },
        { key: 'B', name: '', description: '', imageStyle: '' },
      ],
    },
    mode: 'onSubmit',
  })

  const { fields: profileFields, append: appendProfile, remove: removeProfile } = useFieldArray({
    control: form.control,
    name: 'profiles',
  })

  const selectedQuestionIds = form.watch('selectedQuestionIds')
  const profiles = form.watch('profiles')
  const questionMappings = form.watch('questionMappings')

  // Get defined profile keys (only those with non-empty keys)
  const definedProfileKeys = profiles
    .map((p) => p.key.toUpperCase())
    .filter((k) => k.length > 0)

  // Check if profiles are valid (at least 2 with keys)
  const hasValidProfiles = definedProfileKeys.length >= 2

  // Toggle question selection
  const toggleQuestionSelection = (questionId: string) => {
    const currentSelected = form.getValues('selectedQuestionIds')
    const questionMappings = form.getValues('questionMappings')

    if (currentSelected.includes(questionId)) {
      // Deselect: remove from selected and remove mapping
      form.setValue(
        'selectedQuestionIds',
        currentSelected.filter((id) => id !== questionId)
      )
      form.setValue(
        'questionMappings',
        questionMappings.filter((m) => m.elementId !== questionId)
      )
      // Collapse the question
      setExpandedQuestions((prev) => {
        const next = new Set(prev)
        next.delete(questionId)
        return next
      })
    } else {
      // Select: add to selected and create mapping with empty profile keys
      const question = choiceQuestions.find((q) => q.id === questionId)
      if (question) {
        form.setValue('selectedQuestionIds', [...currentSelected, questionId])
        form.setValue('questionMappings', [
          ...questionMappings,
          {
            elementId: questionId,
            optionMappings: (question.options || []).map((opt) => ({
              optionText: opt,
              profileKey: '',
            })),
          },
        ])
        // Expand the question
        setExpandedQuestions((prev) => new Set(prev).add(questionId))
      }
    }
  }

  // Toggle question expansion
  const toggleQuestionExpansion = (questionId: string) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev)
      if (next.has(questionId)) {
        next.delete(questionId)
      } else {
        next.add(questionId)
      }
      return next
    })
  }

  // Update option mapping with dropdown
  const updateOptionMapping = (questionId: string, optionText: string, profileKey: string) => {
    const questionMappings = form.getValues('questionMappings')
    const mappingIndex = questionMappings.findIndex((m) => m.elementId === questionId)

    if (mappingIndex !== -1) {
      const optionIndex = questionMappings[mappingIndex].optionMappings.findIndex(
        (om) => om.optionText === optionText
      )
      if (optionIndex !== -1) {
        const newMappings = [...questionMappings]
        newMappings[mappingIndex] = {
          ...newMappings[mappingIndex],
          optionMappings: newMappings[mappingIndex].optionMappings.map((om, i) =>
            i === optionIndex ? { ...om, profileKey } : om
          ),
        }
        form.setValue('questionMappings', newMappings)
      }
    }
  }

  // Check if all selected questions have complete mappings
  const hasCompleteMappings = () => {
    if (selectedQuestionIds.length === 0) return false
    for (const questionId of selectedQuestionIds) {
      const mapping = questionMappings.find((m) => m.elementId === questionId)
      if (!mapping) return false
      for (const optionMapping of mapping.optionMappings) {
        if (!optionMapping.profileKey) return false
        if (!definedProfileKeys.includes(optionMapping.profileKey.toUpperCase())) return false
      }
    }
    return true
  }

  // Count unmapped options
  const getUnmappedCount = () => {
    let count = 0
    for (const questionId of selectedQuestionIds) {
      const mapping = questionMappings.find((m) => m.elementId === questionId)
      if (mapping) {
        for (const optionMapping of mapping.optionMappings) {
          if (!optionMapping.profileKey || !definedProfileKeys.includes(optionMapping.profileKey.toUpperCase())) {
            count++
          }
        }
      }
    }
    return count
  }

  const handleSubmit = (data: QuizScoringConfigFormData) => {
    // Normalize profile keys to uppercase
    const normalizedData = {
      ...data,
      questionMappings: data.questionMappings.map((qm) => ({
        ...qm,
        optionMappings: qm.optionMappings.map((om) => ({
          ...om,
          profileKey: om.profileKey.toUpperCase(),
        })),
      })),
      profiles: data.profiles.map((p) => ({
        ...p,
        key: p.key.toUpperCase(),
      })),
    }

    onSave({
      quizScoring: normalizedData,
    })
    onClose()
  }

  // Handle form validation errors (could be used for analytics or user feedback)
  const onFormError = (_errors: any) => {
    // Validation errors are displayed inline via FormMessage components
  }

  // Reset form when modal opens with new config
  useEffect(() => {
    if (isOpen) {
      const defaultProfiles = initialConfig?.quizScoring?.profiles || [
        { key: 'A', name: '', description: '', imageStyle: '' },
        { key: 'B', name: '', description: '', imageStyle: '' },
      ]

      form.reset({
        name: initialConfig?.quizScoring?.name || '',
        selectedQuestionIds: initialConfig?.quizScoring?.selectedQuestionIds || [],
        questionMappings: initialConfig?.quizScoring?.questionMappings || [],
        profiles: defaultProfiles,
      })

      // Expand selected questions by default
      setExpandedQuestions(new Set(initialConfig?.quizScoring?.selectedQuestionIds || []))

      // Start on profiles tab if no profiles defined, otherwise on mapping
      if (defaultProfiles.some((p) => p.name)) {
        setActiveTab('mapping')
      } else {
        setActiveTab('profiles')
      }
    }
  }, [isOpen, initialConfig, form])

  // Check for validation errors
  const formErrors = form.formState.errors

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🎯 Configurer Quiz Scoring
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit, onFormError)} className="space-y-6">
            {/* Block name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du bloc</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="personnalite"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Utilisé pour préfixer les variables : {'{'}
                    {field.value || 'nom'}_profile_name{'}'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="profiles" className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    1
                  </span>
                  Profils
                  {definedProfileKeys.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {definedProfileKeys.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="mapping" className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    2
                  </span>
                  Mapping Questions
                  {selectedQuestionIds.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {selectedQuestionIds.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Profiles */}
              <TabsContent value="profiles" className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">Définir les profils (min. 2)</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Créez d&apos;abord les profils, puis associez-les aux réponses
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      appendProfile({ key: '', name: '', description: '', imageStyle: '' })
                    }
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter un profil
                  </Button>
                </div>

                <div className="space-y-4">
                  {profileFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="border rounded-lg p-4 space-y-4 bg-white"
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Profile key */}
                        <FormField
                          control={form.control}
                          name={`profiles.${index}.key`}
                          render={({ field }) => (
                            <FormItem className="w-20">
                              <FormLabel className="text-xs">Clé</FormLabel>
                              <FormControl>
                                <Input
                                  className="text-center uppercase font-bold"
                                  placeholder="A"
                                  maxLength={5}
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Profile name */}
                        <FormField
                          control={form.control}
                          name={`profiles.${index}.name`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel className="text-xs">Nom du profil</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="HEINEKEN – L'ICONIQUE"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Delete button */}
                        {profileFields.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="mt-6 text-destructive hover:text-destructive"
                            onClick={() => removeProfile(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {/* Profile description */}
                      <FormField
                        control={form.control}
                        name={`profiles.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Ta manière de rendre le quotidien légendaire..."
                                className="min-h-[60px] text-sm"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Profile image style */}
                      <FormField
                        control={form.control}
                        name={`profiles.${index}.imageStyle`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Style visuel pour l&apos;IA</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="En terrasse à Amsterdam, en train de prendre l'apéro..."
                                className="min-h-[40px] text-sm"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Utilisé dans le prompt IA via {'{'}
                              {form.getValues('name') || 'nom'}_profile_image_style{'}'}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                </div>

                {formErrors.profiles && (
                  <p className="text-sm text-destructive">{formErrors.profiles.message}</p>
                )}

                {/* Navigation to next tab */}
                <div className="flex justify-end pt-4">
                  <Button
                    type="button"
                    onClick={() => setActiveTab('mapping')}
                    disabled={!hasValidProfiles}
                  >
                    Suivant : Mapping des questions →
                  </Button>
                </div>

                {!hasValidProfiles && (
                  <p className="text-xs text-muted-foreground text-right">
                    Définissez au moins 2 profils avec des clés pour continuer
                  </p>
                )}
              </TabsContent>

              {/* Tab 2: Question Mapping */}
              <TabsContent value="mapping" className="mt-4 space-y-4">
                {!hasValidProfiles ? (
                  <Alert>
                    <AlertDescription className="flex items-center justify-between">
                      <span>Définissez d&apos;abord au moins 2 profils dans l&apos;onglet précédent</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveTab('profiles')}
                      >
                        ← Retour aux profils
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div>
                      <h3 className="text-sm font-medium">Questions à inclure dans le scoring</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Sélectionnez les questions et associez chaque réponse à un profil
                      </p>
                    </div>

                    {/* Quick profile keys reference */}
                    <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <span className="text-xs font-medium text-muted-foreground">Profils disponibles :</span>
                      {profiles
                        .filter((p) => p.key && p.name)
                        .map((profile, idx) => (
                          <Badge key={`${profile.key}-${idx}`} variant="outline" className="font-normal">
                            <span className="font-bold mr-1">{profile.key.toUpperCase()}</span>
                            {profile.name}
                          </Badge>
                        ))}
                    </div>

                    {choiceQuestions.length === 0 ? (
                      <Alert>
                        <AlertDescription>
                          Aucune question de type &quot;choice&quot; n&apos;a été configurée dans l&apos;étape 3.
                          Ajoutez des questions à choix multiples pour utiliser le quiz scoring.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="space-y-2">
                        {choiceQuestions.map((question) => {
                          const isSelected = selectedQuestionIds.includes(question.id)
                          const isExpanded = expandedQuestions.has(question.id)
                          const questionMapping = questionMappings.find(
                            (m) => m.elementId === question.id
                          )

                          return (
                            <div
                              key={question.id}
                              className={cn(
                                'border rounded-lg transition-all',
                                isSelected ? 'border-amber-500 bg-amber-50/50' : 'border-gray-200 bg-gray-50/50'
                              )}
                            >
                              {/* Question header */}
                              <div className="p-3 flex items-start gap-3">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleQuestionSelection(question.id)}
                                  className="mt-1"
                                />
                                <div
                                  className={cn(
                                    'flex-1 cursor-pointer',
                                    !isSelected && 'opacity-60'
                                  )}
                                  onClick={() => isSelected && toggleQuestionExpansion(question.id)}
                                >
                                  <div className="flex items-center gap-2">
                                    {isSelected && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          toggleQuestionExpansion(question.id)
                                        }}
                                        className="text-muted-foreground hover:text-foreground"
                                      >
                                        {isExpanded ? (
                                          <ChevronDown className="h-4 w-4" />
                                        ) : (
                                          <ChevronRight className="h-4 w-4" />
                                        )}
                                      </button>
                                    )}
                                    <span className="text-sm font-medium">{question.question}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {question.options?.length || 0} options
                                  </p>
                                </div>
                              </div>

                              {/* Options mapping with dropdowns - only if selected and expanded */}
                              {isSelected && isExpanded && questionMapping && (
                                <div className="border-t bg-white p-3 space-y-3">
                                  <p className="text-xs font-medium text-muted-foreground">
                                    Associer chaque option à un profil :
                                  </p>
                                  {question.options?.map((option) => {
                                    const optionMapping = questionMapping.optionMappings.find(
                                      (om) => om.optionText === option
                                    )
                                    const selectedKey = optionMapping?.profileKey || ''

                                    return (
                                      <div key={option} className="flex items-center gap-3">
                                        <span className="flex-1 text-sm truncate" title={option}>
                                          {option}
                                        </span>
                                        <Select
                                          value={selectedKey}
                                          onValueChange={(value) =>
                                            updateOptionMapping(question.id, option, value)
                                          }
                                        >
                                          <SelectTrigger className="w-[200px]">
                                            <SelectValue placeholder="Choisir un profil" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {profiles
                                              .filter((p) => p.key && p.name)
                                              .filter((p, idx, arr) =>
                                                arr.findIndex((x) => x.key.toUpperCase() === p.key.toUpperCase()) === idx
                                              )
                                              .map((profile) => (
                                                <SelectItem
                                                  key={profile.key.toUpperCase()}
                                                  value={profile.key.toUpperCase()}
                                                >
                                                  <span className="font-bold mr-2">
                                                    {profile.key.toUpperCase()}
                                                  </span>
                                                  {profile.name}
                                                </SelectItem>
                                              ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {formErrors.selectedQuestionIds && (
                      <p className="text-sm text-destructive">
                        {formErrors.selectedQuestionIds.message}
                      </p>
                    )}

                    {/* Status message */}
                    {selectedQuestionIds.length > 0 && !hasCompleteMappings() && (
                      <Alert>
                        <AlertDescription>
                          {getUnmappedCount()} option(s) non mappée(s). Associez chaque option à un profil.
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={!hasValidProfiles || !hasCompleteMappings()}>
                Sauvegarder
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
