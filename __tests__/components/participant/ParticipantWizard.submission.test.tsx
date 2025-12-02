/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ParticipantWizard } from '@/components/participant/ParticipantWizard'
import { useParticipantFormStore } from '@/lib/stores/participantForm.store'
import type { AnimationResponse } from '@/lib/services/animation.service'

// Mock fetch globally
global.fetch = jest.fn()

// Mock the animation context - using AnimationResponse which has 'id' not '_id'
const mockAnimation: Partial<AnimationResponse> = {
  id: 'anim-123',
  baseFields: {
    name: { enabled: false, required: false },
    firstName: { enabled: false, required: false },
    email: { enabled: false, required: false },
  },
  accessConfig: { type: 'open' as const },
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

// Import after mocking
import { toast } from 'sonner'

describe('ParticipantWizard - Submission (Story 4.4)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useParticipantFormStore.getState().reset()
    mockAnimationValue = { ...mockAnimation }
    ;(fetch as jest.Mock).mockReset()
  })

  describe('AC1 - Generate avatar button on last step', () => {
    it('should show "Générer mon avatar" button when on last step with non-choice question', () => {
      mockAnimationValue = {
        ...mockAnimation,
        inputCollection: {
          elements: [
            {
              id: 'slider-1',
              type: 'slider',
              order: 0,
              question: 'How do you feel?',
              required: false,
              min: 1,
              max: 10,
            },
          ],
        },
      }

      render(<ParticipantWizard />)

      expect(
        screen.getByRole('button', { name: /Générer mon avatar/i })
      ).toBeInTheDocument()
    })

    it('should show "Générer mon avatar" for choice question on last step', () => {
      mockAnimationValue = {
        ...mockAnimation,
        inputCollection: {
          elements: [
            {
              id: 'choice-1',
              type: 'choice',
              order: 0,
              question: 'Pick one',
              required: false,
              options: ['A', 'B'],
            },
          ],
        },
      }

      render(<ParticipantWizard />)

      expect(
        screen.getByRole('button', { name: /Générer mon avatar/i })
      ).toBeInTheDocument()
    })

    it('should show "Suivant" button when NOT on last step', () => {
      mockAnimationValue = {
        ...mockAnimation,
        inputCollection: {
          elements: [
            {
              id: 'slider-1',
              type: 'slider',
              order: 0,
              question: 'Slider 1',
              required: false,
              min: 1,
              max: 10,
            },
            {
              id: 'slider-2',
              type: 'slider',
              order: 1,
              question: 'Slider 2',
              required: false,
              min: 1,
              max: 10,
            },
          ],
        },
      }

      render(<ParticipantWizard />)

      // First step should show "Suivant"
      expect(
        screen.getByRole('button', { name: /Suivant/i })
      ).toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: /Générer mon avatar/i })
      ).not.toBeInTheDocument()
    })
  })

  describe('AC2 - Submission loading state', () => {
    beforeEach(() => {
      mockAnimationValue = {
        ...mockAnimation,
        inputCollection: {
          elements: [
            {
              id: 'slider-1',
              type: 'slider',
              order: 0,
              question: 'Rate',
              required: false,
              min: 1,
              max: 10,
            },
          ],
        },
      }
    })

    it('should show loading state when submitting', async () => {
      // Mock fetch to delay response
      ;(fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () =>
                    Promise.resolve({
                      success: true,
                      data: { generationId: 'gen-123', status: 'pending' },
                    }),
                }),
              100
            )
          )
      )

      render(<ParticipantWizard />)

      const submitButton = screen.getByRole('button', {
        name: /Générer mon avatar/i,
      })
      fireEvent.click(submitButton)

      // Button should show loading state
      await waitFor(() => {
        expect(screen.getByText(/Envoi en cours/i)).toBeInTheDocument()
      })
    })

    it('should disable buttons during submission', async () => {
      ;(fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () =>
                    Promise.resolve({
                      success: true,
                      data: { generationId: 'gen-123', status: 'pending' },
                    }),
                }),
              100
            )
          )
      )

      render(<ParticipantWizard />)

      const submitButton = screen.getByRole('button', {
        name: /Générer mon avatar/i,
      })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(submitButton).toBeDisabled()
      })
    })
  })

  describe('AC3, AC8 - API call and success response', () => {
    beforeEach(() => {
      mockAnimationValue = {
        ...mockAnimation,
        inputCollection: {
          elements: [
            {
              id: 'slider-1',
              type: 'slider',
              order: 0,
              question: 'Rate',
              required: false,
              min: 1,
              max: 10,
            },
          ],
        },
      }
    })

    it('should call POST /api/generations on submit', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: { generationId: 'gen-123', status: 'pending' },
          }),
      })

      render(<ParticipantWizard />)

      fireEvent.click(
        screen.getByRole('button', { name: /Générer mon avatar/i })
      )

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.any(String),
        })
      })
    })

    it('should include animationId and formData in request body', async () => {
      // Set some form data first
      const store = useParticipantFormStore.getState()
      store.setField('nom', 'Dupont')
      store.setField('email', 'test@example.com')
      store.setAnswer({ elementId: 'slider-1', type: 'slider', value: 7 })

      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: { generationId: 'gen-123', status: 'pending' },
          }),
      })

      render(<ParticipantWizard />)

      fireEvent.click(
        screen.getByRole('button', { name: /Générer mon avatar/i })
      )

      await waitFor(() => {
        const fetchCall = (fetch as jest.Mock).mock.calls[0]
        const body = JSON.parse(fetchCall[1].body)

        expect(body.animationId).toBe('anim-123')
        expect(body.formData.nom).toBe('Dupont')
        expect(body.formData.email).toBe('test@example.com')
        expect(body.formData.answers).toContainEqual({
          elementId: 'slider-1',
          type: 'slider',
          value: 7,
        })
      })
    })

    it('should include selfie in request body when captured', async () => {
      const store = useParticipantFormStore.getState()
      store.setSelfie('data:image/jpeg;base64,/9j/4AAQ...')

      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: { generationId: 'gen-123', status: 'pending' },
          }),
      })

      render(<ParticipantWizard />)

      fireEvent.click(
        screen.getByRole('button', { name: /Générer mon avatar/i })
      )

      await waitFor(() => {
        const fetchCall = (fetch as jest.Mock).mock.calls[0]
        const body = JSON.parse(fetchCall[1].body)

        expect(body.selfie).toBe('data:image/jpeg;base64,/9j/4AAQ...')
      })
    })
  })

  describe('AC9 - Transition to processing screen', () => {
    beforeEach(() => {
      mockAnimationValue = {
        ...mockAnimation,
        inputCollection: {
          elements: [
            {
              id: 'slider-1',
              type: 'slider',
              order: 0,
              question: 'Rate',
              required: false,
              min: 1,
              max: 10,
            },
          ],
        },
      }
    })

    it('should transition to processing phase after successful submission', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: { generationId: 'gen-123', status: 'pending' },
          }),
      })

      render(<ParticipantWizard />)

      fireEvent.click(
        screen.getByRole('button', { name: /Générer mon avatar/i })
      )

      await waitFor(() => {
        expect(screen.getByTestId('processing-step')).toBeInTheDocument()
      })
    })

    it('should store generationId after successful submission', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: { generationId: 'gen-xyz-789', status: 'pending' },
          }),
      })

      render(<ParticipantWizard />)

      fireEvent.click(
        screen.getByRole('button', { name: /Générer mon avatar/i })
      )

      await waitFor(() => {
        const state = useParticipantFormStore.getState()
        expect(state.generationId).toBe('gen-xyz-789')
        expect(state.wizardPhase).toBe('processing')
      })
    })

    it('should hide progress bar in processing phase', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: { generationId: 'gen-123', status: 'pending' },
          }),
      })

      render(<ParticipantWizard />)

      // Progress bar visible initially
      expect(screen.getByText(/Étape 1 sur/i)).toBeInTheDocument()

      fireEvent.click(
        screen.getByRole('button', { name: /Générer mon avatar/i })
      )

      await waitFor(() => {
        // Progress bar should be hidden in processing phase
        expect(screen.queryByText(/Étape/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Error handling (AC5, AC10, AC11)', () => {
    beforeEach(() => {
      mockAnimationValue = {
        ...mockAnimation,
        inputCollection: {
          elements: [
            {
              id: 'slider-1',
              type: 'slider',
              order: 0,
              question: 'Rate',
              required: false,
              min: 1,
              max: 10,
            },
          ],
        },
      }
    })

    it('should show error toast on rate limit (429)', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 429,
        json: () =>
          Promise.resolve({
            success: false,
            error: {
              code: 'GEN_4001',
              message: 'Trop de tentatives. Veuillez patienter quelques instants.',
            },
          }),
      })

      render(<ParticipantWizard />)

      fireEvent.click(
        screen.getByRole('button', { name: /Générer mon avatar/i })
      )

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Trop de tentatives. Veuillez patienter quelques instants.'
        )
      })
    })

    it('should reset button state after error', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            success: false,
            error: {
              code: 'GEN_4002',
              message: 'Données manquantes',
            },
          }),
      })

      render(<ParticipantWizard />)

      const submitButton = screen.getByRole('button', {
        name: /Générer mon avatar/i,
      })
      fireEvent.click(submitButton)

      await waitFor(() => {
        // Button should return to normal state
        expect(
          screen.getByRole('button', { name: /Générer mon avatar/i })
        ).not.toBeDisabled()
      })
    })

    it('should show error toast for validation errors', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            success: false,
            error: {
              code: 'GEN_4002',
              message: 'Données manquantes',
              details: ['Le champ email est requis'],
            },
          }),
      })

      render(<ParticipantWizard />)

      fireEvent.click(
        screen.getByRole('button', { name: /Générer mon avatar/i })
      )

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Données manquantes')
      })
    })

    it('should show error toast for network errors', async () => {
      ;(fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      render(<ParticipantWizard />)

      fireEvent.click(
        screen.getByRole('button', { name: /Générer mon avatar/i })
      )

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Erreur de connexion. Veuillez réessayer.'
        )
      })
    })

    it('should not transition to processing on error', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: () =>
          Promise.resolve({
            success: false,
            error: {
              code: 'GEN_5001',
              message: 'Une erreur interne est survenue',
            },
          }),
      })

      render(<ParticipantWizard />)

      fireEvent.click(
        screen.getByRole('button', { name: /Générer mon avatar/i })
      )

      await waitFor(() => {
        // Should still be on form phase
        expect(screen.queryByTestId('processing-step')).not.toBeInTheDocument()
        expect(screen.getByText(/Étape 1 sur/i)).toBeInTheDocument()
      })
    })
  })
})
