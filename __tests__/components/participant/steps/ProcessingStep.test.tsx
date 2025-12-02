/**
 * @jest-environment jsdom
 */
import { render, screen, act } from '@testing-library/react'
import { ProcessingStep } from '@/components/participant/steps/ProcessingStep'

describe('ProcessingStep', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Initial render', () => {
    it('should render processing step container', () => {
      render(<ProcessingStep generationId="gen-123" />)

      expect(screen.getByTestId('processing-step')).toBeInTheDocument()
    })

    it('should include generation ID as data attribute', () => {
      render(<ProcessingStep generationId="gen-123" />)

      const container = screen.getByTestId('processing-step')
      expect(container).toHaveAttribute('data-generation-id', 'gen-123')
    })

    it('should render spinner', () => {
      render(<ProcessingStep generationId="gen-123" />)

      // Spinner is rendered with animate-spin class
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('should render first default loading message', () => {
      render(<ProcessingStep generationId="gen-123" />)

      expect(screen.getByTestId('loading-message')).toHaveTextContent(
        "L'IA travaille sur ton image"
      )
    })

    // Note: hint text "Ne ferme pas cette page" removed from UI for cleaner design
  })

  describe('Message rotation', () => {
    it('should rotate to next message after interval', () => {
      render(<ProcessingStep generationId="gen-123" />)

      // First message
      expect(screen.getByTestId('loading-message')).toHaveTextContent(
        "L'IA travaille sur ton image"
      )

      // Advance time by 3.5 seconds
      act(() => {
        jest.advanceTimersByTime(3500)
      })

      // Should show second message
      expect(screen.getByTestId('loading-message')).toHaveTextContent(
        'Un peu de magie en cours'
      )
    })

    it('should cycle through all messages', () => {
      render(<ProcessingStep generationId="gen-123" />)

      const defaultMessages = [
        "L'IA travaille sur ton image",
        'Un peu de magie en cours',
        'Génération en cours, patience',
        'Presque terminé, ça arrive',
        'On peaufine les derniers détails',
      ]

      // Test cycling through all messages
      for (let i = 0; i < defaultMessages.length; i++) {
        expect(screen.getByTestId('loading-message').textContent).toContain(
          defaultMessages[i].replace(/[🎨✨🚀🌟🎭]/g, '').trim()
        )

        act(() => {
          jest.advanceTimersByTime(3500)
        })
      }

      // Should loop back to first message
      expect(screen.getByTestId('loading-message')).toHaveTextContent(
        "L'IA travaille sur ton image"
      )
    })
  })

  describe('Custom loading messages', () => {
    it('should use custom messages when provided', () => {
      const customMessages = ['Custom message 1', 'Custom message 2']

      render(
        <ProcessingStep
          generationId="gen-123"
          customLoadingMessages={customMessages}
        />
      )

      expect(screen.getByTestId('loading-message')).toHaveTextContent(
        'Custom message 1'
      )
    })

    it('should cycle through custom messages', () => {
      const customMessages = ['Message A', 'Message B']

      render(
        <ProcessingStep
          generationId="gen-123"
          customLoadingMessages={customMessages}
        />
      )

      expect(screen.getByTestId('loading-message')).toHaveTextContent('Message A')

      act(() => {
        jest.advanceTimersByTime(3500)
      })

      expect(screen.getByTestId('loading-message')).toHaveTextContent('Message B')

      act(() => {
        jest.advanceTimersByTime(3500)
      })

      // Should loop back
      expect(screen.getByTestId('loading-message')).toHaveTextContent('Message A')
    })

    it('should use default messages if custom array is empty', () => {
      render(
        <ProcessingStep generationId="gen-123" customLoadingMessages={[]} />
      )

      expect(screen.getByTestId('loading-message')).toHaveTextContent(
        "L'IA travaille sur ton image"
      )
    })
  })

  describe('Cleanup', () => {
    it('should clear interval on unmount', () => {
      const { unmount } = render(<ProcessingStep generationId="gen-123" />)

      const clearIntervalSpy = jest.spyOn(global, 'clearInterval')

      unmount()

      expect(clearIntervalSpy).toHaveBeenCalled()
      clearIntervalSpy.mockRestore()
    })
  })
})
