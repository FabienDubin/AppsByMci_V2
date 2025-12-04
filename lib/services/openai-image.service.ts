// OpenAI Image Service
// Handles DALL-E 3 (text-to-image) and GPT Image 1 (image-to-image) generation

import { logger } from '@/lib/logger'

/**
 * Image generation options for DALL-E 3
 */
export interface GenerateImageOptions {
  size?: '1024x1024' | '1024x1792' | '1792x1024'
  quality?: 'standard' | 'hd'
  style?: 'vivid' | 'natural'
}

/**
 * Image edit options for GPT Image 1
 * Supports aspectRatio for convenience (will be mapped to size)
 */
export interface EditImageOptions {
  size?: '1024x1024' | '1536x1024' | '1024x1536'
  aspectRatio?: '1:1' | '2:3' | '3:2'
}

/**
 * Mapping from aspect ratio to OpenAI image size
 * AC3: '1:1' → '1024x1024', '2:3' → '1024x1536', '3:2' → '1536x1024'
 */
const OPENAI_ASPECT_RATIO_MAP: Record<string, '1024x1024' | '1024x1536' | '1536x1024'> = {
  '1:1': '1024x1024',
  '2:3': '1024x1536',
  '3:2': '1536x1024',
}

/**
 * OpenAI API error response
 */
interface OpenAIError {
  error: {
    message: string
    type: string
    code: string
  }
}

/**
 * Custom error class for OpenAI API errors
 */
export class OpenAIImageError extends Error {
  status: number
  code: string
  type: string

  constructor(message: string, status: number, code: string, type: string) {
    super(message)
    this.name = 'OpenAIImageError'
    this.status = status
    this.code = code
    this.type = type
  }
}

/**
 * Get OpenAI API key from environment
 */
function getApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }
  return apiKey
}

/**
 * Handle OpenAI API response errors
 */
async function handleApiResponse(response: Response, operation: string): Promise<void> {
  if (!response.ok) {
    let errorMessage = `OpenAI ${operation} failed`
    let errorCode = 'unknown_error'
    let errorType = 'api_error'

    try {
      const errorData: OpenAIError = await response.json()
      errorMessage = errorData.error?.message || errorMessage
      errorCode = errorData.error?.code || errorCode
      errorType = errorData.error?.type || errorType
    } catch {
      // Ignore JSON parsing errors
    }

    logger.error({
      operation,
      status: response.status,
      errorMessage,
      errorCode,
      errorType,
    }, 'OpenAI API error')

    throw new OpenAIImageError(errorMessage, response.status, errorCode, errorType)
  }
}

/**
 * Download image from URL and return as Buffer
 */
async function downloadImageUrl(url: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * OpenAI Image Service
 */
export const openaiImageService = {
  /**
   * Generate an image using DALL-E 3 (text-to-image)
   *
   * @param prompt - Text prompt for image generation
   * @param options - Generation options
   * @returns Buffer containing the generated image
   *
   * @example
   * ```ts
   * const imageBuffer = await openaiImageService.generateImage(
   *   'A beautiful sunset over the ocean',
   *   { size: '1024x1024', quality: 'standard' }
   * )
   * ```
   */
  async generateImage(
    prompt: string,
    options: GenerateImageOptions = {}
  ): Promise<Buffer> {
    const apiKey = getApiKey()
    const { size = '1024x1024', quality = 'standard', style = 'vivid' } = options

    logger.info({
      model: 'dall-e-3',
      promptLength: prompt.length,
      size,
      quality,
      style,
    }, 'Starting DALL-E 3 image generation')

    const startTime = Date.now()

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        size,
        quality,
        style,
        n: 1,
        response_format: 'url',
      }),
    })

    await handleApiResponse(response, 'generateImage')

    const data = await response.json()
    const imageUrl = data.data?.[0]?.url

    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI')
    }

    // Download the image
    const imageBuffer = await downloadImageUrl(imageUrl)

    const duration = Date.now() - startTime
    logger.info({
      model: 'dall-e-3',
      duration: `${duration}ms`,
      imageSize: imageBuffer.length,
    }, 'DALL-E 3 image generated successfully')

    return imageBuffer
  },

  /**
   * Edit an image using GPT Image 1 (image-to-image)
   * Supports multiple reference images (AC3)
   *
   * @param images - Source images as Buffer array (1 or more images)
   * @param prompt - Text prompt describing the desired edit
   * @param options - Edit options including aspectRatio
   * @returns Buffer containing the edited image
   *
   * @example
   * ```ts
   * // Single image (backward compatible)
   * const editedImage = await openaiImageService.editImage(
   *   [selfieBuffer],
   *   'Transform this photo into a cartoon style',
   *   { aspectRatio: '1:1' }
   * )
   *
   * // Multi-images
   * const editedImage = await openaiImageService.editImage(
   *   [selfieBuffer, logoBuffer, backgroundBuffer],
   *   'Combine Image 1 with Image 2 logo and Image 3 background',
   *   { aspectRatio: '9:16' }
   * )
   * ```
   */
  async editImage(
    images: Buffer[],
    prompt: string,
    options: EditImageOptions = {}
  ): Promise<Buffer> {
    const apiKey = getApiKey()

    // Determine size from aspectRatio or direct size parameter
    const size = options.aspectRatio
      ? OPENAI_ASPECT_RATIO_MAP[options.aspectRatio] || '1024x1024'
      : options.size || '1024x1024'

    logger.info({
      model: 'gpt-image-1',
      promptLength: prompt.length,
      size,
      aspectRatio: options.aspectRatio,
      imageCount: images.length,
      imageSizes: images.map(img => img.length),
    }, 'Starting GPT Image 1 edit')

    const startTime = Date.now()

    // Create FormData for multipart request
    const formData = new FormData()
    formData.append('model', 'gpt-image-1')
    formData.append('prompt', prompt)
    formData.append('size', size)
    formData.append('n', '1')

    // Add images as files (multiple images for multi-reference)
    // GPT Image 1 accepts multiple images via the 'image' field
    images.forEach((imageBuffer, index) => {
      const arrayBuffer = imageBuffer.buffer.slice(
        imageBuffer.byteOffset,
        imageBuffer.byteOffset + imageBuffer.byteLength
      ) as ArrayBuffer
      const imageBlob = new Blob([arrayBuffer], { type: 'image/png' })
      formData.append('image', imageBlob, `image_${index}.png`)
    })

    const response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    })

    await handleApiResponse(response, 'editImage')

    const data = await response.json()

    // GPT Image 1 returns base64-encoded image data
    let resultBuffer: Buffer

    if (data.data?.[0]?.b64_json) {
      // Base64 response
      resultBuffer = Buffer.from(data.data[0].b64_json, 'base64')
    } else if (data.data?.[0]?.url) {
      // URL response
      resultBuffer = await downloadImageUrl(data.data[0].url)
    } else {
      throw new Error('No image data returned from OpenAI')
    }

    const duration = Date.now() - startTime
    logger.info({
      model: 'gpt-image-1',
      duration: `${duration}ms`,
      imageSize: resultBuffer.length,
      imageCount: images.length,
    }, 'GPT Image 1 edit completed successfully')

    return resultBuffer
  },
}
