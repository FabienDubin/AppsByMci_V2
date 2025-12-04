// Tests for Google AI service (Gemini 2.5 Flash Image)
import { googleAIService } from '@/lib/services/google-ai.service'

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

    it('should include reference image in request when provided (legacy)', async () => {
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

    it('should include multiple reference images in request (AC4)', async () => {
      const base64Image = Buffer.from('test-image').toString('base64')
      const image1 = Buffer.from('selfie-data')
      const image2 = Buffer.from('logo-data')
      const image3 = Buffer.from('background-data')

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

      await googleAIService.generateImageWithGemini('Combine Image 1 with Image 2 and Image 3', {
        referenceImages: [image1, image2, image3],
      })

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      // 1 text prompt + 3 images = 4 parts
      expect(requestBody.contents[0].parts).toHaveLength(4)
      expect(requestBody.contents[0].parts[0].text).toBe('Combine Image 1 with Image 2 and Image 3')

      // Verify all 3 images are included in order
      expect(requestBody.contents[0].parts[1].inline_data.data).toBe(image1.toString('base64'))
      expect(requestBody.contents[0].parts[2].inline_data.data).toBe(image2.toString('base64'))
      expect(requestBody.contents[0].parts[3].inline_data.data).toBe(image3.toString('base64'))
    })

    it('should include aspectRatio in generationConfig (AC4)', async () => {
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

      await googleAIService.generateImageWithGemini('Generate portrait image', {
        aspectRatio: '9:16',
      })

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(requestBody.generationConfig.imageConfig).toBeDefined()
      expect(requestBody.generationConfig.imageConfig.aspectRatio).toBe('9:16')
    })

    it('should handle multi-images with aspectRatio together (AC4)', async () => {
      const base64Image = Buffer.from('test-image').toString('base64')
      const image1 = Buffer.from('selfie-data')
      const image2 = Buffer.from('logo-data')

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

      await googleAIService.generateImageWithGemini('Combine images', {
        referenceImages: [image1, image2],
        aspectRatio: '16:9',
      })

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      // 1 text + 2 images
      expect(requestBody.contents[0].parts).toHaveLength(3)
      // Check aspectRatio is set
      expect(requestBody.generationConfig.imageConfig.aspectRatio).toBe('16:9')
    })

    it('should not include imageConfig when aspectRatio is not provided', async () => {
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

      await googleAIService.generateImageWithGemini('Simple prompt')

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(requestBody.generationConfig.imageConfig).toBeUndefined()
    })
  })
})
