// Azure Blob Storage utility functions

import { MIME_TO_EXTENSION } from './blob.constants'

/**
 * Get file extension from MIME type
 * @param mimeType - MIME type string
 * @returns File extension without dot
 */
export function getExtensionFromMimeType(mimeType: string): string {
  return MIME_TO_EXTENSION[mimeType] || 'bin'
}

/**
 * Extract blob name from URL
 * @param url - Full URL of the blob
 * @param containerName - Expected container name
 * @returns Blob name or null if URL doesn't match
 */
export function extractBlobNameFromUrl(url: string, containerName: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    // Path format: /containerName/blobName
    if (pathParts[1] === containerName) {
      return pathParts.slice(2).join('/')
    }
    return null
  } catch {
    return null
  }
}

/**
 * Parse base64 data URL to extract content type and raw base64
 * @param base64Data - Base64 encoded data (with or without data URL prefix)
 * @returns Object with contentType and base64Content
 */
export function parseBase64DataUrl(base64Data: string): {
  contentType: string
  base64Content: string
} {
  let contentType = 'image/jpeg'
  let base64Content = base64Data

  // Handle data URL format: data:image/jpeg;base64,/9j/4AAQ...
  if (base64Data.startsWith('data:')) {
    const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/)
    if (matches) {
      contentType = matches[1]
      base64Content = matches[2]
    }
  }

  return { contentType, base64Content }
}
