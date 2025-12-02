// Tests for Google AI service
import { googleAIService, GoogleAIError } from '@/lib/services/google-ai.service'

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}))

describe('google-ai.service', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv, GOOGLE_API_KEY: 'test-google-api-key' }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('generateImageWithImagen', () => {
    it('should throw error if API key is not set', async () => {
      process.env.GOOGLE_API_KEY = ''

      await expect(
        googleAIService.generateImageWithImagen('Test prompt')
      ).rejects.toThrow('GOOGLE_API_KEY environment variable is not set')
    })

    it('should call Imagen API with correct parameters', async () => {
      const base64Image = Buffer.from('test-image').toString('base64')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            predictions: [{ bytesBase64Encoded: base64Image }],
          }),
      })

      await googleAIService.generateImageWithImagen('Test prompt', {
        aspectRatio: '1:1',
      })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('imagen-4.0-generate-001:predict'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(requestBody.instances[0].prompt).toBe('Test prompt')
      expect(requestBody.parameters.aspectRatio).toBe('1:1')
    })

    it('should decode base64 response to buffer', async () => {
      const originalImage = 'test-image-data'
      const base64Image = Buffer.from(originalImage).toString('base64')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            predictions: [{ bytesBase64Encoded: base64Image }],
          }),
      })

      const result = await googleAIService.generateImageWithImagen('Test prompt')

      expect(result).toBeInstanceOf(Buffer)
      expect(result.toString()).toBe(originalImage)
    })

    it('should throw error if no image data in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ predictions: [] }),
      })

      await expect(
        googleAIService.generateImageWithImagen('Test prompt')
      ).rejects.toThrow('No image data returned from Imagen 3')
    })

    it('should throw GoogleAIError on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            error: {
              message: 'Invalid request',
              code: 'INVALID_ARGUMENT',
            },
          }),
      })

      await expect(
        googleAIService.generateImageWithImagen('Bad prompt')
      ).rejects.toThrow(GoogleAIError)
    })
  })

  describe('generateImageWithGemini', () => {
    it('should call Gemini API with correct parameters', async () => {
      const base64Image = Buffer.from('test-image').toString('base64')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      inlineData: {
                        mimeType: 'image/png',
                        data: base64Image,
                      },
                    },
                  ],
                },
              },
            ],
          }),
      })

      await googleAIService.generateImageWithGemini('Test prompt')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('gemini-2.5-flash-image:generateContent'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(requestBody.contents[0].parts[0].text).toBe('Test prompt')
      expect(requestBody.generationConfig.responseModalities).toContain('IMAGE')
    })

    it('should extract image from Gemini response parts', async () => {
      const originalImage = 'gemini-generated-image'
      const base64Image = Buffer.from(originalImage).toString('base64')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [
                    { text: 'Some text response' },
                    {
                      inlineData: {
                        mimeType: 'image/png',
                        data: base64Image,
                      },
                    },
                  ],
                },
              },
            ],
          }),
      })

      const result = await googleAIService.generateImageWithGemini('Test prompt')

      expect(result).toBeInstanceOf(Buffer)
      expect(result.toString()).toBe(originalImage)
    })

    it('should throw error if no image part in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [{ text: 'Only text, no image' }],
                },
              },
            ],
          }),
      })

      await expect(
        googleAIService.generateImageWithGemini('Test prompt')
      ).rejects.toThrow('No image data returned from Gemini')
    })

    it('should throw error on invalid response structure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ candidates: [] }),
      })

      await expect(
        googleAIService.generateImageWithGemini('Test prompt')
      ).rejects.toThrow('Invalid response structure from Gemini')
    })

    it('should include reference image in request when provided', async () => {
      const base64Image = Buffer.from('test-image').toString('base64')
      const referenceImage = Buffer.from('reference-selfie-data')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      inlineData: {
                        mimeType: 'image/png',
                        data: base64Image,
                      },
                    },
                  ],
                },
              },
            ],
          }),
      })

      await googleAIService.generateImageWithGemini('Transform this person', {
        referenceImage,
      })

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(requestBody.contents[0].parts).toHaveLength(2)
      expect(requestBody.contents[0].parts[0].text).toBe('Transform this person')
      expect(requestBody.contents[0].parts[1].inline_data).toBeDefined()
      expect(requestBody.contents[0].parts[1].inline_data.mime_type).toBe('image/jpeg')
      expect(requestBody.contents[0].parts[1].inline_data.data).toBe(
        referenceImage.toString('base64')
      )
    })
  })
})
