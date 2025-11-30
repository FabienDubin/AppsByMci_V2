// Azure Blob Storage Service
// Manages uploads, downloads, and signed URL generation (SAS tokens)

import { logger } from '@/lib/logger'
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  PublicAccessType,
} from "@azure/storage-blob";

/**
 * Azure Blob Storage container configuration
 */
const CONTAINERS = {
  GENERATED_IMAGES: "generated-images", // AI-generated images (private with SAS access)
  UPLOADS: "uploads", // Participant selfies (private)
  QRCODES: "qrcodes", // Animation QR codes (private with SAS access)
  LOGOS: "logos", // Animation logos (public read)
  BACKGROUNDS: "backgrounds", // Animation backgrounds (public read)
} as const;

/**
 * Allowed MIME types for logo uploads
 */
const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'] as const;

/**
 * Allowed MIME types for background uploads
 */
const ALLOWED_BACKGROUND_TYPES = ['image/png', 'image/jpeg', 'image/jpg'] as const;

/**
 * Maximum file sizes
 */
const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2 MB
const MAX_BACKGROUND_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * File upload options
 */
interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
}

/**
 * File upload result
 */
interface UploadResult {
  url: string;
  blobName: string;
}

/**
 * Azure Blob Storage management service
 * Singleton pattern for connection reuse
 */
class BlobStorageService {
  private blobServiceClient: BlobServiceClient | null = null;
  private accountName: string | null = null;
  private accountKey: string | null = null;
  private initialized = false;

  /**
   * Initialize Azure Blob Storage connection
   * Called automatically on first use or explicitly at startup
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.debug({ msg: 'Blob Storage already initialized' });
      return;
    }

    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

    if (!connectionString) {
      logger.warn({
        msg: 'AZURE_STORAGE_CONNECTION_STRING not found - Blob Storage unavailable',
      });
      return;
    }

    try {
      // Parse connection string to extract accountName and accountKey
      const accountNameMatch = connectionString.match(/AccountName=([^;]+)/);
      const accountKeyMatch = connectionString.match(/AccountKey=([^;]+)/);

      if (!accountNameMatch || !accountKeyMatch) {
        throw new Error("Invalid connection string format");
      }

      this.accountName = accountNameMatch[1];
      this.accountKey = accountKeyMatch[1];

      // Create BlobServiceClient
      this.blobServiceClient =
        BlobServiceClient.fromConnectionString(connectionString);

      logger.info({ msg: 'Initializing Blob Storage...', accountName: this.accountName });

      // Connection test (list containers)
      await this.blobServiceClient.listContainers().next();

      this.initialized = true;
      logger.info({ msg: 'Blob Storage initialized successfully' });
    } catch (error) {
      logger.error({ msg: 'Blob Storage connection failed', error });
      throw error;
    }
  }

  /**
   * Create required containers if they don't exist
   * Access levels:
   * - generated-images: private (use SAS URLs for access)
   * - uploads: private (no anonymous access)
   * - qrcodes: private (use SAS URLs for access)
   */
  async ensureContainersExist(): Promise<void> {
    if (!this.initialized || !this.blobServiceClient) {
      await this.initialize();
    }

    if (!this.blobServiceClient) {
      logger.warn({ msg: 'Blob Storage not initialized - skipping container creation' });
      return;
    }

    const containersConfig: Array<{
      name: string;
      accessType?: PublicAccessType;
    }> = [
      { name: CONTAINERS.GENERATED_IMAGES }, // private - use SAS URLs for access
      { name: CONTAINERS.UPLOADS }, // private (no public access)
      { name: CONTAINERS.QRCODES, accessType: 'blob' as PublicAccessType }, // public blob read (QR codes can be public)
      { name: CONTAINERS.LOGOS, accessType: 'blob' as PublicAccessType }, // public blob read
      { name: CONTAINERS.BACKGROUNDS, accessType: 'blob' as PublicAccessType }, // public blob read
    ];

    for (const config of containersConfig) {
      try {
        const containerClient =
          this.blobServiceClient.getContainerClient(config.name);
        const exists = await containerClient.exists();

        if (!exists) {
          await containerClient.create(
            config.accessType ? { access: config.accessType } : undefined
          );
          logger.info({
            msg: 'Container created',
            container: config.name,
            access: config.accessType || 'private',
          });
        } else {
          // Update access level if needed (for existing containers)
          if (config.accessType) {
            try {
              await containerClient.setAccessPolicy(config.accessType);
              logger.info({
                msg: 'Container access level updated',
                container: config.name,
                access: config.accessType,
              });
            } catch (accessError) {
              // Ignore if access level is already set
              logger.debug({
                msg: 'Container access level unchanged or error',
                container: config.name,
                error: accessError,
              });
            }
          }
          logger.debug({ msg: 'Container already exists', container: config.name });
        }
      } catch (error) {
        logger.error({ msg: 'Error creating container', container: config.name, error });
        throw error;
      }
    }

    logger.info({ msg: 'All Blob Storage containers verified' });
  }

