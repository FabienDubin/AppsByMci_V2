// Azure Blob Storage Core Service
// Handles initialization, connection, and base CRUD operations

import { logger } from '@/lib/logger'
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  PublicAccessType,
} from '@azure/storage-blob'
import { CONTAINERS } from './blob.constants'
import type { UploadOptions, UploadResult } from './blob.types'

/**
 * Core Azure Blob Storage service
 * Handles initialization and base operations (upload, download, delete, list)
 */
class BlobCoreService {
  private blobServiceClient: BlobServiceClient | null = null
  private accountName: string | null = null
  private accountKey: string | null = null
  private initialized = false

  /**
   * Initialize Azure Blob Storage connection
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.debug({ msg: 'Blob Storage already initialized' })
      return
    }

    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING

    if (!connectionString) {
      logger.warn({
        msg: 'AZURE_STORAGE_CONNECTION_STRING not found - Blob Storage unavailable',
      })
      return
    }

    try {
      // Parse connection string to extract accountName and accountKey
      const accountNameMatch = connectionString.match(/AccountName=([^;]+)/)
      const accountKeyMatch = connectionString.match(/AccountKey=([^;]+)/)

      if (!accountNameMatch || !accountKeyMatch) {
        throw new Error('Invalid connection string format')
      }

      this.accountName = accountNameMatch[1]
      this.accountKey = accountKeyMatch[1]

      // Create BlobServiceClient
      this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)

      logger.info({ msg: 'Initializing Blob Storage...', accountName: this.accountName })

      // Connection test (list containers)
      await this.blobServiceClient.listContainers().next()

      this.initialized = true
      logger.info({ msg: 'Blob Storage initialized successfully' })
    } catch (error) {
      logger.error({ msg: 'Blob Storage connection failed', error })
      throw error
    }
  }

  /**
   * Create required containers if they don't exist
   */
  async ensureContainersExist(): Promise<void> {
    if (!this.initialized || !this.blobServiceClient) {
      await this.initialize()
    }

    if (!this.blobServiceClient) {
      logger.warn({ msg: 'Blob Storage not initialized - skipping container creation' })
      return
    }

    const containersConfig: Array<{
      name: string
      accessType?: PublicAccessType
    }> = [
      { name: CONTAINERS.GENERATED_IMAGES }, // private - use SAS URLs for access
      { name: CONTAINERS.UPLOADS }, // private (no public access)
      { name: CONTAINERS.QRCODES, accessType: 'blob' as PublicAccessType }, // public blob read
      { name: CONTAINERS.LOGOS, accessType: 'blob' as PublicAccessType }, // public blob read
      { name: CONTAINERS.BACKGROUNDS, accessType: 'blob' as PublicAccessType }, // public blob read
    ]

    for (const config of containersConfig) {
      try {
        const containerClient = this.blobServiceClient.getContainerClient(config.name)
        const exists = await containerClient.exists()

        if (!exists) {
          await containerClient.create(config.accessType ? { access: config.accessType } : undefined)
          logger.info({
            msg: 'Container created',
            container: config.name,
            access: config.accessType || 'private',
          })
        } else {
          // Update access level if needed (for existing containers)
          if (config.accessType) {
            try {
              await containerClient.setAccessPolicy(config.accessType)
              logger.info({
                msg: 'Container access level updated',
                container: config.name,
                access: config.accessType,
              })
            } catch (accessError) {
              // Ignore if access level is already set
              logger.debug({
                msg: 'Container access level unchanged or error',
                container: config.name,
                error: accessError,
              })
            }
          }
          logger.debug({ msg: 'Container already exists', container: config.name })
        }
      } catch (error) {
        logger.error({ msg: 'Error creating container', container: config.name, error })
        throw error
      }
    }

    logger.info({ msg: 'All Blob Storage containers verified' })
  }

  /**
   * Upload a file to Azure Blob Storage container
   */
  async uploadFile(
    containerName: string,
    blobName: string,
    buffer: Buffer,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    if (!this.initialized || !this.blobServiceClient) {
      await this.initialize()
    }

    if (!this.blobServiceClient) {
      throw new Error('Blob Storage not initialized')
    }

    try {
      const containerClient = this.blobServiceClient.getContainerClient(containerName)
      const blockBlobClient = containerClient.getBlockBlobClient(blobName)

      await blockBlobClient.uploadData(buffer, {
        blobHTTPHeaders: {
          blobContentType: options.contentType || 'application/octet-stream',
        },
        metadata: options.metadata,
      })

      logger.info({ msg: 'File uploaded', container: containerName, blob: blobName })

      return {
        url: blockBlobClient.url,
        blobName,
      }
    } catch (error) {
      logger.error({ msg: 'File upload failed', container: containerName, blob: blobName, error })
      throw error
    }
  }

