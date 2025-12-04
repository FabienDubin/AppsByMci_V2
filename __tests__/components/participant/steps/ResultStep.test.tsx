/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ResultStep } from '@/components/participant/steps/ResultStep'

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    const { onLoad, onError, ...rest } = props
    return (
      <img
        {...rest}
        data-testid={props['data-testid']}
        onLoad={onLoad}
        onError={onError}
      />
    )
  },
}))

// Mock sonner toast
const mockToastSuccess = jest.fn()
const mockToastError = jest.fn()
jest.mock('sonner', () => ({
  toast: {
    success: (msg: string) => mockToastSuccess(msg),
    error: (msg: string) => mockToastError(msg),
  },
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

// Mock fetch for download
global.fetch = jest.fn()

describe('ResultStep', () => {
  const defaultProps = {
    resultUrl: 'https://blob.azure.com/image.png?sas=token',
    animationSlug: 'test-animation',
    generationId: 'gen-123',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Initial render', () => {
    it('should render result step container', () => {
      render(<ResultStep {...defaultProps} />)

      expect(screen.getByTestId('result-step')).toBeInTheDocument()
    })

    it('should include generation ID as data attribute', () => {
      render(<ResultStep {...defaultProps} />)

      const container = screen.getByTestId('result-step')
      expect(container).toHaveAttribute('data-generation-id', 'gen-123')
    })

    it('should render image skeleton initially', () => {
      render(<ResultStep {...defaultProps} />)

      expect(screen.getByTestId('image-skeleton')).toBeInTheDocument()
    })

    it('should render generated image', () => {
      render(<ResultStep {...defaultProps} />)

      const image = screen.getByTestId('generated-image')
      expect(image).toHaveAttribute('src', defaultProps.resultUrl)
    })

    it('should render download button', () => {
      render(<ResultStep {...defaultProps} />)

      expect(screen.getByTestId('download-button')).toBeInTheDocument()
      expect(screen.getByTestId('download-button')).toHaveTextContent('Télécharger')
    })

    it('should render restart button', () => {
      render(<ResultStep {...defaultProps} />)

      expect(screen.getByTestId('restart-button')).toBeInTheDocument()
      expect(screen.getByTestId('restart-button')).toHaveTextContent('Recommencer')
    })

    it('should disable download button while image is loading', () => {
      render(<ResultStep {...defaultProps} />)

      expect(screen.getByTestId('download-button')).toBeDisabled()
    })
  })

  describe('Image loading states', () => {
    it('should show image and enable download after load', () => {
      render(<ResultStep {...defaultProps} />)

      const image = screen.getByTestId('generated-image')
      fireEvent.load(image)

      expect(screen.queryByTestId('image-skeleton')).not.toBeInTheDocument()
      expect(screen.getByTestId('download-button')).not.toBeDisabled()
    })

    it('should show error state when image fails to load', () => {
      render(<ResultStep {...defaultProps} />)

      const image = screen.getByTestId('generated-image')
      fireEvent.error(image)

      expect(screen.getByTestId('image-error')).toBeInTheDocument()
      expect(screen.getByText("Impossible de charger l'image")).toBeInTheDocument()
    })

    it('should retry loading image when retry button clicked', () => {
      render(<ResultStep {...defaultProps} />)

      const image = screen.getByTestId('generated-image')
      fireEvent.error(image)

      const retryButton = screen.getByRole('button', { name: /réessayer/i })
      fireEvent.click(retryButton)

      expect(screen.getByTestId('image-skeleton')).toBeInTheDocument()
    })
  })

  describe('Thank you message', () => {
    it('should display thank you message when provided', () => {
      render(
        <ResultStep
          {...defaultProps}
          thankYouMessage="Félicitations ! Ton avatar est prêt !"
        />
      )

      expect(screen.getByTestId('thank-you-message')).toBeInTheDocument()
      expect(screen.getByTestId('thank-you-message')).toHaveTextContent(
        'Félicitations ! Ton avatar est prêt !'
      )
    })

    it('should not display thank you message when not provided', () => {
      render(<ResultStep {...defaultProps} />)

      expect(screen.queryByTestId('thank-you-message')).not.toBeInTheDocument()
    })

    it('should not display thank you message when empty string', () => {
      render(<ResultStep {...defaultProps} thankYouMessage="" />)

      expect(screen.queryByTestId('thank-you-message')).not.toBeInTheDocument()
    })

    it('should not display thank you message when only whitespace', () => {
      render(<ResultStep {...defaultProps} thankYouMessage="   " />)

      expect(screen.queryByTestId('thank-you-message')).not.toBeInTheDocument()
    })
  })

  describe('Email confirmation', () => {
    it('should display email confirmation when email enabled and provided', () => {
      render(
        <ResultStep
          {...defaultProps}
          emailEnabled={true}
          userEmail="user@example.com"
        />
      )

      expect(screen.getByTestId('email-confirmation')).toBeInTheDocument()
      expect(screen.getByTestId('email-confirmation')).toHaveTextContent(
        'Un email avec ton résultat a été envoyé à user@example.com'
      )
    })

    it('should not display email confirmation when email disabled', () => {
      render(
        <ResultStep
          {...defaultProps}
          emailEnabled={false}
          userEmail="user@example.com"
        />
      )

      expect(screen.queryByTestId('email-confirmation')).not.toBeInTheDocument()
    })

    it('should not display email confirmation when no email provided', () => {
      render(<ResultStep {...defaultProps} emailEnabled={true} />)

      expect(screen.queryByTestId('email-confirmation')).not.toBeInTheDocument()
    })
  })

  describe('Download functionality', () => {
    it('should call download API when download button clicked', async () => {
      const mockBlob = new Blob(['image data'], { type: 'image/png' })
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({
          'Content-Disposition': 'attachment; filename="test-animation-123.png"',
        }),
        blob: () => Promise.resolve(mockBlob),
      })

      // Mock URL and DOM methods
      const mockCreateObjectURL = jest.fn(() => 'blob:url')
      const mockRevokeObjectURL = jest.fn()
      global.URL.createObjectURL = mockCreateObjectURL
      global.URL.revokeObjectURL = mockRevokeObjectURL

      render(<ResultStep {...defaultProps} />)

      // Load image first to enable download
      const image = screen.getByTestId('generated-image')
      fireEvent.load(image)

      const downloadButton = screen.getByTestId('download-button')
      fireEvent.click(downloadButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/generations/gen-123/download')
      })

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith('Image téléchargée !')
      })
    })

    it('should show error toast when download fails', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      render(<ResultStep {...defaultProps} />)

      // Load image first
      const image = screen.getByTestId('generated-image')
      fireEvent.load(image)

      const downloadButton = screen.getByTestId('download-button')
      fireEvent.click(downloadButton)

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Erreur lors du téléchargement')
      })
    })

    it('should disable download button while downloading', async () => {
      let resolveDownload: () => void
      const downloadPromise = new Promise<void>((resolve) => {
        resolveDownload = resolve
      })

      ;(global.fetch as jest.Mock).mockImplementation(() =>
        downloadPromise.then(() => ({
          ok: true,
          headers: new Headers(),
          blob: () => Promise.resolve(new Blob()),
        }))
      )

      render(<ResultStep {...defaultProps} />)

      // Load image first
      const image = screen.getByTestId('generated-image')
      fireEvent.load(image)

      const downloadButton = screen.getByTestId('download-button')
      fireEvent.click(downloadButton)

      await waitFor(() => {
        expect(downloadButton).toHaveTextContent('Téléchargement...')
      })

      resolveDownload!()
    })
  })

  describe('Restart functionality', () => {
    it('should reset store and navigate when restart clicked', () => {
      render(<ResultStep {...defaultProps} />)

      const restartButton = screen.getByTestId('restart-button')
      fireEvent.click(restartButton)

      expect(mockReset).toHaveBeenCalled()
      expect(mockPush).toHaveBeenCalledWith('/a/test-animation')
    })
  })
})
