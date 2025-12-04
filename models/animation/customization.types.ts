// Customization configuration types (Step 7)

/**
 * Customization configuration (Step 7 - Legacy, kept for backward compatibility)
 */
export interface ICustomizationLegacy {
  colors: Record<string, string>
  logo?: string
  theme: string
}

/**
 * Text Card configuration (Step 7 - New)
 * Overlay card ensuring text readability over backgrounds
 */
export interface ITextCard {
  enabled: boolean
  backgroundColor: string // hex #RRGGBB
  opacity: number // 0-100
  borderRadius: number // 0-24
  padding: number // 8-32
}

/**
 * Customization configuration (Step 7 - New)
 */
export interface ICustomization {
  primaryColor: string // hex #RRGGBB
  secondaryColor: string // hex #RRGGBB
  logo?: string // URL Azure Blob
  backgroundImage?: string // URL Azure Blob
  backgroundColor?: string // hex #RRGGBB
  backgroundColorOpacity?: number // 0-100 (overlay opacity over background image)
  textCard?: ITextCard // Text card overlay configuration
  theme: 'light' | 'dark' | 'auto'
  welcomeMessage?: string // HTML string from WYSIWYG editor (Story 3.13)
  submissionMessage: string // max 100 chars
  loadingMessages: string[] // min 3, max 10
  thankYouMessage: string // max 100 chars
}

/**
 * Default loading messages
 */
export const DEFAULT_LOADING_MESSAGES = [
  "🎨 L'IA travaille sur ton image...",
  '✨ Génération en cours...',
  '🚀 Presque terminé...',
  '⏳ Encore quelques secondes...'
]
