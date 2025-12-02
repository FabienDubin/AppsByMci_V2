/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FreeTextQuestion } from '@/components/participant/steps/FreeTextQuestion'
import { useParticipantFormStore } from '@/lib/stores/participantForm.store'
import type { IInputElement } from '@/models/Animation.model'

// Create a free-text element
const createFreeTextElement = (overrides: Partial<IInputElement> = {}): IInputElement => ({
  id: 'freetext-1',
  type: 'free-text',
  order: 0,
  question: 'Décris ton super-pouvoir idéal',
  required: true,
  maxLength: 500,
  placeholder: 'Ex: Je pourrais voler dans les airs...',
  ...overrides,
})

describe('FreeTextQuestion', () => {
  const mockOnNext = jest.fn()
  const mockOnPrevious = jest.fn()

  const defaultProps = {
    element: createFreeTextElement(),
    onNext: mockOnNext,
    onPrevious: mockOnPrevious,
    isFirstStep: false,
    isLastStep: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    useParticipantFormStore.getState().reset()
  })

  describe('Title display (AC7)', () => {
    it('should display the question as title', () => {
      render(<FreeTextQuestion {...defaultProps} />)

      expect(screen.getByText('Décris ton super-pouvoir idéal')).toBeInTheDocument()
    })

    it('should display default title when no question provided', () => {
      const element = createFreeTextElement({ question: undefined })
      render(<FreeTextQuestion {...defaultProps} element={element} />)

      expect(screen.getByText('Votre réponse')).toBeInTheDocument()
    })

    it('should display required indicator when required', () => {
      render(<FreeTextQuestion {...defaultProps} />)

      expect(screen.getByLabelText('requis')).toBeInTheDocument()
    })

    it('should not display required indicator when not required', () => {
      const element = createFreeTextElement({ required: false })
      render(<FreeTextQuestion {...defaultProps} element={element} />)

      expect(screen.queryByLabelText('requis')).not.toBeInTheDocument()
    })
  })

  describe('Textarea display (AC7)', () => {
    it('should render a textarea', () => {
      render(<FreeTextQuestion {...defaultProps} />)

      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('should display placeholder text', () => {
      render(<FreeTextQuestion {...defaultProps} />)

      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('placeholder', 'Ex: Je pourrais voler dans les airs...')
    })

    it('should display default placeholder when none provided', () => {
      const element = createFreeTextElement({ placeholder: undefined })
      render(<FreeTextQuestion {...defaultProps} element={element} />)

      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('placeholder', 'Écrivez votre réponse ici...')
    })

    it('should have min rows for multi-line input', () => {
      render(<FreeTextQuestion {...defaultProps} />)

      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('rows', '4')
    })
  })

  describe('Character counter (AC7, AC8)', () => {
    it('should display character counter', () => {
      render(<FreeTextQuestion {...defaultProps} />)

      expect(screen.getByText('0 / 500 caractères')).toBeInTheDocument()
    })

    it('should update counter in real-time when typing', async () => {
      const user = userEvent.setup()
      render(<FreeTextQuestion {...defaultProps} />)

      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'Hello')

      expect(screen.getByText('5 / 500 caractères')).toBeInTheDocument()
    })

    it('should save text to store in real-time (AC8)', async () => {
      const user = userEvent.setup()
      render(<FreeTextQuestion {...defaultProps} />)

      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'Mon super-pouvoir')

      const state = useParticipantFormStore.getState()
      const answer = state.formData.answers.find(a => a.elementId === 'freetext-1')

      expect(answer).toEqual({
        elementId: 'freetext-1',
        type: 'free-text',
        value: 'Mon super-pouvoir',
      })
    })
  })

  describe('MaxLength enforcement (AC9)', () => {
    it('should have maxLength attribute on textarea', () => {
      render(<FreeTextQuestion {...defaultProps} />)

      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('maxLength', '500')
    })

    it('should show counter in red when at max length', async () => {
      const element = createFreeTextElement({ maxLength: 10 })
      const user = userEvent.setup()
      render(<FreeTextQuestion {...defaultProps} element={element} />)

      const textarea = screen.getByRole('textbox')
      await user.type(textarea, '1234567890') // Exactly 10 chars

      const counter = screen.getByText(/10 \/ 10 caractères/)
      expect(counter).toHaveClass('text-red-500')
    })

    it('should show "maximum atteint" message when at max', async () => {
      const element = createFreeTextElement({ maxLength: 5 })
      const user = userEvent.setup()
      render(<FreeTextQuestion {...defaultProps} element={element} />)

      const textarea = screen.getByRole('textbox')
      await user.type(textarea, '12345')

      expect(screen.getByText(/\(maximum atteint\)/)).toBeInTheDocument()
    })

    it('should block input beyond maxLength (enforced by native attribute)', async () => {
      const element = createFreeTextElement({ maxLength: 5 })
      const user = userEvent.setup()
      render(<FreeTextQuestion {...defaultProps} element={element} />)

      const textarea = screen.getByRole('textbox')
      await user.type(textarea, '123456789') // Try to type 9 chars

      // Native maxLength attribute blocks input at 5 chars
      expect(textarea).toHaveValue('12345')
      expect(screen.getByText('5 / 5 caractères (maximum atteint)')).toBeInTheDocument()
    })

    it('should not show red counter when below max length', async () => {
      const user = userEvent.setup()
      render(<FreeTextQuestion {...defaultProps} />)

      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'Hello')

      const counter = screen.getByText('5 / 500 caractères')
      expect(counter).not.toHaveClass('text-red-500')
      expect(counter).toHaveClass('text-gray-500')
    })
  })

  describe('Pre-fill from store (AC12)', () => {
    it('should pre-fill text from store', () => {
      // Set answer in store before render
      useParticipantFormStore.getState().setAnswer({
        elementId: 'freetext-1',
        type: 'free-text',
        value: 'Texte pré-rempli',
      })

      render(<FreeTextQuestion {...defaultProps} />)

      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveValue('Texte pré-rempli')
    })

    it('should update counter with pre-filled text length', () => {
      useParticipantFormStore.getState().setAnswer({
        elementId: 'freetext-1',
        type: 'free-text',
        value: 'Hello World',
      })

      render(<FreeTextQuestion {...defaultProps} />)

      expect(screen.getByText('11 / 500 caractères')).toBeInTheDocument()
    })

    it('should allow modifying pre-filled text', async () => {
      useParticipantFormStore.getState().setAnswer({
        elementId: 'freetext-1',
        type: 'free-text',
        value: 'Initial',
      })

      const user = userEvent.setup()
      render(<FreeTextQuestion {...defaultProps} />)

      const textarea = screen.getByRole('textbox')
      await user.clear(textarea)
      await user.type(textarea, 'Modified')

      expect(textarea).toHaveValue('Modified')

      const state = useParticipantFormStore.getState()
      const answer = state.formData.answers.find(a => a.elementId === 'freetext-1')
      expect(answer?.value).toBe('Modified')
    })
  })

  describe('Accessibility', () => {
    it('should have aria-label on textarea', () => {
      render(<FreeTextQuestion {...defaultProps} />)

      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('aria-label', 'Décris ton super-pouvoir idéal')
    })

    it('should have aria-describedby pointing to counter', () => {
      render(<FreeTextQuestion {...defaultProps} />)

      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('aria-describedby', 'char-counter')

      const counter = document.getElementById('char-counter')
      expect(counter).toBeInTheDocument()
    })

    it('should have aria-live on counter for screen readers', () => {
      render(<FreeTextQuestion {...defaultProps} />)

      const counter = document.getElementById('char-counter')
      expect(counter).toHaveAttribute('aria-live', 'polite')
    })
  })
})
