/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { FileUpload } from '@/components/participant/FileUpload'

// Mock react-dropzone
jest.mock('react-dropzone', () => ({
  useDropzone: jest.fn(({ onDrop, onDropRejected }) => ({
    getRootProps: () => ({
      onClick: jest.fn(),
    }),
    getInputProps: () => ({}),
    isDragActive: false,
    isDragReject: false,
    // Expose handlers for testing
    __onDrop: onDrop,
    __onDropRejected: onDropRejected,
  })),
}))

// Import the mocked module to access internal handlers
import { useDropzone } from 'react-dropzone'

// Mock URL.createObjectURL
const mockCreateObjectURL = jest.fn(() => 'blob:mock-url')
global.URL.createObjectURL = mockCreateObjectURL

describe('FileUpload', () => {
  const defaultProps = {
    onFileSelect: jest.fn(),
    previewUrl: null,
    onRetry: jest.fn(),
    error: null,
    setError: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Initial state', () => {
    it('should render dropzone with instructions', () => {
      render(<FileUpload {...defaultProps} />)

      expect(screen.getByText(/Glissez votre photo ici/i)).toBeInTheDocument()
      expect(screen.getByText(/ou cliquez pour sélectionner/i)).toBeInTheDocument()
    })

    it('should show accepted formats', () => {
      render(<FileUpload {...defaultProps} />)

      expect(screen.getByText(/JPG, PNG ou WEBP/i)).toBeInTheDocument()
      expect(screen.getByText(/Max 10 MB/i)).toBeInTheDocument()
    })

    it('should render mobile camera button', () => {
      render(<FileUpload {...defaultProps} />)

      expect(screen.getByRole('button', { name: /Prendre une photo/i })).toBeInTheDocument()
    })
  })

  describe('File selection', () => {
    it('should call onFileSelect with valid JPEG file', () => {
      const mockDropzone = useDropzone as jest.Mock
      let capturedOnDrop: ((files: File[], rejected: Array<{ errors: Array<{ code: string }> }>) => void) | undefined

      mockDropzone.mockImplementation(({ onDrop }) => {
        capturedOnDrop = onDrop
        return {
          getRootProps: () => ({}),
          getInputProps: () => ({}),
          isDragActive: false,
          isDragReject: false,
        }
      })

      render(<FileUpload {...defaultProps} />)

      // Create a valid JPEG file
      const file = new File(['fake-content'], 'photo.jpg', { type: 'image/jpeg' })

      // Simulate file drop
      if (capturedOnDrop) {
        capturedOnDrop([file], [])
      }

      expect(defaultProps.onFileSelect).toHaveBeenCalledWith(file)
    })

    it('should call onFileSelect with valid PNG file', () => {
      const mockDropzone = useDropzone as jest.Mock
      let capturedOnDrop: ((files: File[], rejected: Array<{ errors: Array<{ code: string }> }>) => void) | undefined

      mockDropzone.mockImplementation(({ onDrop }) => {
        capturedOnDrop = onDrop
        return {
          getRootProps: () => ({}),
          getInputProps: () => ({}),
          isDragActive: false,
          isDragReject: false,
        }
      })

      render(<FileUpload {...defaultProps} />)

      const file = new File(['fake-content'], 'photo.png', { type: 'image/png' })

      if (capturedOnDrop) {
        capturedOnDrop([file], [])
      }

      expect(defaultProps.onFileSelect).toHaveBeenCalledWith(file)
    })

    it('should call onFileSelect with valid WEBP file', () => {
      const mockDropzone = useDropzone as jest.Mock
      let capturedOnDrop: ((files: File[], rejected: Array<{ errors: Array<{ code: string }> }>) => void) | undefined

      mockDropzone.mockImplementation(({ onDrop }) => {
        capturedOnDrop = onDrop
        return {
          getRootProps: () => ({}),
          getInputProps: () => ({}),
          isDragActive: false,
          isDragReject: false,
        }
      })

      render(<FileUpload {...defaultProps} />)

      const file = new File(['fake-content'], 'photo.webp', { type: 'image/webp' })

      if (capturedOnDrop) {
        capturedOnDrop([file], [])
      }

      expect(defaultProps.onFileSelect).toHaveBeenCalledWith(file)
    })
  })

  describe('File validation - Size', () => {
    it('should show error for files larger than 10MB', () => {
      const mockDropzone = useDropzone as jest.Mock
      let capturedOnDrop: ((files: File[], rejected: Array<{ errors: Array<{ code: string }> }>) => void) | undefined

      mockDropzone.mockImplementation(({ onDrop }) => {
        capturedOnDrop = onDrop
        return {
          getRootProps: () => ({}),
          getInputProps: () => ({}),
          isDragActive: false,
          isDragReject: false,
        }
      })

      render(<FileUpload {...defaultProps} />)

      // Simulate rejected file due to size
      if (capturedOnDrop) {
        capturedOnDrop([], [{ errors: [{ code: 'file-too-large' }] }])
      }

      expect(defaultProps.setError).toHaveBeenCalledWith('La photo ne doit pas dépasser 10 MB')
    })
  })

  describe('File validation - Type', () => {
    it('should show error for invalid file types', () => {
      const mockDropzone = useDropzone as jest.Mock
      let capturedOnDrop: ((files: File[], rejected: Array<{ errors: Array<{ code: string }> }>) => void) | undefined

      mockDropzone.mockImplementation(({ onDrop }) => {
        capturedOnDrop = onDrop
        return {
          getRootProps: () => ({}),
          getInputProps: () => ({}),
          isDragActive: false,
          isDragReject: false,
        }
      })

      render(<FileUpload {...defaultProps} />)

      // Simulate rejected file due to type
      if (capturedOnDrop) {
        capturedOnDrop([], [{ errors: [{ code: 'file-invalid-type' }] }])
      }

      expect(defaultProps.setError).toHaveBeenCalledWith(
        'Format de fichier invalide. Utilisez JPG, PNG ou WEBP.'
      )
    })
  })

  describe('Preview mode', () => {
    it('should show preview image when previewUrl is provided', () => {
      render(<FileUpload {...defaultProps} previewUrl="blob:preview-url" />)

      const previewImage = screen.getByAltText('Prévisualisation selfie')
      expect(previewImage).toBeInTheDocument()
      expect(previewImage).toHaveAttribute('src', 'blob:preview-url')
    })

    it('should show retry button and success message in preview mode', () => {
      render(<FileUpload {...defaultProps} previewUrl="blob:preview-url" />)

      expect(screen.getByRole('button', { name: /Changer de photo/i })).toBeInTheDocument()
      expect(screen.getByText(/Photo prête/i)).toBeInTheDocument()
    })

    it('should not show dropzone when preview is shown', () => {
      render(<FileUpload {...defaultProps} previewUrl="blob:preview-url" />)

      expect(screen.queryByText(/Glissez votre photo ici/i)).not.toBeInTheDocument()
    })

    it('should call onRetry when clicking change button', () => {
      render(<FileUpload {...defaultProps} previewUrl="blob:preview-url" />)

      fireEvent.click(screen.getByRole('button', { name: /Changer de photo/i }))

      expect(defaultProps.onRetry).toHaveBeenCalled()
    })
  })

  describe('Drag states', () => {
    it('should show active drag state', () => {
      const mockDropzone = useDropzone as jest.Mock
      mockDropzone.mockReturnValue({
        getRootProps: () => ({}),
        getInputProps: () => ({}),
        isDragActive: true,
        isDragReject: false,
      })

      render(<FileUpload {...defaultProps} />)

      expect(screen.getByText(/Déposez votre photo ici/i)).toBeInTheDocument()
    })

    it('should show reject drag state for invalid files', () => {
      const mockDropzone = useDropzone as jest.Mock
      mockDropzone.mockReturnValue({
        getRootProps: () => ({}),
        getInputProps: () => ({}),
        isDragActive: true,
        isDragReject: true,
      })

      render(<FileUpload {...defaultProps} />)

      expect(screen.getByText(/Format de fichier non supporté/i)).toBeInTheDocument()
    })
  })

  describe('Native input', () => {
    it('should have capture="user" attribute for mobile camera', () => {
      render(<FileUpload {...defaultProps} />)

      const hiddenInput = document.querySelector('input[type="file"]')
      expect(hiddenInput).toHaveAttribute('capture', 'user')
    })

    it('should accept only image types', () => {
      render(<FileUpload {...defaultProps} />)

      const hiddenInput = document.querySelector('input[type="file"]')
      expect(hiddenInput).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp')
    })
  })
})
