import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Base field configuration type
export interface BaseFieldConfig {
  enabled: boolean
  required: boolean
  label?: string
  placeholder?: string
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

// Animation data type (partial during wizard)
export interface AnimationData {
  _id?: string
  name?: string
  slug?: string
  description?: string
  status?: 'draft' | 'published' | 'archived'
  accessValidation?: {
    type: 'open' | 'code' | 'email'
    value?: string
  }
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
  }
  // Step 3: Input Collection (advanced inputs)
  inputCollection?: InputCollection
  questions?: any[]
  pipeline?: any[]
  aiModel?: {
    modelId: string
    prompt: string
    variables: string[]
  }
  emailConfig?: {
    enabled: boolean
    subject: string
    template: string
    sender: string
  }
  displayConfig?: {
    enabled: boolean
    layout: string
    columns: number
    showNames: boolean
    refreshInterval: number
  }
  customization?: {
    colors: Record<string, string>
    logo?: string
    theme: string
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
