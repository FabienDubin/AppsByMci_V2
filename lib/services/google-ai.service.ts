// Google AI Studio Service
// Handles Gemini 2.5 Flash Image generation via Google AI Studio API

import { logger } from '@/lib/logger'

/**
 * Gemini generation options
 *
 * Supported aspect ratios (10 available):
 * - '1:1' - Square
 * - '16:9' - Landscape (YouTube, desktop)
 * - '9:16' - Portrait (Stories, TikTok, Reels)
 * - '4:3' - Classic landscape
 * - '3:4' - Classic portrait
 * - '3:2' - Photo landscape
 * - '2:3' - Photo portrait
 * - '5:4' - Slightly landscape
 * - '4:5' - Instagram portrait
 * - '21:9' - Ultra-wide cinematic
 */
export interface GeminiGenerateOptions {
  temperature?: number
  /** @deprecated Use referenceImages array instead */
  referenceImage?: Buffer
  /** Array of reference images for multi-image generation (AC4) */
  referenceImages?: Buffer[]
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '3:2' | '2:3' | '5:4' | '4:5' | '21:9'
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
   * Generate an image using Gemini 2.5 Flash Image via Google AI Studio
   * Supports text-to-image and image-to-image (with reference images)
   *
   * @param prompt - Text prompt for image generation
   * @param options - Generation options including optional reference images and aspectRatio
   * @returns Buffer containing the generated image
   *
   * @example
   * ```ts
   * // Text-to-image
   * const imageBuffer = await googleAIService.generateImageWithGemini(
   *   'A beautiful sunset over the ocean'
   * )
   *
   * // Image-to-image with single reference (backward compatible)
   * const imageBuffer = await googleAIService.generateImageWithGemini(
   *   'Transform this person into a superhero',
   *   { referenceImage: selfieBuffer }
   * )
   *
   * // Multi-image with aspect ratio (AC4)
   * const imageBuffer = await googleAIService.generateImageWithGemini(
   *   'Combine Image 1 selfie with Image 2 logo and Image 3 background',
   *   {
   *     referenceImages: [selfieBuffer, logoBuffer, backgroundBuffer],
   *     aspectRatio: '9:16'
   *   }
   * )
   * ```
   */
  async generateImageWithGemini(
    prompt: string,
    options: GeminiGenerateOptions = {}
  ): Promise<Buffer> {
    const apiKey = getApiKey()

    // Support both legacy referenceImage and new referenceImages array
    const referenceImages: Buffer[] = options.referenceImages
      ? options.referenceImages
      : options.referenceImage
        ? [options.referenceImage]
        : []

    logger.info({
      model: 'gemini-2.5-flash-image',
      promptLength: prompt.length,
      referenceImageCount: referenceImages.length,
      aspectRatio: options.aspectRatio,
    }, 'Starting Gemini 2.5 Flash Image generation')

    const startTime = Date.now()

    // Gemini 2.5 Flash Image (Nano Banana) - supports text-to-image and image editing with reference
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`

    // Build parts array - text prompt + optional reference images (AC4)
    const parts: Array<{ text: string } | { inline_data: { mime_type: string; data: string } }> = []

    // Add text prompt first
    parts.push({ text: prompt })

    // Add all reference images in order (important for AC4 - order matters)
    for (const imageBuffer of referenceImages) {
      const base64Image = imageBuffer.toString('base64')
      parts.push({
        inline_data: {
          mime_type: 'image/jpeg',
          data: base64Image,
        },
      })
    }

    // Build generation config with aspectRatio if provided (AC4)
    const generationConfig: Record<string, any> = {
      responseModalities: ['TEXT', 'IMAGE'],
    }

    if (options.temperature) {
      generationConfig.temperature = options.temperature
    }

    // Add imageConfig with aspectRatio if provided (AC4)
    if (options.aspectRatio) {
      generationConfig.imageConfig = {
        aspectRatio: options.aspectRatio,
      }
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
        generationConfig,
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
      referenceImageCount: referenceImages.length,
      aspectRatio: options.aspectRatio,
    }, 'Gemini image generated successfully')

    return imageBuffer
  },
}
