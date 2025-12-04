// Azure Blob Storage Results Service
// Handles selfie uploads and AI-generated result storage

import { logger } from '@/lib/logger'
import { blobCoreService } from './blob-core.service'
import { CONTAINERS, MAX_SELFIE_SIZE } from './blob.constants'
import { getExtensionFromMimeType, parseBase64DataUrl } from './blob-utils'

/**
 * Results service for managing selfies and generated images
 */
class BlobResultsService {
  /**
   * Upload a participant selfie to Azure Blob Storage
   * @param base64Data - Base64 encoded image data (with or without data URL prefix)
   * @param generationId - Generation ID for unique naming
   * @returns URL of the uploaded selfie (private, requires SAS for access)
   */
  async uploadSelfie(base64Data: string, generationId: string): Promise<string> {
    // Parse base64 data URL
    const { contentType, base64Content } = parseBase64DataUrl(base64Data)

    // Decode base64 to buffer
    const buffer = Buffer.from(base64Content, 'base64')

    // Validate file size
    if (buffer.length > MAX_SELFIE_SIZE) {
      throw new Error(`Le selfie ne doit pas dépasser ${MAX_SELFIE_SIZE / (1024 * 1024)} MB`)
    }

    // Generate blob name: selfies/{generationId}.jpg
    const extension = getExtensionFromMimeType(contentType)
    const blobName = `selfies/${generationId}.${extension}`

    // Upload file to uploads container (private)
    const result = await blobCoreService.uploadFile(CONTAINERS.UPLOADS, blobName, buffer, {
      contentType,
      metadata: {
        generationId,
        uploadedAt: new Date().toISOString(),
      },
    })

    logger.info({ msg: 'Selfie uploaded', generationId, blobName })

    return result.url
  }

  /**
   * Upload a generated result image to Azure Blob Storage
   * @param imageBuffer - Buffer containing the generated image
   * @param generationId - Generation ID for unique naming
   * @returns URL of the uploaded result (requires SAS for access)
   */
  async uploadResult(imageBuffer: Buffer, generationId: string): Promise<string> {
    // Generate blob name: results/{generationId}.png
    const blobName = `results/${generationId}.png`

    // Upload file to generated-images container (private)
    const result = await blobCoreService.uploadFile(CONTAINERS.GENERATED_IMAGES, blobName, imageBuffer, {
      contentType: 'image/png',
      metadata: {
        generationId,
        uploadedAt: new Date().toISOString(),
      },
    })

    logger.info({ msg: 'Result uploaded', generationId, blobName })

    return result.url
  }

  /**
   * Get a signed URL (SAS) for accessing a generated result
   * @param generationId - Generation ID
   * @param expiryMinutes - URL validity duration (default: 60 minutes)
   * @returns Signed URL for accessing the result
   */
  async getResultSasUrl(generationId: string, expiryMinutes: number = 60): Promise<string> {
    const blobName = `results/${generationId}.png`
    return blobCoreService.generateSasUrl(CONTAINERS.GENERATED_IMAGES, blobName, expiryMinutes)
  }
}

// Export singleton instance
export const blobResultsService = new BlobResultsService()
