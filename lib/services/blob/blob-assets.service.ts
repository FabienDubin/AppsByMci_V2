// Azure Blob Storage Assets Service
// Handles logo and background image uploads/deletions

import { logger } from '@/lib/logger'
import { blobCoreService } from './blob-core.service'
import {
  CONTAINERS,
  ALLOWED_LOGO_TYPES,
  ALLOWED_BACKGROUND_TYPES,
  ALLOWED_REFERENCE_IMAGE_TYPES,
  MAX_LOGO_SIZE,
  MAX_BACKGROUND_SIZE,
  MAX_REFERENCE_IMAGE_SIZE,
} from './blob.constants'
import { getExtensionFromMimeType, extractBlobNameFromUrl } from './blob-utils'

/**
 * Assets service for managing logos and backgrounds
 */
class BlobAssetsService {
  /**
   * Upload a logo file to Azure Blob Storage
   * @param buffer - Buffer containing file data
   * @param contentType - MIME type of the file
   * @param userId - User ID for organizing files
   * @returns Public URL of the uploaded logo
   */
  async uploadLogo(buffer: Buffer, contentType: string, userId: string): Promise<string> {
    // Validate file size
    if (buffer.length > MAX_LOGO_SIZE) {
      throw new Error(`Le logo ne doit pas dépasser ${MAX_LOGO_SIZE / (1024 * 1024)} MB`)
    }

    // Validate content type
    if (!ALLOWED_LOGO_TYPES.includes(contentType as (typeof ALLOWED_LOGO_TYPES)[number])) {
      throw new Error(`Format de fichier non supporté. Formats acceptés: ${ALLOWED_LOGO_TYPES.join(', ')}`)
    }

    // Generate unique blob name
    const timestamp = Date.now()
    const uuid = crypto.randomUUID()
    const extension = getExtensionFromMimeType(contentType)
    const blobName = `${userId}/${timestamp}-${uuid}.${extension}`

    // Upload file
    const result = await blobCoreService.uploadFile(CONTAINERS.LOGOS, blobName, buffer, {
      contentType,
      metadata: { userId, uploadedAt: new Date().toISOString() },
    })

    logger.info({ msg: 'Logo uploaded', userId, blobName })

    // Return public URL (container has public blob access)
    return result.url
  }

  /**
   * Upload a background image to Azure Blob Storage
   * @param buffer - Buffer containing file data
   * @param contentType - MIME type of the file
   * @param userId - User ID for organizing files
   * @returns Public URL of the uploaded background
   */
  async uploadBackground(buffer: Buffer, contentType: string, userId: string): Promise<string> {
    // Validate file size
    if (buffer.length > MAX_BACKGROUND_SIZE) {
      throw new Error(`L'image de fond ne doit pas dépasser ${MAX_BACKGROUND_SIZE / (1024 * 1024)} MB`)
    }

    // Validate content type
    if (!ALLOWED_BACKGROUND_TYPES.includes(contentType as (typeof ALLOWED_BACKGROUND_TYPES)[number])) {
      throw new Error(`Format de fichier non supporté. Formats acceptés: ${ALLOWED_BACKGROUND_TYPES.join(', ')}`)
    }

    // Generate unique blob name
    const timestamp = Date.now()
    const uuid = crypto.randomUUID()
    const extension = getExtensionFromMimeType(contentType)
    const blobName = `${userId}/${timestamp}-${uuid}.${extension}`

    // Upload file
    const result = await blobCoreService.uploadFile(CONTAINERS.BACKGROUNDS, blobName, buffer, {
      contentType,
      metadata: { userId, uploadedAt: new Date().toISOString() },
    })

    logger.info({ msg: 'Background uploaded', userId, blobName })

    // Return public URL (container has public blob access)
    return result.url
  }

  /**
   * Delete a logo file from Azure Blob Storage
   * @param url - Public URL of the logo to delete
   */
  async deleteLogo(url: string): Promise<void> {
    const blobName = extractBlobNameFromUrl(url, CONTAINERS.LOGOS)
    if (blobName) {
      await blobCoreService.deleteFile(CONTAINERS.LOGOS, blobName)
    }
  }

  /**
   * Delete a background file from Azure Blob Storage
   * @param url - Public URL of the background to delete
   */
  async deleteBackground(url: string): Promise<void> {
    const blobName = extractBlobNameFromUrl(url, CONTAINERS.BACKGROUNDS)
    if (blobName) {
      await blobCoreService.deleteFile(CONTAINERS.BACKGROUNDS, blobName)
    }
  }

  /**
   * Upload a reference image for AI generation block (Story 4.8)
   * @param buffer - Buffer containing file data
   * @param contentType - MIME type of the file (PNG, JPEG, WebP)
   * @param animationId - Animation ID for organizing files
   * @returns Object with URL and filename
   */
  async uploadReferenceImage(
    buffer: Buffer,
    contentType: string,
    animationId: string
  ): Promise<{ url: string; filename: string }> {
    // Validate file size
    if (buffer.length > MAX_REFERENCE_IMAGE_SIZE) {
      throw new Error(`L'image de référence ne doit pas dépasser ${MAX_REFERENCE_IMAGE_SIZE / (1024 * 1024)} MB`)
    }

    // Validate content type
    if (!ALLOWED_REFERENCE_IMAGE_TYPES.includes(contentType as (typeof ALLOWED_REFERENCE_IMAGE_TYPES)[number])) {
      throw new Error(`Format de fichier non supporté. Formats acceptés: PNG, JPEG, WebP`)
    }

    // Generate unique blob name in the path: uploads/reference-images/{animationId}/{uuid}.{ext}
    const uuid = crypto.randomUUID()
    const extension = getExtensionFromMimeType(contentType)
    const filename = `${uuid}.${extension}`
    const blobName = `reference-images/${animationId}/${filename}`

    // Upload file to UPLOADS container (private with SAS access)
    const result = await blobCoreService.uploadFile(CONTAINERS.UPLOADS, blobName, buffer, {
      contentType,
      metadata: { animationId, uploadedAt: new Date().toISOString() },
    })

    logger.info({ msg: 'Reference image uploaded', animationId, blobName })

    return { url: result.url, filename }
  }

  /**
   * Delete a reference image from Azure Blob Storage
   * @param url - URL of the reference image to delete
   */
  async deleteReferenceImage(url: string): Promise<void> {
    const blobName = extractBlobNameFromUrl(url, CONTAINERS.UPLOADS)
    if (blobName) {
      await blobCoreService.deleteFile(CONTAINERS.UPLOADS, blobName)
      logger.info({ msg: 'Reference image deleted', blobName })
    }
  }
}

// Export singleton instance
export const blobAssetsService = new BlobAssetsService()
