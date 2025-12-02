/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SelfieStep } from '@/components/participant/steps/SelfieStep'
import { useParticipantFormStore } from '@/lib/stores/participantForm.store'
import type { IInputElement } from '@/models/Animation.model'

// Mock react-webcam
jest.mock('react-webcam', () => {
  return function MockWebcam() {
    return <div data-testid="mock-webcam">Webcam Mock</div>
  }
})

// Mock components that depend on webcam
jest.mock('@/components/participant/WebcamCapture', () => ({
  WebcamCapture: ({
    onCapture,
    previewUrl,
    onRetry,
    onSwitchToUpload,
  }: {
    onCapture: (file: File) => void
    previewUrl: string | null
    onRetry: () => void
    onSwitchToUpload: () => void
    setError: (error: string | null) => void
  }) => (
    <div data-testid="webcam-capture">
      {previewUrl ? (
        <>
          <img src={previewUrl} alt="preview" data-testid="webcam-preview" />
          <button onClick={onRetry} data-testid="webcam-retry">
            Reprendre
          </button>
          <p data-testid="webcam-success">Photo prête !</p>
        </>
      ) : (
        <>
          <button
            onClick={() => {
              const blob = new Blob(['fake-image'], { type: 'image/jpeg' })
              const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' })
              onCapture(file)
            }}
            data-testid="webcam-capture-btn"
          >
            Capturer
          </button>
          <button onClick={onSwitchToUpload} data-testid="webcam-switch-upload">
            Uploader
          </button>
        </>
      )}
    </div>
  ),
}))

jest.mock('@/components/participant/FileUpload', () => ({
  FileUpload: ({
    onFileSelect,
    previewUrl,
    onRetry,
  }: {
    onFileSelect: (file: File) => void
    previewUrl: string | null
    onRetry: () => void
    error: string | null
    setError: (error: string | null) => void
  }) => (
    <div data-testid="file-upload">
      {previewUrl ? (
        <>
          <img src={previewUrl} alt="preview" data-testid="file-preview" />
          <button onClick={onRetry} data-testid="file-retry">
            Changer
          </button>
          <p data-testid="file-success">Photo prête !</p>
        </>
      ) : (
        <button
          onClick={() => {
            const blob = new Blob(['fake-image'], { type: 'image/jpeg' })
            const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' })
            onFileSelect(file)
          }}
          data-testid="file-select-btn"
        >
          Sélectionner
        </button>
      )}
    </div>
  ),
}))

// Mock window.matchMedia with fine pointer control
// Desktop: pointer:fine matches, pointer:coarse doesn't
// Mobile: pointer:coarse matches, pointer:fine doesn't
const mockMatchMedia = (isMobile: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => {
      let matches = false
      if (query === '(pointer: coarse)') {
        matches = isMobile
      } else if (query === '(pointer: fine)') {
        matches = !isMobile
      }
      return {
        matches,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }
    }),
  })
}

// Mock navigator.userAgent
const mockUserAgent = (isMobile: boolean) => {
  Object.defineProperty(navigator, 'userAgent', {
    writable: true,
    value: isMobile
      ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)'
      : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  })
}

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = jest.fn(() => 'blob:mock-url')
const mockRevokeObjectURL = jest.fn()
global.URL.createObjectURL = mockCreateObjectURL
global.URL.revokeObjectURL = mockRevokeObjectURL

// Sample selfie element
const createSelfieElement = (overrides: Partial<IInputElement> = {}): IInputElement => ({
  id: 'selfie-1',
  type: 'selfie',
  order: 0,
  required: true,
  ...overrides,
})