  /**
   * Upload a file to Azure Blob Storage container
   * @param containerName - Container name (generated-images, uploads, qrcodes)
   * @param blobName - Blob name (e.g., "selfie-123.jpg")
   * @param buffer - Buffer containing file data
   * @param options - Upload options (contentType, metadata)
   * @returns Blob URL and blob name
   */
  async uploadFile(
    containerName: string,
    blobName: string,
    buffer: Buffer,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    if (!this.initialized || !this.blobServiceClient) {
      await this.initialize();
    }

    if (!this.blobServiceClient) {
      throw new Error("Blob Storage not initialized");
    }

    try {
      const containerClient =
        this.blobServiceClient.getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.uploadData(buffer, {
        blobHTTPHeaders: {
          blobContentType: options.contentType || "application/octet-stream",
        },
        metadata: options.metadata,
      });

      logger.info({ msg: 'File uploaded', container: containerName, blob: blobName });

      return {
        url: blockBlobClient.url,
        blobName,
      };
    } catch (error) {
      logger.error({ msg: 'File upload failed', container: containerName, blob: blobName, error });
      throw error;
    }
  }

  /**
   * Download a file from Azure Blob Storage
   * @param containerName - Container name
   * @param blobName - Blob name
   * @returns Buffer containing file data
   */
  async downloadFile(
    containerName: string,
    blobName: string
  ): Promise<Buffer> {
    if (!this.initialized || !this.blobServiceClient) {
      await this.initialize();
    }

    if (!this.blobServiceClient) {
      throw new Error("Blob Storage not initialized");
    }

    try {
      const containerClient =
        this.blobServiceClient.getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      const downloadResponse = await blockBlobClient.download(0);

      if (!downloadResponse.readableStreamBody) {
        throw new Error("Failed to download blob - no readable stream");
      }

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      for await (const chunk of downloadResponse.readableStreamBody) {
        chunks.push(Buffer.from(chunk));
      }

      logger.info({ msg: 'File downloaded', container: containerName, blob: blobName });

      return Buffer.concat(chunks);
    } catch (error: any) {
      if (error.statusCode === 404) {
        logger.warn({ msg: 'Blob not found', container: containerName, blob: blobName });
        throw new Error(`Blob not found: ${containerName}/${blobName}`);
      }
      logger.error({ msg: 'File download failed', container: containerName, blob: blobName, error });
      throw error;
    }
  }

