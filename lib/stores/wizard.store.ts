import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
