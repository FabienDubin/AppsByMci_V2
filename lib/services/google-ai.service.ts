// Google AI Studio Service
// Handles Imagen 3 and Gemini 2.5 Flash Image generation via Google AI Studio API

import { logger } from '@/lib/logger'

/**
 * Imagen 3 generation options
 */
export interface ImagenGenerateOptions {
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
  sampleCount?: number
  safetyFilterLevel?: 'block_only_high' | 'block_medium_and_above' | 'block_low_and_above'
}

/**
 * Gemini generation options
 */
export interface GeminiGenerateOptions {
  temperature?: number
  referenceImage?: Buffer
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
}

/**
 * Custom error class for Google AI API errors
 */
export class GoogleAIError extends Error {
  status: number
  code: string

  constructor(message: string, status: number, code: string = 'unknown_error') {
    super(message)
    this.name = 'GoogleAIError'
    this.status = status
    this.code = code
  }
}

/**
 * Get Google AI Studio API key from environment
 */
function getApiKey(): string {
  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY environment variable is not set')
  }
  return apiKey
}

/**
 * Handle Google AI API response errors
 */
async function handleApiResponse(response: Response, operation: string): Promise<void> {
  if (!response.ok) {
    let errorMessage = `Google AI ${operation} failed`
    let errorCode = 'unknown_error'

    try {
      const errorData = await response.json()
      errorMessage = errorData.error?.message || errorMessage
      errorCode = errorData.error?.code || errorCode
    } catch {
      // Ignore JSON parsing errors
    }

    logger.error({
      operation,
      status: response.status,
      errorMessage,
      errorCode,
    }, 'Google AI API error')

    throw new GoogleAIError(errorMessage, response.status, errorCode)
  }
}

/**
 * Google AI Studio Service
 */
export const googleAIService = {
  /**
   * Generate an image using Imagen 3 via Google AI Studio
   *
   * @param prompt - Text prompt for image generation
   * @param options - Generation options
   * @returns Buffer containing the generated image
   *
   * @example
   * ```ts
   * const imageBuffer = await googleAIService.generateImageWithImagen(
   *   'A beautiful sunset over the ocean',
   *   { aspectRatio: '1:1' }
   * )
   * ```
   */
  async generateImageWithImagen(
    prompt: string,
    options: ImagenGenerateOptions = {}
  ): Promise<Buffer> {
    const apiKey = getApiKey()
    const {
      aspectRatio = '1:1',
      sampleCount = 1,
      safetyFilterLevel = 'block_only_high',
    } = options

    logger.info({
      model: 'imagen-3',
      promptLength: prompt.length,
      aspectRatio,
    }, 'Starting Imagen 3 image generation')

    const startTime = Date.now()

    // Imagen API via Google AI Studio - using Imagen 4.0 (Imagen 3.0 is deprecated)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instances: [
          {
            prompt,
          },
        ],
        parameters: {
          sampleCount,
          aspectRatio,
          safetyFilterLevel,
        },
      }),
    })

    await handleApiResponse(response, 'generateImageWithImagen')

    const data = await response.json()

    // Imagen 3 returns base64-encoded image in predictions[].bytesBase64Encoded
    const base64Image = data.predictions?.[0]?.bytesBase64Encoded

    if (!base64Image) {
      logger.error({ response: data }, 'No image data in Imagen 3 response')
      throw new Error('No image data returned from Imagen 3')
    }

    // Decode base64 to buffer
    const imageBuffer = Buffer.from(base64Image, 'base64')

    const duration = Date.now() - startTime
    logger.info({
      model: 'imagen-3',
      duration: `${duration}ms`,
      imageSize: imageBuffer.length,
    }, 'Imagen 3 image generated successfully')

    return imageBuffer
  },

  /**
   * Generate an image using Gemini 2.5 Flash Image via Google AI Studio
   * Supports text-to-image and image-to-image (with reference image)
   *
   * @param prompt - Text prompt for image generation
   * @param options - Generation options including optional reference image
   * @returns Buffer containing the generated image
   *
   * @example
   * ```ts
   * // Text-to-image
   * const imageBuffer = await googleAIService.generateImageWithGemini(
   *   'A beautiful sunset over the ocean'
   * )
   *
   * // Image-to-image with reference
   * const imageBuffer = await googleAIService.generateImageWithGemini(
   *   'Transform this person into a superhero',
   *   { referenceImage: selfieBuffer }
   * )
   * ```
   */
  async generateImageWithGemini(
    prompt: string,
    options: GeminiGenerateOptions = {}
  ): Promise<Buffer> {
    const apiKey = getApiKey()
    const hasReferenceImage = !!options.referenceImage

    logger.info({
      model: 'gemini-2.5-flash-image',
      promptLength: prompt.length,
      hasReferenceImage,
    }, 'Starting Gemini 2.5 Flash Image generation')

    const startTime = Date.now()

    // Gemini 2.5 Flash Image (Nano Banana) - supports text-to-image and image editing with reference
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`

    // Build parts array - text prompt + optional reference image
    const parts: Array<{ text: string } | { inline_data: { mime_type: string; data: string } }> = []

    // Add text prompt
    parts.push({ text: prompt })

    // Add reference image if provided
    if (options.referenceImage) {
      const base64Image = options.referenceImage.toString('base64')
      parts.push({
        inline_data: {
          mime_type: 'image/jpeg',
          data: base64Image,
        },
      })
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts,
          },
        ],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
          ...(options.temperature && { temperature: options.temperature }),
        },
      }),
    })

    await handleApiResponse(response, 'generateImageWithGemini')

    const data = await response.json()

    // Gemini returns image data in candidates[].content.parts[] with inlineData
    const responseParts = data.candidates?.[0]?.content?.parts
    if (!responseParts || !Array.isArray(responseParts)) {
      logger.error({ response: data }, 'Invalid Gemini response structure')
      throw new Error('Invalid response structure from Gemini')
    }

    // Find the image part
    const imagePart = responseParts.find((part: any) => part.inlineData?.mimeType?.startsWith('image/'))

    if (!imagePart?.inlineData?.data) {
      logger.error({ parts: responseParts }, 'No image data in Gemini response')
      throw new Error('No image data returned from Gemini')
    }

    // Decode base64 to buffer
    const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64')

    const duration = Date.now() - startTime
    logger.info({
      model: 'gemini-2.5-flash-image',
      duration: `${duration}ms`,
      imageSize: imageBuffer.length,
      mimeType: imagePart.inlineData.mimeType,
      hasReferenceImage,
    }, 'Gemini image generated successfully')

    return imageBuffer
  },
}
