import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ImageUsageMode, ImageSourceType } from '@/lib/types'

// Base field configuration type
export interface BaseFieldConfig {
  enabled: boolean
  required: boolean
  label?: string
  placeholder?: string
}

// AI Consent configuration type (Story 3.12)
export interface AiConsent {
  enabled: boolean // false by default
  required: boolean // false by default - if true, participant must accept
  label: string // HTML string from WYSIWYG editor
}

// Step 3: Input Collection types
export type InputElementType = 'selfie' | 'choice' | 'slider' | 'free-text'

export interface InputElement {
  id: string // UUID
  type: InputElementType
  order: number // 0-indexed

  // Common fields (except selfie)
  question?: string // max 500 chars
  required?: boolean // default true

  // Choice fields
  options?: string[] // min 2, max 6, each max 100 chars

  // Slider fields
  min?: number
  max?: number
  minLabel?: string // max 50 chars
  maxLabel?: string // max 50 chars

  // Free-text fields
  maxLength?: number // 50-2000
  placeholder?: string // max 100 chars
}

export interface InputCollection {
  elements: InputElement[]
}

// Step 4: Pipeline types
export type PipelineBlockType = 'preprocessing' | 'ai-generation' | 'postprocessing'
export type BlockName = 'crop-resize' | 'ai-generation' | 'filters'

export interface PipelineBlockConfig {
  // Crop & Resize
  format?: 'square' | '16:9' | '4:3' | 'original'
  dimensions?: number // 256-2048

  // IA Generation
  modelId?: string // 'dall-e-3', 'gpt-image-1', 'imagen-4.0-generate-001'
  promptTemplate?: string // max 2000 chars

  // Image configuration (for AI generation blocks)
  imageUsageMode?: ImageUsageMode    // 'none' | 'reference' | 'edit'
  imageSource?: ImageSourceType       // 'selfie' | 'url' | 'ai-block-output'
  imageUrl?: string                   // URL if imageSource === 'url'
  sourceBlockId?: string              // Block ID if imageSource === 'ai-block-output'

  // Filters (future)
  filters?: string[]
}

export interface PipelineBlock {
  id: string // UUID
  type: PipelineBlockType
  blockName: BlockName
  order: number // 0-indexed
  config: PipelineBlockConfig
}

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

// Re-export defaults from centralized constants
export {
  DEFAULT_LOADING_MESSAGES,
  DEFAULT_PUBLIC_DISPLAY_CONFIG,
  DEFAULT_TEXT_CARD,
  DEFAULT_CUSTOMIZATION,
} from '@/lib/constants/wizard-defaults'

// Step 8: Animation Summary type for recap display
export interface AnimationSummary {
  generalInfo: {
    name: string
    description?: string
    slug: string
  }
  accessConfig: {
    type: string
    displayText: string // "Accès libre" | "Code requis: XXX" | "Domaines: ..."
  }
  dataCollection: {
    baseFieldsCount: number
    baseFields: { label: string; fieldType: string; active: boolean }[]
    advancedInputsCount: number
    advancedInputs: { label: string; type: string }[]
    selfieRequired: boolean
    totalFields: number
  }
  pipeline: {
    blocksCount: number
    aiModel: string
    blocks: { type: string; summary: string }[]
    hasAiBlock: boolean
  }
  email: {
    enabled: boolean
    subject?: string
    variablesCount?: number
  }
  publicDisplay: {
    enabled: boolean
    layout?: string
    columns?: number
    autoScroll?: boolean
    autoScrollSpeed?: string
    refreshInterval?: number
  }
  customization: {
    primaryColor: string
    secondaryColor: string
    hasLogo: boolean
    logoUrl?: string
    theme: string
    loadingMessagesCount: number
  }
  isComplete: boolean
  validationErrors: { section: string; message: string }[]
}

