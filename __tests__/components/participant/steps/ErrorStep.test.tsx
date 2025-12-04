/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorStep } from '@/components/participant/steps/ErrorStep'

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock participant form store
const mockReset = jest.fn()
jest.mock('@/lib/stores/participantForm.store', () => ({
  useParticipantFormStore: (selector: any) => {
    const state = {
      reset: mockReset,
    }
    return selector(state)
  },
}))

describe('ErrorStep', () => {
  const defaultProps = {
    animationSlug: 'test-animation',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Initial render', () => {
    it('should render error step container', () => {
      render(<ErrorStep {...defaultProps} />)

      expect(screen.getByTestId('error-step')).toBeInTheDocument()
    })

    it('should render error title', () => {
      render(<ErrorStep {...defaultProps} />)

      expect(screen.getByText('Oups, une erreur est survenue')).toBeInTheDocument()
    })

    it('should render default error message when no code or message provided', () => {
      render(<ErrorStep {...defaultProps} />)

      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'Impossible de générer ton image pour le moment.'
      )
    })

    it('should render retry button', () => {
      render(<ErrorStep {...defaultProps} />)

      expect(screen.getByTestId('retry-button')).toBeInTheDocument()
      expect(screen.getByTestId('retry-button')).toHaveTextContent('Réessayer')
    })
  })

  describe('Error code mapping', () => {
    it('should include error code as data attribute', () => {
      render(<ErrorStep {...defaultProps} errorCode="GEN_5002" />)

      const container = screen.getByTestId('error-step')
      expect(container).toHaveAttribute('data-error-code', 'GEN_5002')
    })

    it('should display GEN_5002 timeout error message', () => {
      render(<ErrorStep {...defaultProps} errorCode="GEN_5002" />)

      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'La génération a pris trop de temps. Veuillez réessayer.'
      )
    })

    it('should display GEN_5003 technical error message', () => {
      render(<ErrorStep {...defaultProps} errorCode="GEN_5003" />)

      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'Une erreur technique est survenue. Veuillez réessayer plus tard.'
      )
    })

    it('should display GEN_5004 AI model unavailable message', () => {
      render(<ErrorStep {...defaultProps} errorCode="GEN_5004" />)

      expect(screen.getByTestId('error-message')).toHaveTextContent(
        "Le modèle IA n'est pas disponible. Veuillez réessayer plus tard."
      )
    })

    it('should display GEN_5005 invalid configuration message', () => {
      render(<ErrorStep {...defaultProps} errorCode="GEN_5005" />)

      expect(screen.getByTestId('error-message')).toHaveTextContent(
        "Configuration invalide. Contactez l'organisateur."
      )
    })

    it('should use custom error message when unknown error code', () => {
      render(
        <ErrorStep
          {...defaultProps}
          errorCode="UNKNOWN_CODE"
          errorMessage="Custom error occurred"
        />
      )

      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'Custom error occurred'
      )
    })

    it('should use custom error message when no error code', () => {
      render(
        <ErrorStep {...defaultProps} errorMessage="Something went wrong" />
      )

      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'Something went wrong'
      )
    })

    it('should prefer mapped message over custom message', () => {
      render(
        <ErrorStep
          {...defaultProps}
          errorCode="GEN_5002"
          errorMessage="Custom message"
        />
      )

      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'La génération a pris trop de temps. Veuillez réessayer.'
      )
    })
  })

  describe('Retry functionality', () => {
    it('should reset store when retry clicked', () => {
      render(<ErrorStep {...defaultProps} />)

      const retryButton = screen.getByTestId('retry-button')
      fireEvent.click(retryButton)

      expect(mockReset).toHaveBeenCalled()
    })

    it('should navigate to animation page when retry clicked', () => {
      render(<ErrorStep {...defaultProps} />)

      const retryButton = screen.getByTestId('retry-button')
      fireEvent.click(retryButton)

      expect(mockPush).toHaveBeenCalledWith('/a/test-animation')
    })

    it('should use correct slug in navigation', () => {
      render(<ErrorStep animationSlug="my-custom-slug" />)

      const retryButton = screen.getByTestId('retry-button')
      fireEvent.click(retryButton)

      expect(mockPush).toHaveBeenCalledWith('/a/my-custom-slug')
    })
  })
})
