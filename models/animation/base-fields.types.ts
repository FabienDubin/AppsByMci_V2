// Base fields configuration types (Step 2)

/**
 * Base field configuration (Step 2)
 */
export interface IBaseFieldConfig {
  enabled: boolean
  required: boolean
  label?: string // Customizable label (default: "Nom", "Prénom", "Email")
  placeholder?: string // Customizable placeholder
}

/**
 * AI Consent configuration (Step 2 - Story 3.12)
 */
export interface IAiConsent {
  enabled: boolean // false by default
  required: boolean // false by default - if true, participant must accept
  label: string // HTML string from WYSIWYG editor
}

/**
 * Base fields configuration (Step 2)
 */
export interface IBaseFields {
  name: IBaseFieldConfig
  firstName: IBaseFieldConfig
  email: IBaseFieldConfig
  aiConsent?: IAiConsent // Story 3.12 - AI authorization toggle
}
