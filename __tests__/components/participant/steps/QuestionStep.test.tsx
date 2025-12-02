/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { QuestionStep } from '@/components/participant/steps/QuestionStep'
import { useParticipantFormStore } from '@/lib/stores/participantForm.store'
import type { IInputElement } from '@/models/Animation.model'

// Create elements for different types
const createChoiceElement = (): IInputElement => ({
  id: 'choice-1',
  type: 'choice',
  order: 0,
  question: 'Quel style préfères-tu ?',
  required: true,
  options: ['Style A', 'Style B'],
})

const createSliderElement = (): IInputElement => ({
  id: 'slider-1',
  type: 'slider',
  order: 0,
  question: 'Niveau souhaité',
  required: true,
  min: 1,
  max: 10,
  minLabel: 'Faible',
  maxLabel: 'Fort',
})

const createFreeTextElement = (): IInputElement => ({
  id: 'freetext-1',
  type: 'free-text',
  order: 0,
  question: 'Ta réponse',
  required: true,
  maxLength: 200,
  placeholder: 'Écris ici...',
})

describe('QuestionStep', () => {
  const mockOnNext = jest.fn()
  const mockOnPrevious = jest.fn()

  const createProps = (element: IInputElement) => ({
    element,
    onNext: mockOnNext,
    onPrevious: mockOnPrevious,
    isFirstStep: false,
    isLastStep: false,
  })

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    useParticipantFormStore.getState().reset()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Routing to correct component', () => {
    it('should render ChoiceQuestion for choice type', () => {
      render(<QuestionStep {...createProps(createChoiceElement())} />)

      // ChoiceQuestion shows options as buttons
      expect(screen.getByText('Quel style préfères-tu ?')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Style A' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Style B' })).toBeInTheDocument()
    })

    it('should render SliderQuestion for slider type', () => {
      render(<QuestionStep {...createProps(createSliderElement())} />)

      // SliderQuestion shows slider with labels
      expect(screen.getByText('Niveau souhaité')).toBeInTheDocument()
      expect(screen.getByRole('slider')).toBeInTheDocument()
      expect(screen.getByText('Faible')).toBeInTheDocument()
      expect(screen.getByText('Fort')).toBeInTheDocument()
    })

    it('should render FreeTextQuestion for free-text type', () => {
      render(<QuestionStep {...createProps(createFreeTextElement())} />)

      // FreeTextQuestion shows textarea
      expect(screen.getByText('Ta réponse')).toBeInTheDocument()
      expect(screen.getByRole('textbox')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Écris ici...')).toBeInTheDocument()
    })

    it('should show error message for unsupported type', () => {
      const unsupportedElement: IInputElement = {
        id: 'unknown-1',
        type: 'selfie', // Selfie is not handled by QuestionStep
        order: 0,
      }

      render(<QuestionStep {...createProps(unsupportedElement)} />)

      expect(screen.getByText(/Type de question non supporté/)).toBeInTheDocument()
    })
  })

  describe('Props passing', () => {
    it('should pass isFirstStep to choice component (affects Previous button)', () => {
      const props = {
        ...createProps(createChoiceElement()),
        isFirstStep: true,
      }

      render(<QuestionStep {...props} />)

      // When isFirstStep, Previous button should not be shown
      expect(screen.queryByRole('button', { name: /Précédent/i })).not.toBeInTheDocument()
    })

    it('should pass isFirstStep=false to show Previous button', () => {
      const props = {
        ...createProps(createChoiceElement()),
        isFirstStep: false,
      }

      render(<QuestionStep {...props} />)

      // When not first step, Previous button should be shown in ChoiceQuestion
      expect(screen.getByRole('button', { name: /Précédent/i })).toBeInTheDocument()
    })
  })
})
