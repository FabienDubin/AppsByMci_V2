/**
 * Wizard Types
 * Extracted from wizard.store.ts to avoid circular dependencies
 */

// Step 6: Public Display Config type
export interface PublicDisplayConfig {
  enabled: boolean
  layout: 'masonry' | 'grid' | 'carousel'
  columns?: number // Required if layout !== 'carousel'
  autoScroll?: boolean // Auto-scroll for Masonry/Grid
  autoScrollSpeed?: 'slow' | 'medium' | 'fast' // Scroll speed
  showParticipantName: boolean
  refreshInterval: number // 5-60 seconds
}

// Step 7: Text Card type
export interface TextCard {
  enabled: boolean
  backgroundColor: string // hex #RRGGBB
  opacity: number // 0-100
  borderRadius: number // 0-24
  padding: number // 8-32
}

// Step 7: Customization type
export interface Customization {
  primaryColor: string // hex #RRGGBB
  secondaryColor: string // hex #RRGGBB
  logo?: string // URL Azure Blob
  backgroundImage?: string // URL Azure Blob
  backgroundColor?: string // hex #RRGGBB
  backgroundColorOpacity?: number // 0-100 (overlay opacity over background image)
  textCard?: TextCard // Text card overlay configuration
  theme: 'light' | 'dark' | 'auto'
  welcomeMessage?: string // HTML string from WYSIWYG editor (Story 3.13)
  submissionMessage: string // max 100 chars, default provided
  loadingMessages: string[] // min 3, max 10
  thankYouMessage: string // max 100 chars, default provided
}

// Email Design type (Step 5)
export interface EmailDesign {
  logoUrl?: string
  backgroundImageUrl?: string
  backgroundColor?: string // hex #RRGGBB, default: #f5f5f5
  backgroundColorOpacity?: number // 0-100, default: 100
  contentBackgroundColor?: string // hex #RRGGBB, default: #ffffff
  contentBackgroundOpacity?: number // 0-100, default: 100
  primaryColor?: string // hex #RRGGBB, default: #4F46E5
  textColor?: string // hex #RRGGBB, default: #333333
  borderRadius?: number // 0-32, default: 12
  ctaText?: string // CTA button text, max 50 chars
  ctaUrl?: string // CTA button URL
}

// Email config interface (Step 5)
export interface EmailConfigData {
  enabled: boolean
  subject?: string
  bodyTemplate?: string
  senderName: string
  senderEmail: string
  design?: EmailDesign
}
