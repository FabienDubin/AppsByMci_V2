import { useParticipantFormStore } from '@/lib/stores/participantForm.store'

describe('participantFormStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useParticipantFormStore.getState().reset()
  })

  describe('Initial state', () => {
    it('should have correct initial values', () => {
      const state = useParticipantFormStore.getState()

      expect(state.currentStep).toBe(1)
      expect(state.totalSteps).toBe(1)
      expect(state.formData.answers).toEqual([])
      expect(state.isSubmitting).toBe(false)
      expect(state.error).toBeNull()
    })
  })

  describe('Navigation', () => {
    beforeEach(() => {
      // Set up 5 steps for navigation tests
      useParticipantFormStore.getState().setTotalSteps(5)
    })

    it('should move to next step', () => {
      const { nextStep } = useParticipantFormStore.getState()

      nextStep()
      expect(useParticipantFormStore.getState().currentStep).toBe(2)

      nextStep()
      expect(useParticipantFormStore.getState().currentStep).toBe(3)
    })

    it('should not go beyond total steps', () => {
      const { setStep, nextStep } = useParticipantFormStore.getState()

      setStep(5)
      nextStep()
      expect(useParticipantFormStore.getState().currentStep).toBe(5)
    })

    it('should move to previous step', () => {
      const { setStep, prevStep } = useParticipantFormStore.getState()

      setStep(3)
      prevStep()
      expect(useParticipantFormStore.getState().currentStep).toBe(2)
    })

    it('should not go below step 1', () => {
      const { prevStep } = useParticipantFormStore.getState()

      prevStep()
      expect(useParticipantFormStore.getState().currentStep).toBe(1)
    })

    it('should set step directly within bounds', () => {
      const { setStep } = useParticipantFormStore.getState()

      setStep(3)
      expect(useParticipantFormStore.getState().currentStep).toBe(3)

      setStep(1)
      expect(useParticipantFormStore.getState().currentStep).toBe(1)
    })

    it('should not set step outside bounds', () => {
      const { setStep } = useParticipantFormStore.getState()

      setStep(10)
      expect(useParticipantFormStore.getState().currentStep).toBe(1) // Unchanged

      setStep(0)
      expect(useParticipantFormStore.getState().currentStep).toBe(1) // Unchanged
    })

    it('should update total steps', () => {
      const { setTotalSteps } = useParticipantFormStore.getState()

      setTotalSteps(10)
      expect(useParticipantFormStore.getState().totalSteps).toBe(10)

      // Minimum 1 step
      setTotalSteps(0)
      expect(useParticipantFormStore.getState().totalSteps).toBe(1)
    })
  })

  describe('Form data', () => {
    it('should set field values', () => {
      const { setField } = useParticipantFormStore.getState()

      setField('nom', 'Jean')
      expect(useParticipantFormStore.getState().formData.nom).toBe('Jean')

      setField('prenom', 'Dupont')
      expect(useParticipantFormStore.getState().formData.prenom).toBe('Dupont')

      setField('email', 'jean@example.com')
      expect(useParticipantFormStore.getState().formData.email).toBe('jean@example.com')

      setField('accessCode', 'CODE123')
      expect(useParticipantFormStore.getState().formData.accessCode).toBe('CODE123')

      setField('aiConsentAccepted', true)
      expect(useParticipantFormStore.getState().formData.aiConsentAccepted).toBe(true)
    })

    it('should set selfie', () => {
      const { setSelfie } = useParticipantFormStore.getState()

      setSelfie('base64-image-data')
      expect(useParticipantFormStore.getState().formData.selfie).toBe('base64-image-data')

      setSelfie(undefined)
      expect(useParticipantFormStore.getState().formData.selfie).toBeUndefined()
    })

    it('should set answers for questions', () => {
      const { setAnswer } = useParticipantFormStore.getState()

      setAnswer({
        elementId: 'question-1',
        type: 'choice',
        value: 'Option A',
      })

      expect(useParticipantFormStore.getState().formData.answers).toHaveLength(1)
      expect(useParticipantFormStore.getState().formData.answers[0].elementId).toBe('question-1')
      expect(useParticipantFormStore.getState().formData.answers[0].value).toBe('Option A')
    })

    it('should update existing answer', () => {
      const { setAnswer } = useParticipantFormStore.getState()

      // Add initial answer
      setAnswer({
        elementId: 'question-1',
        type: 'choice',
        value: 'Option A',
      })

      // Update the same answer
      setAnswer({
        elementId: 'question-1',
        type: 'choice',
        value: 'Option B',
      })

      expect(useParticipantFormStore.getState().formData.answers).toHaveLength(1)
      expect(useParticipantFormStore.getState().formData.answers[0].value).toBe('Option B')
    })

    it('should add multiple answers', () => {
      const { setAnswer } = useParticipantFormStore.getState()

      setAnswer({
        elementId: 'question-1',
        type: 'choice',
        value: 'Option A',
      })

      setAnswer({
        elementId: 'question-2',
        type: 'slider',
        value: 5,
      })

      setAnswer({
        elementId: 'question-3',
        type: 'free-text',
        value: 'My text response',
      })

      expect(useParticipantFormStore.getState().formData.answers).toHaveLength(3)
    })
  })

  describe('State management', () => {
    it('should set submitting state', () => {
      const { setSubmitting } = useParticipantFormStore.getState()

      setSubmitting(true)
      expect(useParticipantFormStore.getState().isSubmitting).toBe(true)

      setSubmitting(false)
      expect(useParticipantFormStore.getState().isSubmitting).toBe(false)
    })

    it('should set error message', () => {
      const { setError } = useParticipantFormStore.getState()

      setError('Something went wrong')
      expect(useParticipantFormStore.getState().error).toBe('Something went wrong')

      setError(null)
      expect(useParticipantFormStore.getState().error).toBeNull()
    })

    it('should reset to initial state but preserve totalSteps', () => {
      const { setField, setTotalSteps, setStep, setAnswer, setError, reset } =
        useParticipantFormStore.getState()

      // Modify state
      setField('nom', 'Jean')
      setField('email', 'jean@example.com')
      setTotalSteps(5)
      setStep(3)
      setAnswer({ elementId: 'q1', type: 'choice', value: 'A' })
      setError('Error')

      // Reset
      reset()

      const state = useParticipantFormStore.getState()
      expect(state.currentStep).toBe(1)
      // totalSteps is preserved as it's determined by animation config, not user input
      expect(state.totalSteps).toBe(5)
      expect(state.formData.nom).toBeUndefined()
      expect(state.formData.email).toBeUndefined()
      expect(state.formData.answers).toEqual([])
      expect(state.error).toBeNull()
    })
  })
})