  /**
   * Generate a signed URL (SAS token) for temporary blob access
   * @param containerName - Container name
   * @param blobName - Blob name
   * @param expiryMinutes - Validity duration in minutes (default: 60 min)
   * @returns Complete URL with SAS token
   */
  async generateSasUrl(
    containerName: string,
    blobName: string,
    expiryMinutes: number = 60
  ): Promise<string> {
    if (!this.initialized || !this.blobServiceClient) {
      await this.initialize();
    }

    if (!this.blobServiceClient || !this.accountName || !this.accountKey) {
      throw new Error("Blob Storage not initialized or credentials missing");
    }

    try {
      const startTime = Date.now();

      // Calculate expiration
      const expiresOn = new Date(Date.now() + expiryMinutes * 60 * 1000);

      // Create credentials
      const sharedKeyCredential = new StorageSharedKeyCredential(
        this.accountName,
        this.accountKey
      );

      // Define permissions (read-only)
      const permissions = BlobSASPermissions.parse("r");

      // Generate SAS token
      const sasToken = generateBlobSASQueryParameters(
        {
          containerName,
          blobName,
          permissions,
          expiresOn,
        },
        sharedKeyCredential
      ).toString();

      // Build complete URL
      const containerClient =
        this.blobServiceClient.getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      const sasUrl = `${blockBlobClient.url}?${sasToken}`;

      const duration = Date.now() - startTime;
      logger.info({
        msg: 'SAS URL generated',
        container: containerName,
        blob: blobName,
        expiryMinutes,
        duration: `${duration}ms`,
      });

      // NFR3 verification: generation < 500ms
      if (duration > 500) {
        logger.warn({
          msg: 'SAS generation exceeded threshold',
          duration: `${duration}ms`,
          threshold: '500ms',
        });
      }

      return sasUrl;
    } catch (error) {
      logger.error({ msg: 'SAS URL generation failed', container: containerName, blob: blobName, error });
      throw error;
    }
  }

  /**
   * Delete a file from a container
   * @param containerName - Container name
   * @param blobName - Blob name
   */
  async deleteFile(containerName: string, blobName: string): Promise<void> {
    if (!this.initialized || !this.blobServiceClient) {
      await this.initialize();
    }

    if (!this.blobServiceClient) {
      throw new Error("Blob Storage not initialized");
    }

    try {
      const containerClient =
        this.blobServiceClient.getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.deleteIfExists();

      logger.info({ msg: 'File deleted', container: containerName, blob: blobName });
    } catch (error) {
      logger.error({ msg: 'File delete failed', container: containerName, blob: blobName, error });
      throw error;
    }
  }

