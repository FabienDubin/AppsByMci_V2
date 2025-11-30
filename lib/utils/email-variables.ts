/**
 * Email Variables Utility
 * Handles variable detection, validation, and placeholder replacement for email templates
 */

import type { AnimationData } from '@/lib/stores/wizard.store'

/**
 * Variable mapping for display in preview
 */
const VARIABLE_DISPLAY_MAP: Record<string, string> = {
  '{nom}': '[NOM]',
  '{prenom}': '[PRENOM]',
  '{email}': '[EMAIL]',
  '{imageUrl}': '[IMAGE]',
}

/**
 * Get available email variables from animation data
 * Returns array like ['{nom}', '{prenom}', '{email}', '{question1}', '{imageUrl}']
 */
export const getAvailableEmailVariables = (data: AnimationData): string[] => {
  const vars: string[] = []

  // Base fields from Step 2
  if (data.baseFields?.name.enabled) vars.push('{nom}')
  if (data.baseFields?.firstName.enabled) vars.push('{prenom}')
  if (data.baseFields?.email.enabled) vars.push('{email}')

  // Input collection from Step 3 (exclude selfie, use question1, question2 etc.)
  let questionIndex = 1
  data.inputCollection?.elements.forEach((el) => {
    if (el.type !== 'selfie') {
      vars.push(`{question${questionIndex}}`)
      questionIndex++
    }
  })

  // System variables
  vars.push('{imageUrl}')

  return vars
}

/**
 * Detect all variables in a text using regex
 * Returns array of detected variables like ['{nom}', '{question1}']
 */
export const detectVariablesInText = (text: string): string[] => {
  if (!text) return []

  const regex = /\{[a-zA-Z0-9_]+\}/g
  const matches = text.match(regex)

  return matches ? [...new Set(matches)] : []
}

/**
 * Validate variables in text against list of valid variables
 * Returns array of invalid variables
 */
export const validateVariables = (text: string, validVars: string[]): string[] => {
  const detectedVars = detectVariablesInText(text)
  const invalidVars = detectedVars.filter((v) => !validVars.includes(v))
  return invalidVars
}

/**
 * Get display placeholder for a variable
 * {nom} → [NOM], {question1} → [RÉPONSE 1]
 */
const getVariableDisplay = (variable: string): string => {
  // Check predefined mapping
  if (VARIABLE_DISPLAY_MAP[variable]) {
    return VARIABLE_DISPLAY_MAP[variable]
  }

  // Handle question variables: {question1} → [RÉPONSE 1]
  const questionMatch = variable.match(/\{question(\d+)\}/)
  if (questionMatch) {
    return `[RÉPONSE ${questionMatch[1]}]`
  }

  // Fallback: just uppercase the variable name
  const varName = variable.replace(/[{}]/g, '').toUpperCase()
  return `[${varName}]`
}

/**
 * Replace variables with styled HTML placeholders for preview
 * {nom} → <span class="variable-placeholder">[NOM]</span>
 */
export const replaceVariablesWithPlaceholders = (
  template: string,
  validVars: string[] = []
): string => {
  if (!template) return ''

  let result = template

  // Find all variables in the template
  const variables = detectVariablesInText(template)

  // Replace each variable with styled placeholder
  variables.forEach((variable) => {
    const display = getVariableDisplay(variable)
    const isValid = validVars.length === 0 || validVars.includes(variable)

    // Special handling for imageUrl - replace entire <img> tag with placeholder
    if (variable === '{imageUrl}') {
      // Match <img src="{imageUrl}" ...> and replace whole tag
      const imgTagRegex = /<img[^>]*src=["']\{imageUrl\}["'][^>]*>/gi
      const imgPlaceholder = `<div style="display: inline-block; background: #e2e8f0; padding: 32px 64px; border-radius: 8px; color: #64748b; font-size: 14px; text-align: center; border: 2px dashed #cbd5e1;">🖼️ Image générée (aperçu)</div>`
      result = result.replace(imgTagRegex, imgPlaceholder)

      // Also replace standalone {imageUrl} if not in img tag
      result = result.replace(new RegExp(escapeRegExp(variable), 'g'), '[IMAGE_URL]')
    } else {
      // Regular variable - show as styled placeholder
      const className = isValid ? 'text-primary font-semibold' : 'text-destructive font-semibold'
      const replacement = `<span class="${className}">${display}</span>`
      result = result.replace(new RegExp(escapeRegExp(variable), 'g'), replacement)
    }
  })

  return result
}

/**
 * Replace variables with styled HTML placeholders for subject preview (no HTML)
 * Returns plain text with [PLACEHOLDER] format
 */
export const replaceSubjectVariables = (
  subject: string,
  validVars: string[] = []
): { text: string; invalidVars: string[] } => {
  if (!subject) return { text: '', invalidVars: [] }

  let result = subject
  const variables = detectVariablesInText(subject)
  const invalidVars: string[] = []

  variables.forEach((variable) => {
    const display = getVariableDisplay(variable)
    const isValid = validVars.length === 0 || validVars.includes(variable)

    if (!isValid) {
      invalidVars.push(variable)
    }

    result = result.replace(new RegExp(escapeRegExp(variable), 'g'), display)
  })

  return { text: result, invalidVars }
}

/**
 * Generate variables tooltip content
 */
export const getVariablesTooltipContent = (
  availableVars: string[],
  includeExamples: boolean = true
): string => {
  const lines: string[] = ['Variables disponibles :']

  // Categorize variables
  const baseFields = availableVars.filter((v) =>
    ['{nom}', '{prenom}', '{email}'].includes(v)
  )
  const questions = availableVars.filter((v) => v.startsWith('{question'))
  const system = availableVars.filter((v) => v === '{imageUrl}')

  if (baseFields.length > 0) {
    lines.push(`• Champs participant : ${baseFields.join(', ')}`)
  }

  if (questions.length > 0) {
    lines.push(`• Questions : ${questions.join(', ')}`)
  }

  if (system.length > 0) {
    lines.push(`• Système : ${system.join(', ')}`)
  }

  if (includeExamples && availableVars.length > 0) {
    lines.push('')
    lines.push('Exemple :')
    if (baseFields.includes('{nom}')) {
      lines.push('"Salut {nom}, ton avatar est prêt !"')
    } else {
      lines.push('"Ton résultat est prêt !"')
    }
  }

  return lines.join('\n')
}

/**
 * Default email template
 */
export const DEFAULT_EMAIL_TEMPLATE = `<p>Bonjour {nom},</p>
<p>Ton image générée par IA est prête !</p>
<p><img src="{imageUrl}" alt="Ton résultat" style="max-width: 600px; border-radius: 8px;" /></p>
<p>Merci d'avoir participé à notre événement.</p>`

/**
 * Default email subject
 */
export const DEFAULT_EMAIL_SUBJECT = 'Ton résultat {nom} est prêt !'

/**
 * Escape special regex characters in a string
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