// Animation data type (partial during wizard)
export interface AnimationData {
  _id?: string
  name?: string
  slug?: string
  description?: string
  status?: 'draft' | 'published' | 'archived'
  // Step 2: Access Config + Base Fields
  accessConfig?: {
    type: 'none' | 'code' | 'email-domain'
    code?: string
    emailDomains?: string[]
  }
  baseFields?: {
    name: BaseFieldConfig
    firstName: BaseFieldConfig
    email: BaseFieldConfig
    aiConsent?: AiConsent // Story 3.12 - AI authorization toggle
  }
  // Step 3: Input Collection (advanced inputs)
  inputCollection?: InputCollection
  // Step 4: Pipeline
  pipeline?: PipelineBlock[]
  aiModel?: {
    modelId: string
    prompt: string
    variables: string[]
  }
  // Step 5: Email Config
  emailConfig?: {
    enabled: boolean
    subject?: string
    bodyTemplate?: string
    senderName: string
    senderEmail: string
  }
  // Step 6: Public Display Config
  publicDisplayConfig?: PublicDisplayConfig
  // Step 7: Customization
  customization?: Customization
  // Legacy fields (deprecated)
  displayConfig?: {
    enabled: boolean
    layout: string
    columns: number
    showNames: boolean
    refreshInterval: number
  }
  qrCodeUrl?: string
  publishedAt?: Date
  [key: string]: any
}

// Store state type
interface WizardState {
  currentStep: number // 1-8
  animationId: string | null
  animationData: AnimationData
  isLoading: boolean
  error: string | null
}

// Store actions type
interface WizardActions {
  setStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  updateData: (data: Partial<AnimationData>) => void
  setAnimationId: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  resetWizard: () => void
}

// Combined type
type WizardStore = WizardState & WizardActions

// Default state
const initialState: WizardState = {
  currentStep: 1,
  animationId: null,
  animationData: {},
  isLoading: false,
  error: null,
}

/**
 * Zustand wizard store
 * Stores wizard state in memory only (no persistence for animationData)
 * Only animationId is persisted in localStorage for editing resumption
 */
export const useWizardStore = create<WizardStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * Set current step (1-8)
       */
      setStep: (step: number) => {
        if (step < 1 || step > 8) {
          // Invalid step - silently ignore
          return
        }
        set({ currentStep: step })
      },

      /**
       * Move to next step
       */
      nextStep: () => {
        const current = get().currentStep
        if (current < 8) {
          set({ currentStep: current + 1 })
        }
      },

      /**
       * Move to previous step
       */
      prevStep: () => {
        const current = get().currentStep
        if (current > 1) {
          set({ currentStep: current - 1 })
        }
      },

      /**
       * Update animation data (partial merge)
       */
      updateData: (data: Partial<AnimationData>) => {
        set((state) => ({
          animationData: {
            ...state.animationData,
            ...data,
          },
        }))
      },

      /**
       * Set animation ID (after creation in Step 1)
       */
      setAnimationId: (id: string) => {
        set({ animationId: id })
      },

      /**
       * Set loading state
       */
      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      /**
       * Set error message
       */
      setError: (error: string | null) => {
        set({ error })
      },

      /**
       * Reset wizard to initial state
       */
      resetWizard: () => {
        set(initialState)
      },
    }),
    {
      name: 'wizard-storage', // localStorage key
      partialize: (state) => ({ animationId: state.animationId }), // Only persist animationId
    }
  )
)

/**
 * Email config interface (Step 5)
 */
export interface EmailConfigData {
  enabled: boolean
  subject?: string
  bodyTemplate?: string
  senderName: string
  senderEmail: string
}

// Re-export email defaults from centralized constants
export { DEFAULT_EMAIL_CONFIG } from '@/lib/constants/wizard-defaults'

/**
 * Helper: Get available variables for prompt template
 * Returns array of variable names like ['{nom}', '{prenom}', '{email}', '{question1}', '{question2}']
 */
export const getAvailableVariables = (data: AnimationData): string[] => {
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

  return vars
}

/**
 * Helper: Get available email variables
 * Returns array of variable names including system variables like {imageUrl}
 */
export const getAvailableEmailVariables = (data: AnimationData): string[] => {
  const vars = getAvailableVariables(data)

  // Add system variables for email
  vars.push('{imageUrl}')

  return vars
}
