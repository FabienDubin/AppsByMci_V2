import { create } from 'zustand'

/**
 * Participant answer type for input collection questions
 */
export interface ParticipantAnswer {
  elementId: string
  type: 'choice' | 'slider' | 'free-text'
  value: string | number
}

/**
 * Participant form data
 */
export interface ParticipantFormData {
  // Base fields (Step 2 configuration)
  nom?: string
  prenom?: string
  email?: string
  accessCode?: string
  aiConsentAccepted?: boolean

  // Advanced inputs (Step 3)
  selfie?: string // Base64 or blob URL
  answers: ParticipantAnswer[]
}

/**
 * Wizard phase type
 * - form: collecting participant data
 * - processing: showing loading screen after submission
 */
export type WizardPhase = 'form' | 'processing'

/**
 * Store state type
 */
interface ParticipantFormState {
  currentStep: number
  totalSteps: number
  formData: ParticipantFormData
  isSubmitting: boolean
  error: string | null
  wizardPhase: WizardPhase
  generationId: string | null
}

/**
 * Store actions type
 */
interface ParticipantFormActions {
  // Navigation
  setStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  setTotalSteps: (total: number) => void

  // Form data
  setField: <K extends keyof ParticipantFormData>(
    field: K,
    value: ParticipantFormData[K]
  ) => void
  setAnswer: (answer: ParticipantAnswer) => void
  setSelfie: (selfie: string | undefined) => void

  // State management
  setSubmitting: (submitting: boolean) => void
  setError: (error: string | null) => void
  setWizardPhase: (phase: WizardPhase) => void
  setGenerationId: (id: string | null) => void
  reset: () => void
}

// Combined type
type ParticipantFormStore = ParticipantFormState & ParticipantFormActions

// Default state
const initialState: ParticipantFormState = {
  currentStep: 1,
  totalSteps: 1,
  formData: {
    answers: [],
  },
  isSubmitting: false,
  error: null,
  wizardPhase: 'form',
  generationId: null,
}

/**
 * Zustand store for participant form wizard
 * Manages multi-step form state for participant experience
 * Not persisted - resets on page refresh (intentional for privacy)
 */
export const useParticipantFormStore = create<ParticipantFormStore>()((set, get) => ({
  ...initialState,

  /**
   * Set current step directly
   */
  setStep: (step: number) => {
    const { totalSteps } = get()
    if (step >= 1 && step <= totalSteps) {
      set({ currentStep: step })
    }
  },

  /**
   * Move to next step
   */
  nextStep: () => {
    const { currentStep, totalSteps } = get()
    if (currentStep < totalSteps) {
      set({ currentStep: currentStep + 1 })
    }
  },

  /**
   * Move to previous step
   */
  prevStep: () => {
    const { currentStep } = get()
    if (currentStep > 1) {
      set({ currentStep: currentStep - 1 })
    }
  },

  /**
   * Set total number of steps
   */
  setTotalSteps: (total: number) => {
    set({ totalSteps: Math.max(1, total) })
  },

  /**
   * Set a form field value
   */
  setField: (field, value) => {
    set((state) => ({
      formData: {
        ...state.formData,
        [field]: value,
      },
    }))
  },

  /**
   * Set or update an answer for a question
   */
  setAnswer: (answer: ParticipantAnswer) => {
    set((state) => {
      const existingIndex = state.formData.answers.findIndex(
        (a) => a.elementId === answer.elementId
      )

      const newAnswers = [...state.formData.answers]
      if (existingIndex >= 0) {
        newAnswers[existingIndex] = answer
      } else {
        newAnswers.push(answer)
      }

      return {
        formData: {
          ...state.formData,
          answers: newAnswers,
        },
      }
    })
  },

  /**
   * Set selfie image
   */
  setSelfie: (selfie: string | undefined) => {
    set((state) => ({
      formData: {
        ...state.formData,
        selfie,
      },
    }))
  },

  /**
   * Set submitting state
   */
  setSubmitting: (submitting: boolean) => {
    set({ isSubmitting: submitting })
  },

  /**
   * Set error message
   */
  setError: (error: string | null) => {
    set({ error })
  },

  /**
   * Set wizard phase (form/processing)
   */
  setWizardPhase: (phase: WizardPhase) => {
    set({ wizardPhase: phase })
  },

  /**
   * Set generation ID after successful submission
   */
  setGenerationId: (id: string | null) => {
    set({ generationId: id })
  },

  /**
   * Reset store to initial state
   */
  reset: () => {
    set(initialState)
  },
}))
