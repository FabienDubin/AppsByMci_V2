// Azure Blob Storage types

/**
 * File upload options
 */
export interface UploadOptions {
  contentType?: string
  metadata?: Record<string, string>
}

/**
 * File upload result
 */
export interface UploadResult {
  url: string
  blobName: string
}
