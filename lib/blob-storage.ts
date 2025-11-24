// Azure Blob Storage Service
// Manages uploads, downloads, and signed URL generation (SAS tokens)

import {
  BlobServiceClient,
  ContainerClient,
  BlockBlobClient,
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
} as const;

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
      console.log("[Blob Storage] Already initialized");
      return;
    }

    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

    if (!connectionString) {
      console.warn(
        "[Blob Storage] AZURE_STORAGE_CONNECTION_STRING not found - Blob Storage unavailable"
      );
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

      console.log(
        `[Blob Storage] Connecting to account: ${this.accountName}...`
      );

      // Connection test (list containers)
      await this.blobServiceClient.listContainers().next();

      this.initialized = true;
      console.log("[Blob Storage] Connected successfully");
    } catch (error) {
      console.error("[Blob Storage] Connection failed:", error);
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
      console.warn(
        "[Blob Storage] Not initialized - skipping container creation"
      );
      return;
    }

    const containersConfig: Array<{
      name: string;
      accessType?: PublicAccessType;
    }> = [
      { name: CONTAINERS.GENERATED_IMAGES }, // private - use SAS URLs for access
      { name: CONTAINERS.UPLOADS }, // private (no public access)
      { name: CONTAINERS.QRCODES }, // private - use SAS URLs for access
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
          console.log(
            `[Blob Storage] Container created: ${config.name} (access: ${config.accessType || "private"})`
          );
        } else {
          console.log(
            `[Blob Storage] Container already exists: ${config.name}`
          );
        }
      } catch (error) {
        console.error(
          `[Blob Storage] Error creating container ${config.name}:`,
          error
        );
        throw error;
      }
    }

    console.log("[Blob Storage] All containers verified");
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

      console.log(
        `[Blob Storage] File uploaded: ${containerName}/${blobName}`
      );

      return {
        url: blockBlobClient.url,
        blobName,
      };
    } catch (error) {
      console.error(`[Blob Storage] Upload failed:`, error);
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

      console.log(
        `[Blob Storage] File downloaded: ${containerName}/${blobName}`
      );

      return Buffer.concat(chunks);
    } catch (error: any) {
      if (error.statusCode === 404) {
        console.error(
          `[Blob Storage] Blob not found: ${containerName}/${blobName}`
        );
        throw new Error(`Blob not found: ${containerName}/${blobName}`);
      }
      console.error(`[Blob Storage] Download failed:`, error);
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
      console.log(
        `[Blob Storage] SAS URL generated for ${containerName}/${blobName} (expires in ${expiryMinutes} min, took ${duration}ms)`
      );

      // NFR3 verification: generation < 500ms
      if (duration > 500) {
        console.warn(
          `[Blob Storage] SAS generation took ${duration}ms (> 500ms threshold)`
        );
      }

      return sasUrl;
    } catch (error) {
      console.error(`[Blob Storage] SAS URL generation failed:`, error);
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

      console.log(
        `[Blob Storage] File deleted: ${containerName}/${blobName}`
      );
    } catch (error) {
      console.error(`[Blob Storage] Delete failed:`, error);
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

      console.log(
        `[Blob Storage] Listed ${blobNames.length} files in ${containerName}${prefix ? ` (prefix: ${prefix})` : ""}`
      );

      return blobNames;
    } catch (error) {
      console.error(`[Blob Storage] List files failed:`, error);
      throw error;
    }
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const blobStorageService = new BlobStorageService();

// Export constants for external use
export { CONTAINERS };