  /**
   * List files in a container
   * @param containerName - Container name
   * @param prefix - Optional prefix to filter blobs
   * @returns Array of blob names
   */
  async listFiles(
    containerName: string,
    prefix?: string
  ): Promise<string[]> {
    if (!this.initialized || !this.blobServiceClient) {
      await this.initialize();
    }

    if (!this.blobServiceClient) {
      throw new Error("Blob Storage not initialized");
    }

    try {
      const containerClient =
        this.blobServiceClient.getContainerClient(containerName);
      const blobNames: string[] = [];

      const listOptions = prefix ? { prefix } : undefined;

      for await (const blob of containerClient.listBlobsFlat(listOptions)) {
        blobNames.push(blob.name);
      }

      logger.debug({
        msg: 'Files listed',
        container: containerName,
        prefix: prefix || null,
        count: blobNames.length,
      });

      return blobNames;
    } catch (error) {
      logger.error({ msg: 'List files failed', container: containerName, error });
      throw error;
    }
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Upload a logo file to Azure Blob Storage
   * @param buffer - Buffer containing file data
   * @param contentType - MIME type of the file
   * @param userId - User ID for organizing files
   * @returns Public URL of the uploaded logo
   */
  async uploadLogo(
    buffer: Buffer,
    contentType: string,
    userId: string
  ): Promise<string> {
    // Validate file size
    if (buffer.length > MAX_LOGO_SIZE) {
      throw new Error(`Le logo ne doit pas dépasser ${MAX_LOGO_SIZE / (1024 * 1024)} MB`);
    }

    // Validate content type
    if (!ALLOWED_LOGO_TYPES.includes(contentType as typeof ALLOWED_LOGO_TYPES[number])) {
      throw new Error(`Format de fichier non supporté. Formats acceptés: ${ALLOWED_LOGO_TYPES.join(', ')}`);
    }

    // Generate unique blob name
    const timestamp = Date.now();
    const uuid = crypto.randomUUID();
    const extension = this.getExtensionFromMimeType(contentType);
    const blobName = `${userId}/${timestamp}-${uuid}.${extension}`;

    // Upload file
    const result = await this.uploadFile(CONTAINERS.LOGOS, blobName, buffer, {
      contentType,
      metadata: { userId, uploadedAt: new Date().toISOString() },
    });

    logger.info({ msg: 'Logo uploaded', userId, blobName });

    // Return public URL (container has public blob access)
    return result.url;
  }

  /**
   * Upload a background image to Azure Blob Storage
   * @param buffer - Buffer containing file data
   * @param contentType - MIME type of the file
   * @param userId - User ID for organizing files
   * @returns Public URL of the uploaded background
   */
  async uploadBackground(
    buffer: Buffer,
    contentType: string,
    userId: string
  ): Promise<string> {
    // Validate file size
    if (buffer.length > MAX_BACKGROUND_SIZE) {
      throw new Error(`L'image de fond ne doit pas dépasser ${MAX_BACKGROUND_SIZE / (1024 * 1024)} MB`);
    }

    // Validate content type
    if (!ALLOWED_BACKGROUND_TYPES.includes(contentType as typeof ALLOWED_BACKGROUND_TYPES[number])) {
      throw new Error(`Format de fichier non supporté. Formats acceptés: ${ALLOWED_BACKGROUND_TYPES.join(', ')}`);
    }

    // Generate unique blob name
    const timestamp = Date.now();
    const uuid = crypto.randomUUID();
    const extension = this.getExtensionFromMimeType(contentType);
    const blobName = `${userId}/${timestamp}-${uuid}.${extension}`;

    // Upload file
    const result = await this.uploadFile(CONTAINERS.BACKGROUNDS, blobName, buffer, {
      contentType,
      metadata: { userId, uploadedAt: new Date().toISOString() },
    });

    logger.info({ msg: 'Background uploaded', userId, blobName });

    // Return public URL (container has public blob access)
    return result.url;
  }

  /**
   * Delete a logo file from Azure Blob Storage
   * @param url - Public URL of the logo to delete
   */
  async deleteLogo(url: string): Promise<void> {
    const blobName = this.extractBlobNameFromUrl(url, CONTAINERS.LOGOS);
    if (blobName) {
      await this.deleteFile(CONTAINERS.LOGOS, blobName);
    }
  }

  /**
   * Delete a background file from Azure Blob Storage
   * @param url - Public URL of the background to delete
   */
  async deleteBackground(url: string): Promise<void> {
    const blobName = this.extractBlobNameFromUrl(url, CONTAINERS.BACKGROUNDS);
    if (blobName) {
      await this.deleteFile(CONTAINERS.BACKGROUNDS, blobName);
    }
  }

  /**
   * Extract blob name from URL
   * @param url - Full URL of the blob
   * @param containerName - Expected container name
   * @returns Blob name or null if URL doesn't match
   */
  private extractBlobNameFromUrl(url: string, containerName: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      // Path format: /containerName/blobName
      if (pathParts[1] === containerName) {
        return pathParts.slice(2).join('/');
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get file extension from MIME type
   * @param mimeType - MIME type string
   * @returns File extension without dot
   */
  private getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/svg+xml': 'svg',
    };
    return mimeToExt[mimeType] || 'bin';
  }
}

// Export singleton instance
export const blobStorageService = new BlobStorageService();

// Export constants for external use
export { CONTAINERS, ALLOWED_LOGO_TYPES, ALLOWED_BACKGROUND_TYPES, MAX_LOGO_SIZE, MAX_BACKGROUND_SIZE };
