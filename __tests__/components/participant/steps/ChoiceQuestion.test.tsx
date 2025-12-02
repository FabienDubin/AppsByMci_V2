/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ChoiceQuestion } from '@/components/participant/steps/ChoiceQuestion'
import { useParticipantFormStore } from '@/lib/stores/participantForm.store'
import type { IInputElement } from '@/models/Animation.model'

// Create a choice element
const createChoiceElement = (overrides: Partial<IInputElement> = {}): IInputElement => ({
  id: 'choice-1',
  type: 'choice',
  order: 0,
  question: 'Quelle ambiance préfères-tu ?',
  required: true,
  options: ['Calme', 'Énergique', 'Mystérieux'],
  ...overrides,
})

describe('ChoiceQuestion', () => {
  const mockOnNext = jest.fn()
  const mockOnPrevious = jest.fn()

  const defaultProps = {
    element: createChoiceElement(),
    onNext: mockOnNext,
    onPrevious: mockOnPrevious,
    isFirstStep: false,
    isLastStep: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    useParticipantFormStore.getState().reset()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Title display (AC1)', () => {
    it('should display the question as title', () => {
      render(<ChoiceQuestion {...defaultProps} />)

      expect(screen.getByText('Quelle ambiance préfères-tu ?')).toBeInTheDocument()
    })

    it('should display default title when no question provided', () => {
      const element = createChoiceElement({ question: undefined })
      render(<ChoiceQuestion {...defaultProps} element={element} />)

      expect(screen.getByText('Choisissez une option')).toBeInTheDocument()
    })

    it('should display required indicator when required', () => {
      render(<ChoiceQuestion {...defaultProps} />)

      expect(screen.getByLabelText('requis')).toBeInTheDocument()
    })

    it('should not display required indicator when not required', () => {
      const element = createChoiceElement({ required: false })
      render(<ChoiceQuestion {...defaultProps} element={element} />)

      expect(screen.queryByLabelText('requis')).not.toBeInTheDocument()
    })
  })

  describe('Options display (AC1)', () => {
    it('should display all options as buttons', () => {
      render(<ChoiceQuestion {...defaultProps} />)

      expect(screen.getByRole('button', { name: 'Calme' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Énergique' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Mystérieux' })).toBeInTheDocument()
    })

    it('should have outline variant by default (not selected)', () => {
      render(<ChoiceQuestion {...defaultProps} />)

      const buttons = screen.getAllByRole('button').filter(btn =>
        ['Calme', 'Énergique', 'Mystérieux'].includes(btn.textContent || '')
      )

      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-pressed', 'false')
      })
    })
  })

  describe('Selection behavior (AC1, AC2, AC3)', () => {
    it('should mark button as selected when clicked', () => {
      render(<ChoiceQuestion {...defaultProps} />)

      const button = screen.getByRole('button', { name: 'Calme' })
      fireEvent.click(button)

      expect(button).toHaveAttribute('aria-pressed', 'true')
    })

    it('should save answer to store when option is selected (AC3)', async () => {
      render(<ChoiceQuestion {...defaultProps} />)

      fireEvent.click(screen.getByRole('button', { name: 'Énergique' }))

      const state = useParticipantFormStore.getState()
      const answer = state.formData.answers.find(a => a.elementId === 'choice-1')

      expect(answer).toEqual({
        elementId: 'choice-1',
        type: 'choice',
        value: 'Énergique',
      })
    })

    it('should trigger auto-navigation after pulse animation (500ms) (AC2)', async () => {
      render(<ChoiceQuestion {...defaultProps} />)

      fireEvent.click(screen.getByRole('button', { name: 'Calme' }))

      // Should not navigate immediately
      expect(mockOnNext).not.toHaveBeenCalled()

      // Advance timer by 500ms (pulse animation duration)
      act(() => {
        jest.advanceTimersByTime(500)
      })

      expect(mockOnNext).toHaveBeenCalledTimes(1)
    })

    it('should NOT auto-navigate when isLastStep is true', async () => {
      render(<ChoiceQuestion {...defaultProps} isLastStep={true} />)

      fireEvent.click(screen.getByRole('button', { name: 'Calme' }))

      // Advance timer by 500ms
      act(() => {
        jest.advanceTimersByTime(500)
      })

      // Should NOT call onNext when it's the last step (user must click Submit)
      expect(mockOnNext).not.toHaveBeenCalled()
    })

    it('should update selection when different option is clicked', () => {
      render(<ChoiceQuestion {...defaultProps} />)

      const calmeButton = screen.getByRole('button', { name: 'Calme' })
      const energiqueButton = screen.getByRole('button', { name: 'Énergique' })

      fireEvent.click(calmeButton)
      expect(calmeButton).toHaveAttribute('aria-pressed', 'true')

      fireEvent.click(energiqueButton)
      expect(energiqueButton).toHaveAttribute('aria-pressed', 'true')
      expect(calmeButton).toHaveAttribute('aria-pressed', 'false')
    })
  })

  describe('Navigation buttons (AC4)', () => {
    it('should show discreet Previous button when not first step', () => {
      render(<ChoiceQuestion {...defaultProps} isFirstStep={false} />)

      const prevButton = screen.getByRole('button', { name: /Précédent/i })
      expect(prevButton).toBeInTheDocument()
      // Should be discreet (ghost variant)
      expect(prevButton).toHaveClass('text-gray-500')
    })

    it('should not show Previous button when first step', () => {
      render(<ChoiceQuestion {...defaultProps} isFirstStep={true} />)

      expect(screen.queryByRole('button', { name: /Précédent/i })).not.toBeInTheDocument()
    })

    it('should NOT show Next button (auto-navigation)', () => {
      render(<ChoiceQuestion {...defaultProps} />)

      expect(screen.queryByRole('button', { name: /Suivant/i })).not.toBeInTheDocument()
    })

    it('should call onPrevious when Previous button is clicked', () => {
      render(<ChoiceQuestion {...defaultProps} isFirstStep={false} />)

      fireEvent.click(screen.getByRole('button', { name: /Précédent/i }))

      expect(mockOnPrevious).toHaveBeenCalledTimes(1)
    })
  })

  describe('Pre-fill from store (AC12)', () => {
    it('should pre-fill selected option from store', () => {
      // Set answer in store before render
      useParticipantFormStore.getState().setAnswer({
        elementId: 'choice-1',
        type: 'choice',
        value: 'Mystérieux',
      })

      render(<ChoiceQuestion {...defaultProps} />)

      const mystButton = screen.getByRole('button', { name: 'Mystérieux' })
      expect(mystButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('should allow changing pre-filled selection', () => {
      useParticipantFormStore.getState().setAnswer({
        elementId: 'choice-1',
        type: 'choice',
        value: 'Calme',
      })

      render(<ChoiceQuestion {...defaultProps} />)

      const calmeButton = screen.getByRole('button', { name: 'Calme' })
      const energiqueButton = screen.getByRole('button', { name: 'Énergique' })

      expect(calmeButton).toHaveAttribute('aria-pressed', 'true')

      fireEvent.click(energiqueButton)

      expect(energiqueButton).toHaveAttribute('aria-pressed', 'true')
      expect(calmeButton).toHaveAttribute('aria-pressed', 'false')
    })
  })
})
