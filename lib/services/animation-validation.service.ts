// Animation validation service for Step 8 publication validation
// Validates that animation configuration is complete before publication

import type { AnimationData } from '@/lib/stores/wizard.store'

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean
  errors: { section: string; message: string }[]
}

/**
 * Validation error sections
 */
export type ValidationSection =
  | 'generalInfo'
  | 'dataCollection'
  | 'pipeline'
  | 'accessConfig'
  | 'email'
  | 'publicDisplay'
  | 'customization'

/**
 * Validate animation data for publication
 * Checks required fields according to AC-3.9.4:
 * 1. Name present
 * 2. At least 1 input collection (selfie OR baseField OR advancedInput)
 * 3. Pipeline with at least 1 AI generation block
 * 4. Slug present
 *
 * @param data - Animation data from wizard store
 * @returns ValidationResult with isValid flag and error list
 */
export function validateForPublication(data: AnimationData): ValidationResult {
  const errors: { section: ValidationSection; message: string }[] = []

  // Validation 1: Name present
  if (!data.name || data.name.trim() === '') {
    errors.push({
      section: 'generalInfo',
      message: 'Le nom de l\'animation est requis',
    })
  }

  // Validation 2: At least 1 input collection
  const hasBaseField =
    data.baseFields?.name.enabled ||
    data.baseFields?.firstName.enabled ||
    data.baseFields?.email.enabled

  const hasAdvancedInput =
    data.inputCollection?.elements &&
    data.inputCollection.elements.filter((el) => el.type !== 'selfie').length > 0

  const hasSelfie =
    data.inputCollection?.elements &&
    data.inputCollection.elements.some((el) => el.type === 'selfie')

  if (!hasBaseField && !hasAdvancedInput && !hasSelfie) {
    errors.push({
      section: 'dataCollection',
      message: 'Au moins un champ de collecte doit être activé (champ de base, question ou selfie)',
    })
  }

  // Validation 3: Pipeline with at least 1 AI generation block
  const hasAiBlock =
    data.pipeline &&
    data.pipeline.some((block) => block.type === 'ai-generation')

  if (!hasAiBlock) {
    errors.push({
      section: 'pipeline',
      message: 'Le pipeline doit contenir au moins un bloc de génération IA',
    })
  }

  // Validation 4: Slug present
  if (!data.slug || data.slug.trim() === '') {
    errors.push({
      section: 'generalInfo',
      message: 'Le slug est requis',
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Check if a specific section is complete
 * Used for displaying section status badges
 *
 * @param data - Animation data
 * @param section - Section to check
 * @returns boolean indicating if section is complete
 */
export function isSectionComplete(
  data: AnimationData,
  section: ValidationSection
): boolean {
  switch (section) {
    case 'generalInfo':
      return !!(data.name && data.name.trim() !== '' && data.slug && data.slug.trim() !== '')

    case 'accessConfig':
      // Access config is always complete (defaults to 'none')
      return true

    case 'dataCollection':
      const hasAnyInput =
        data.baseFields?.name.enabled ||
        data.baseFields?.firstName.enabled ||
        data.baseFields?.email.enabled ||
        (data.inputCollection?.elements && data.inputCollection.elements.length > 0)
      return !!hasAnyInput

    case 'pipeline':
      return !!(
        data.pipeline &&
        data.pipeline.length > 0 &&
        data.pipeline.some((block) => block.type === 'ai-generation')
      )

    case 'email':
      // Email is always complete (can be disabled)
      return true

    case 'publicDisplay':
      // Public display is always complete (has defaults)
      return true

    case 'customization':
      // Customization is always complete (has defaults)
      return true

    default:
      return true
  }
}

/**
 * Get all sections with their completion status
 * Used for displaying section badges in Step 8
 *
 * @param data - Animation data
 * @returns Object with section names as keys and completion status as values
 */
export function getSectionStatuses(
  data: AnimationData
): Record<ValidationSection, boolean> {
  return {
    generalInfo: isSectionComplete(data, 'generalInfo'),
    accessConfig: isSectionComplete(data, 'accessConfig'),
    dataCollection: isSectionComplete(data, 'dataCollection'),
    pipeline: isSectionComplete(data, 'pipeline'),
    email: isSectionComplete(data, 'email'),
    publicDisplay: isSectionComplete(data, 'publicDisplay'),
    customization: isSectionComplete(data, 'customization'),
  }
}
