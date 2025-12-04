// Azure Blob Storage Service - Facade
// Re-exports modular services for backward compatibility
// All functionality is now in lib/services/blob/

import { blobCoreService, blobAssetsService, blobResultsService } from '@/lib/services/blob'

// Re-export constants
export {
  CONTAINERS,
  ALLOWED_LOGO_TYPES,
  ALLOWED_BACKGROUND_TYPES,
  MAX_LOGO_SIZE,
  MAX_BACKGROUND_SIZE,
} from '@/lib/services/blob'

/**
 * Unified Blob Storage Service (facade)
 * Maintains backward compatibility with existing code
 * Delegates to specialized services internally
 */
class BlobStorageService {
  // Core operations
  async initialize() {
    return blobCoreService.initialize()
  }

  async ensureContainersExist() {
    return blobCoreService.ensureContainersExist()
  }

  async uploadFile(
    containerName: string,
    blobName: string,
    buffer: Buffer,
    options: { contentType?: string; metadata?: Record<string, string> } = {}
  ) {
    return blobCoreService.uploadFile(containerName, blobName, buffer, options)
  }

  async downloadFile(containerName: string, blobName: string) {
    return blobCoreService.downloadFile(containerName, blobName)
  }

  async deleteFile(containerName: string, blobName: string) {
    return blobCoreService.deleteFile(containerName, blobName)
  }

  async listFiles(containerName: string, prefix?: string) {
    return blobCoreService.listFiles(containerName, prefix)
  }

  async generateSasUrl(containerName: string, blobName: string, expiryMinutes: number = 60) {
    return blobCoreService.generateSasUrl(containerName, blobName, expiryMinutes)
  }

  isInitialized() {
    return blobCoreService.isInitialized()
  }

  // Asset operations (logos, backgrounds)
  async uploadLogo(buffer: Buffer, contentType: string, userId: string) {
    return blobAssetsService.uploadLogo(buffer, contentType, userId)
  }

  async uploadBackground(buffer: Buffer, contentType: string, userId: string) {
    return blobAssetsService.uploadBackground(buffer, contentType, userId)
  }

  async deleteLogo(url: string) {
    return blobAssetsService.deleteLogo(url)
  }

  async deleteBackground(url: string) {
    return blobAssetsService.deleteBackground(url)
  }

  // Result operations (selfies, generated images)
  async uploadSelfie(base64Data: string, generationId: string) {
    return blobResultsService.uploadSelfie(base64Data, generationId)
  }

  async uploadResult(imageBuffer: Buffer, generationId: string) {
    return blobResultsService.uploadResult(imageBuffer, generationId)
  }

  async getResultSasUrl(generationId: string, expiryMinutes: number = 60) {
    return blobResultsService.getResultSasUrl(generationId, expiryMinutes)
  }
}

// Export singleton instance (backward compatible)
export const blobStorageService = new BlobStorageService()
