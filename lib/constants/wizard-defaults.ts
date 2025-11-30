/**
 * Wizard Default Constants
 * Centralized default values for all wizard steps
 */

import type {
  Customization,
  TextCard,
  PublicDisplayConfig,
} from '@/lib/stores/wizard.store'

// ============================================
// STEP 5: EMAIL CONFIGURATION DEFAULTS
// ============================================

/**
 * Default email configuration
 */
export const DEFAULT_EMAIL_CONFIG = {
  enabled: false,
  senderName: 'AppsByMCI',
  senderEmail: 'noreply@appsbymci.com',
}

/**
 * Default email template (HTML)
 */
export const DEFAULT_EMAIL_TEMPLATE = `<p>Bonjour {nom},</p>
<p>Ton image générée par IA est prête !</p>
<p><img src="{imageUrl}" alt="Ton résultat" style="max-width: 600px; border-radius: 8px;" /></p>
<p>Merci d'avoir participé à notre événement.</p>`

/**
 * Default email subject
 */
export const DEFAULT_EMAIL_SUBJECT = 'Ton résultat {nom} est prêt !'

// ============================================
// STEP 6: PUBLIC DISPLAY DEFAULTS
// ============================================

/**
 * Default public display configuration
 */
export const DEFAULT_PUBLIC_DISPLAY_CONFIG: PublicDisplayConfig = {
  enabled: true,
  layout: 'masonry',
  columns: 3,
  autoScroll: true,
  autoScrollSpeed: 'medium',
  showParticipantName: true,
  refreshInterval: 10,
}

// ============================================
// STEP 7: CUSTOMIZATION DEFAULTS
// ============================================

/**
 * Default loading messages for Step 7
 */
export const DEFAULT_LOADING_MESSAGES = [
  '🎨 L\'IA travaille sur ton image...',
  '✨ Génération en cours...',
  '🚀 Presque terminé...',
  '⏳ Encore quelques secondes...',
]

/**
 * Default text card configuration
 */
export const DEFAULT_TEXT_CARD: TextCard = {
  enabled: true,
  backgroundColor: '#FFFFFF',
  opacity: 90,
  borderRadius: 12,
  padding: 16,
}

/**
 * Default customization configuration
 */
export const DEFAULT_CUSTOMIZATION: Customization = {
  primaryColor: '#000000',
  secondaryColor: '#71717a',
  backgroundColorOpacity: 50,
  textCard: DEFAULT_TEXT_CARD,
  theme: 'auto',
  submissionMessage: 'Merci ! Votre résultat arrive...',
  loadingMessages: DEFAULT_LOADING_MESSAGES,
  thankYouMessage: 'Merci d\'avoir participé !',
}

// ============================================
// WIZARD STEP TITLES
// ============================================

/**
 * Step titles for wizard stepper
 */
export const WIZARD_STEP_TITLES = [
  'Informations générales',
  'Configuration d\'accès',
  'Collecte des données',
  'Pipeline de traitement',
  'Configuration email',
  'Écran public',
  'Personnalisation',
  'Récapitulatif & Publication',
]

/**
 * Total number of wizard steps
 */
export const WIZARD_TOTAL_STEPS = 8