describe('SelfieStep', () => {
  const defaultProps = {
    element: createSelfieElement(),
    onNext: jest.fn(),
    onPrevious: jest.fn(),
    isFirstStep: false,
    isLastStep: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    useParticipantFormStore.getState().reset()
    // Default to desktop
    mockMatchMedia(false)
    mockUserAgent(false)
    // Reset viewport to desktop size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024,
    })
  })

  describe('Default interface', () => {
    it('should show webcam interface by default', async () => {
      render(<SelfieStep {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('webcam-capture')).toBeInTheDocument()
      })
    })

    it('should show webcam interface regardless of device', async () => {
      // Even with mobile settings, webcam is shown (same experience everywhere)
      mockMatchMedia(true)
      mockUserAgent(true)
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 })

      render(<SelfieStep {...defaultProps} />)

      await waitFor(() => {
        // Same experience on all devices - webcam first
        expect(screen.getByTestId('webcam-capture')).toBeInTheDocument()
      })
    })
  })

  describe('Title display', () => {
    it('should display custom question as title', async () => {
      const element = createSelfieElement({ question: 'Prenez votre photo' })

      render(<SelfieStep {...defaultProps} element={element} />)

      await waitFor(() => {
        expect(screen.getByText('Prenez votre photo')).toBeInTheDocument()
      })
    })

    it('should display default title when no question provided', async () => {
      const element = createSelfieElement({ question: undefined })

      render(<SelfieStep {...defaultProps} element={element} />)

      await waitFor(() => {
        expect(screen.getByText('Prendre un selfie')).toBeInTheDocument()
      })
    })
  })

  describe('Required indicator', () => {
    it('should show required indicator when selfie is required', async () => {
      const element = createSelfieElement({ required: true })

      render(<SelfieStep {...defaultProps} element={element} />)

      await waitFor(() => {
        expect(screen.getByText(/Cette étape est requise/i)).toBeInTheDocument()
      })
    })

    it('should not show required indicator when selfie is optional', async () => {
      const element = createSelfieElement({ required: false })

      render(<SelfieStep {...defaultProps} element={element} />)

      await waitFor(() => {
        expect(screen.queryByText(/Cette étape est requise/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Mode switching (Desktop)', () => {
    beforeEach(() => {
      mockMatchMedia(false) // Desktop
    })

    it('should switch to upload mode when clicking upload button', async () => {
      render(<SelfieStep {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('webcam-capture')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('webcam-switch-upload'))

      await waitFor(() => {
        expect(screen.getByTestId('file-upload')).toBeInTheDocument()
      })
    })

    it('should show switch back to webcam button in upload mode', async () => {
      render(<SelfieStep {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('webcam-capture')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('webcam-switch-upload'))

      await waitFor(() => {
        expect(screen.getByText(/Utiliser la webcam/i)).toBeInTheDocument()
      })
    })
  })

  describe('Image capture and validation', () => {
    beforeEach(() => {
      mockMatchMedia(false) // Desktop
    })

    it('should capture image from webcam', async () => {
      render(<SelfieStep {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('webcam-capture')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('webcam-capture-btn'))

      await waitFor(() => {
        expect(mockCreateObjectURL).toHaveBeenCalled()
      })
    })

    it('should show preview after capture', async () => {
      render(<SelfieStep {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('webcam-capture')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('webcam-capture-btn'))

      await waitFor(() => {
        expect(screen.getByTestId('webcam-preview')).toBeInTheDocument()
      })
    })

    it('should show retry button after capture', async () => {
      render(<SelfieStep {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('webcam-capture')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('webcam-capture-btn'))

      await waitFor(() => {
        // After capture, retry button should be visible
        expect(screen.getByTestId('webcam-retry')).toBeInTheDocument()
        // And success message too
        expect(screen.getByTestId('webcam-success')).toBeInTheDocument()
      })
    })
  })

  describe('File validation', () => {
    it('should show file upload when user switches to upload mode', async () => {
      render(<SelfieStep {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('webcam-capture')).toBeInTheDocument()
      })

      // Switch to upload mode
      fireEvent.click(screen.getByTestId('webcam-switch-upload'))

      await waitFor(() => {
        expect(screen.getByTestId('file-upload')).toBeInTheDocument()
      })

      // Note: File size and type validation is tested in FileUpload.test.tsx
    })
  })

  describe('Store integration', () => {
    it('should load existing selfie from store', async () => {
      // Set selfie in store before rendering
      useParticipantFormStore.getState().setSelfie('data:image/jpeg;base64,existing-selfie')

      render(<SelfieStep {...defaultProps} />)

      await waitFor(() => {
        // Component should show preview with existing selfie
        expect(screen.getByTestId('webcam-preview')).toBeInTheDocument()
      })
    })
  })
})