  /**
   * Download a file from Azure Blob Storage
   */
  async downloadFile(containerName: string, blobName: string): Promise<Buffer> {
    if (!this.initialized || !this.blobServiceClient) {
      await this.initialize()
    }

    if (!this.blobServiceClient) {
      throw new Error('Blob Storage not initialized')
    }

    try {
      const containerClient = this.blobServiceClient.getContainerClient(containerName)
      const blockBlobClient = containerClient.getBlockBlobClient(blobName)

      const downloadResponse = await blockBlobClient.download(0)

      if (!downloadResponse.readableStreamBody) {
        throw new Error('Failed to download blob - no readable stream')
      }

      // Convert stream to buffer
      const chunks: Buffer[] = []
      for await (const chunk of downloadResponse.readableStreamBody) {
        chunks.push(Buffer.from(chunk))
      }

      logger.info({ msg: 'File downloaded', container: containerName, blob: blobName })

      return Buffer.concat(chunks)
    } catch (error: any) {
      if (error.statusCode === 404) {
        logger.warn({ msg: 'Blob not found', container: containerName, blob: blobName })
        throw new Error(`Blob not found: ${containerName}/${blobName}`)
      }
      logger.error({ msg: 'File download failed', container: containerName, blob: blobName, error })
      throw error
    }
  }

  /**
   * Delete a file from a container
   */
  async deleteFile(containerName: string, blobName: string): Promise<void> {
    if (!this.initialized || !this.blobServiceClient) {
      await this.initialize()
    }

    if (!this.blobServiceClient) {
      throw new Error('Blob Storage not initialized')
    }

    try {
      const containerClient = this.blobServiceClient.getContainerClient(containerName)
      const blockBlobClient = containerClient.getBlockBlobClient(blobName)

      await blockBlobClient.deleteIfExists()

      logger.info({ msg: 'File deleted', container: containerName, blob: blobName })
    } catch (error) {
      logger.error({ msg: 'File delete failed', container: containerName, blob: blobName, error })
      throw error
    }
  }

  /**
   * List files in a container
   */
  async listFiles(containerName: string, prefix?: string): Promise<string[]> {
    if (!this.initialized || !this.blobServiceClient) {
      await this.initialize()
    }

    if (!this.blobServiceClient) {
      throw new Error('Blob Storage not initialized')
    }

    try {
      const containerClient = this.blobServiceClient.getContainerClient(containerName)
      const blobNames: string[] = []

      const listOptions = prefix ? { prefix } : undefined

      for await (const blob of containerClient.listBlobsFlat(listOptions)) {
        blobNames.push(blob.name)
      }

      logger.debug({
        msg: 'Files listed',
        container: containerName,
        prefix: prefix || null,
        count: blobNames.length,
      })

      return blobNames
    } catch (error) {
      logger.error({ msg: 'List files failed', container: containerName, error })
      throw error
    }
  }

  /**
   * Generate a signed URL (SAS token) for temporary blob access
   */
  async generateSasUrl(containerName: string, blobName: string, expiryMinutes: number = 60): Promise<string> {
    if (!this.initialized || !this.blobServiceClient) {
      await this.initialize()
    }

    if (!this.blobServiceClient || !this.accountName || !this.accountKey) {
      throw new Error('Blob Storage not initialized or credentials missing')
    }

    try {
      const startTime = Date.now()

      // Calculate expiration
      const expiresOn = new Date(Date.now() + expiryMinutes * 60 * 1000)

      // Create credentials
      const sharedKeyCredential = new StorageSharedKeyCredential(this.accountName, this.accountKey)

      // Define permissions (read-only)
      const permissions = BlobSASPermissions.parse('r')

      // Generate SAS token
      const sasToken = generateBlobSASQueryParameters(
        {
          containerName,
          blobName,
          permissions,
          expiresOn,
        },
        sharedKeyCredential
      ).toString()

      // Build complete URL
      const containerClient = this.blobServiceClient.getContainerClient(containerName)
      const blockBlobClient = containerClient.getBlockBlobClient(blobName)
      const sasUrl = `${blockBlobClient.url}?${sasToken}`

      const duration = Date.now() - startTime
      logger.info({
        msg: 'SAS URL generated',
        container: containerName,
        blob: blobName,
        expiryMinutes,
        duration: `${duration}ms`,
      })

      // NFR3 verification: generation < 500ms
      if (duration > 500) {
        logger.warn({
          msg: 'SAS generation exceeded threshold',
          duration: `${duration}ms`,
          threshold: '500ms',
        })
      }

      return sasUrl
    } catch (error) {
      logger.error({ msg: 'SAS URL generation failed', container: containerName, blob: blobName, error })
      throw error
    }
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized
  }
}

// Export singleton instance
export const blobCoreService = new BlobCoreService()
