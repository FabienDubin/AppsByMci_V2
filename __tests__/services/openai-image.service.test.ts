// Tests for OpenAI image service
import { openaiImageService, OpenAIImageError } from '@/lib/services/openai-image.service'

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

describe('openai-image.service', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv, OPENAI_API_KEY: 'test-api-key' }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('generateImage (DALL-E 3)', () => {
    it('should throw error if API key is not set', async () => {
      process.env.OPENAI_API_KEY = ''

      await expect(
        openaiImageService.generateImage('Test prompt')
      ).rejects.toThrow('OPENAI_API_KEY environment variable is not set')
    })

    it('should call OpenAI API with correct parameters', async () => {
      const mockImageUrl = 'https://example.com/image.png'
      const mockImageBuffer = Buffer.from('fake-image-data')

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: [{ url: mockImageUrl }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(mockImageBuffer.buffer),
        })

      await openaiImageService.generateImage('Test prompt', {
        size: '1024x1024',
        quality: 'standard',
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/images/generations',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-api-key',
          },
        })
      )

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(requestBody.model).toBe('dall-e-3')
      expect(requestBody.prompt).toBe('Test prompt')
      expect(requestBody.size).toBe('1024x1024')
      expect(requestBody.quality).toBe('standard')
    })

    it('should throw OpenAIImageError on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            error: {
              message: 'Invalid prompt',
              type: 'invalid_request_error',
              code: 'invalid_prompt',
            },
          }),
      })

      await expect(
        openaiImageService.generateImage('Bad prompt')
      ).rejects.toThrow(OpenAIImageError)
    })

    it('should handle rate limit errors correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () =>
          Promise.resolve({
            error: {
              message: 'Rate limit exceeded',
              type: 'rate_limit_error',
              code: 'rate_limit_exceeded',
            },
          }),
      })

      try {
        await openaiImageService.generateImage('Test prompt')
      } catch (error) {
        expect(error).toBeInstanceOf(OpenAIImageError)
        expect((error as OpenAIImageError).status).toBe(429)
        expect((error as OpenAIImageError).type).toBe('rate_limit_error')
      }
    })
  })

  describe('editImage (GPT Image 1)', () => {
    const testImageBuffer = Buffer.from('fake-image-data')

    it('should call OpenAI API with FormData for single image edit', async () => {
      const mockImageUrl = 'https://example.com/edited.png'
      const mockResultBuffer = Buffer.from('edited-image-data')

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: [{ url: mockImageUrl }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(mockResultBuffer.buffer),
        })

      // Now accepts array of buffers
      await openaiImageService.editImage([testImageBuffer], 'Transform to cartoon')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/images/edits',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-api-key',
          },
        })
      )

      // Verify FormData was used
      const requestBody = mockFetch.mock.calls[0][1].body
      expect(requestBody).toBeInstanceOf(FormData)
    })

    it('should handle multiple images for multi-reference edit (AC3)', async () => {
      const mockImageUrl = 'https://example.com/edited.png'
      const mockResultBuffer = Buffer.from('edited-image-data')
      const image1 = Buffer.from('image-1-data')
      const image2 = Buffer.from('image-2-data')
      const image3 = Buffer.from('image-3-data')

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: [{ url: mockImageUrl }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(mockResultBuffer.buffer),
        })

      await openaiImageService.editImage(
        [image1, image2, image3],
        'Combine Image 1 with Image 2 and Image 3'
      )

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/images/edits',
        expect.objectContaining({
          method: 'POST',
        })
      )

      // Verify FormData was used with multiple images
      const requestBody = mockFetch.mock.calls[0][1].body
      expect(requestBody).toBeInstanceOf(FormData)
    })

    it('should map aspectRatio to correct size (AC3)', async () => {
      const base64Image = Buffer.from('result-image').toString('base64')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [{ b64_json: base64Image }] }),
      })

      await openaiImageService.editImage(
        [testImageBuffer],
        'Transform',
        { aspectRatio: '2:3' }
      )

      const requestBody = mockFetch.mock.calls[0][1].body as FormData
      expect(requestBody.get('size')).toBe('1024x1536')
    })

    it('should use 1:1 aspectRatio mapping correctly', async () => {
      const base64Image = Buffer.from('result-image').toString('base64')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [{ b64_json: base64Image }] }),
      })

      await openaiImageService.editImage(
        [testImageBuffer],
        'Transform',
        { aspectRatio: '1:1' }
      )

      const requestBody = mockFetch.mock.calls[0][1].body as FormData
      expect(requestBody.get('size')).toBe('1024x1024')
    })

    it('should use 3:2 aspectRatio mapping correctly', async () => {
      const base64Image = Buffer.from('result-image').toString('base64')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [{ b64_json: base64Image }] }),
      })

      await openaiImageService.editImage(
        [testImageBuffer],
        'Transform',
        { aspectRatio: '3:2' }
      )

      const requestBody = mockFetch.mock.calls[0][1].body as FormData
      expect(requestBody.get('size')).toBe('1536x1024')
    })

    it('should handle base64 response format', async () => {
      const base64Image = Buffer.from('result-image').toString('base64')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [{ b64_json: base64Image }] }),
      })

      const result = await openaiImageService.editImage(
        [testImageBuffer],
        'Transform'
      )

      expect(result).toBeInstanceOf(Buffer)
      expect(result.toString()).toBe('result-image')
    })

    it('should throw error if no image data returned', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      })

      await expect(
        openaiImageService.editImage([testImageBuffer], 'Transform')
      ).rejects.toThrow('No image data returned from OpenAI')
    })

    it('should default to 1024x1024 when no aspectRatio or size provided', async () => {
      const base64Image = Buffer.from('result-image').toString('base64')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [{ b64_json: base64Image }] }),
      })

      await openaiImageService.editImage([testImageBuffer], 'Transform')

      const requestBody = mockFetch.mock.calls[0][1].body as FormData
      expect(requestBody.get('size')).toBe('1024x1024')
    })
  })
})
