/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ParticipantWizard } from '@/components/participant/ParticipantWizard'
import { useParticipantFormStore } from '@/lib/stores/participantForm.store'
import type { AnimationResponse } from '@/lib/services/animation.service'

// Mock the animation context - using AnimationResponse which has 'id' not '_id'
const mockAnimation: Partial<AnimationResponse> = {
  id: 'anim-1',
  baseFields: {
    name: { enabled: false, required: false },
    firstName: { enabled: false, required: false },
    email: { enabled: false, required: false },
  },
  accessConfig: { type: 'none' },
  inputCollection: {
    elements: [],
  },
}

let mockAnimationValue = mockAnimation

jest.mock('@/components/participant/ParticipantContext', () => ({
  useAnimation: () => mockAnimationValue,
}))

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}))

// Mock fetch for submission tests
global.fetch = jest.fn()

// Import after mocking
import { toast } from 'sonner'

describe('ParticipantWizard - Question Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    useParticipantFormStore.getState().reset()
    mockAnimationValue = { ...mockAnimation }
    // Mock fetch to return success for submission tests
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { generationId: 'gen-123', status: 'pending' } }),
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Choice question validation (AC4, AC11)', () => {
    beforeEach(() => {
      mockAnimationValue = {
        ...mockAnimation,
        baseFields: {
          name: { enabled: false, required: false },
          firstName: { enabled: false, required: false },
          email: { enabled: false, required: false },
        },
        accessConfig: { type: 'none' },
        inputCollection: {
          elements: [
            {
              id: 'choice-1',
              type: 'choice',
              order: 0,
              question: 'Choix test',
              required: true,
              options: ['Option A', 'Option B'],
            },
          ],
        },
      }
    })

    it('should show choice question in wizard', () => {
      render(<ParticipantWizard />)

      expect(screen.getByText('Choix test')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Option A' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Option B' })).toBeInTheDocument()
    })

    it('should not show Next button on choice questions but show Generate avatar if last step', () => {
      render(<ParticipantWizard />)

      // The wizard should not show the Suivant button for choice questions
      expect(screen.queryByRole('button', { name: /Suivant/i })).not.toBeInTheDocument()

      // But should show "Générer mon avatar" since this is the only/last step
      expect(screen.getByRole('button', { name: /Générer mon avatar/i })).toBeInTheDocument()
    })

    it('should save answer to store when choice is selected', () => {
      render(<ParticipantWizard />)

      // Click on an option
      fireEvent.click(screen.getByRole('button', { name: 'Option A' }))

      // Verify the answer is saved to store
      const state = useParticipantFormStore.getState()
      const answer = state.formData.answers.find(a => a.elementId === 'choice-1')
      expect(answer).toEqual({
        elementId: 'choice-1',
        type: 'choice',
        value: 'Option A',
      })
    })

    it('should navigate automatically when choice is selected', async () => {
      mockAnimationValue = {
        ...mockAnimation,
        inputCollection: {
          elements: [
            {
              id: 'choice-1',
              type: 'choice',
              order: 0,
              question: 'Choix test',
              required: true, // Required choice - auto-nav still works because validation is skipped for choice
              options: ['Option A', 'Option B'],
            },
            {
              id: 'slider-1',
              type: 'slider',
              order: 1,
              question: 'Slider test',
              min: 1,
              max: 10,
            },
          ],
        },
      }

      render(<ParticipantWizard />)

      // Click on an option
      fireEvent.click(screen.getByRole('button', { name: 'Option A' }))

      // Wait for auto-navigation delay (500ms for pulse animation)
      act(() => {
        jest.advanceTimersByTime(500)
      })

      // Should now show the slider question (no validation error because choice validation is skipped)
      expect(screen.getByText('Slider test')).toBeInTheDocument()
    })

    it('should show Generate avatar button when choice is the last step', () => {
      // Single choice question as last step
      mockAnimationValue = {
        ...mockAnimation,
        inputCollection: {
          elements: [
            {
              id: 'choice-1',
              type: 'choice',
              order: 0,
              question: 'Choix test',
              required: true,
              options: ['Option A', 'Option B'],
            },
          ],
        },
      }

      render(<ParticipantWizard />)

      // Should show "Générer mon avatar" button for last step choice
      expect(screen.getByRole('button', { name: /Générer mon avatar/i })).toBeInTheDocument()
    })
  })

  describe('Free-text question validation (AC10, AC11)', () => {
    beforeEach(() => {
      mockAnimationValue = {
        ...mockAnimation,
        inputCollection: {
          elements: [
            {
              id: 'freetext-1',
              type: 'free-text',
              order: 0,
              question: 'Question texte',
              required: true,
              maxLength: 200,
              placeholder: 'Écrivez ici',
            },
          ],
        },
      }
    })

    it('should show free-text question in wizard', () => {
      render(<ParticipantWizard />)

      expect(screen.getByText('Question texte')).toBeInTheDocument()
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('should show Generate avatar button for free-text questions on last step', () => {
      render(<ParticipantWizard />)

      // The wizard should show "Générer mon avatar" button for last step
      const button = screen.getByRole('button', { name: /Générer mon avatar/i })
      expect(button).toBeInTheDocument()
    })

    it('should show error when trying to submit empty required free-text', async () => {
      render(<ParticipantWizard />)

      // Try to click Generate avatar without entering text
      const submitButton = screen.getByRole('button', { name: /Générer mon avatar/i })
      fireEvent.click(submitButton)

      // Should show error toast
      expect(toast.error).toHaveBeenCalledWith('Veuillez remplir ce champ')

      // Should show inline error
      expect(screen.getByText('Veuillez remplir ce champ')).toBeInTheDocument()
    })

    it('should not show error when free-text is not required and empty', async () => {
      mockAnimationValue = {
        ...mockAnimation,
        inputCollection: {
          elements: [
            {
              id: 'freetext-1',
              type: 'free-text',
              order: 0,
              question: 'Question optionnelle',
              required: false, // Not required
              maxLength: 200,
            },
          ],
        },
      }

      render(<ParticipantWizard />)

      // Try to click Generate avatar without entering text
      const submitButton = screen.getByRole('button', { name: /Générer mon avatar/i })
      fireEvent.click(submitButton)

      // Should NOT show error (validation passes, API will be called)
      expect(toast.error).not.toHaveBeenCalled()
    })

    it('should allow submission when required free-text has content', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

      render(<ParticipantWizard />)

      // Type some text
      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'My answer')

      // Now click Generate avatar
      const submitButton = screen.getByRole('button', { name: /Générer mon avatar/i })
      fireEvent.click(submitButton)

      // Should NOT show error
      expect(screen.queryByText('Veuillez remplir ce champ')).not.toBeInTheDocument()
    })
  })

  describe('Slider question (AC11)', () => {
    beforeEach(() => {
      mockAnimationValue = {
        ...mockAnimation,
        inputCollection: {
          elements: [
            {
              id: 'slider-1',
              type: 'slider',
              order: 0,
              question: 'Slider test',
              required: true,
              min: 1,
              max: 10,
              minLabel: 'Faible',
              maxLabel: 'Fort',
            },
          ],
        },
      }
    })

    it('should show slider question in wizard', () => {
      render(<ParticipantWizard />)

      expect(screen.getByText('Slider test')).toBeInTheDocument()
      expect(screen.getByRole('slider')).toBeInTheDocument()
      expect(screen.getByText('Faible')).toBeInTheDocument()
      expect(screen.getByText('Fort')).toBeInTheDocument()
    })

    it('should show Generate avatar button for slider questions on last step', () => {
      render(<ParticipantWizard />)

      // Slider questions need explicit button - "Générer mon avatar" for last step
      expect(screen.getByRole('button', { name: /Générer mon avatar/i })).toBeInTheDocument()
    })

    it('should have default value saved to store', () => {
      render(<ParticipantWizard />)

      const state = useParticipantFormStore.getState()
      const answer = state.formData.answers.find(a => a.elementId === 'slider-1')

      // Default value is middle: Math.floor((1 + 10) / 2) = 5
      expect(answer?.value).toBe(5)
    })
  })

  describe('Navigation integration (AC11, AC12)', () => {
    beforeEach(() => {
      mockAnimationValue = {
        ...mockAnimation,
        inputCollection: {
          elements: [
            {
              id: 'slider-1',
              type: 'slider',
              order: 0,
              question: 'Slider question',
              required: true,
              min: 0,
              max: 100,
            },
            {
              id: 'freetext-1',
              type: 'free-text',
              order: 1,
              question: 'Texte question',
              required: true,
              maxLength: 200,
            },
          ],
        },
      }
    })

    it('should preserve answers when navigating between steps', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

      render(<ParticipantWizard />)

      // First step: slider (has default value)
      expect(screen.getByText('Slider question')).toBeInTheDocument()

      // Go to next step
      fireEvent.click(screen.getByRole('button', { name: /Suivant/i }))

      // Now on free-text step
      expect(screen.getByText('Texte question')).toBeInTheDocument()

      // Type some text
      await user.type(screen.getByRole('textbox'), 'My text answer')

      // Go back
      fireEvent.click(screen.getByRole('button', { name: /Précédent/i }))

      // Should be back on slider
      expect(screen.getByText('Slider question')).toBeInTheDocument()

      // Go forward again
      fireEvent.click(screen.getByRole('button', { name: /Suivant/i }))

      // Text should still be there (pre-fill from store)
      expect(screen.getByRole('textbox')).toHaveValue('My text answer')
    })
  })
})
