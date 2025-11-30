// QR Code generation service for animation publication
// Generates QR codes and uploads them to Azure Blob Storage

import QRCode from 'qrcode'
import { blobStorageService, CONTAINERS } from '@/lib/blob-storage'
import { logger } from '@/lib/logger'

/**
 * QR Code generation options
 */
interface QRCodeOptions {
  width?: number
  margin?: number
  color?: {
    dark?: string
    light?: string
  }
}

/**
 * Default QR Code options
 */
const DEFAULT_OPTIONS: QRCodeOptions = {
  width: 512,
  margin: 2,
  color: {
    dark: '#000000',
    light: '#FFFFFF',
  },
}

/**
 * Generate a QR code as a PNG buffer
 *
 * @param url - The URL to encode in the QR code
 * @param options - QR code generation options
 * @returns Promise<Buffer> containing the PNG image
 */
export async function generateQRCode(
  url: string,
  options: QRCodeOptions = {}
): Promise<Buffer> {
  try {
    const mergedOptions = {
      ...DEFAULT_OPTIONS,
      ...options,
      color: {
        ...DEFAULT_OPTIONS.color,
        ...options.color,
      },
    }

    const buffer = await QRCode.toBuffer(url, {
      type: 'png',
      width: mergedOptions.width,
      margin: mergedOptions.margin,
      color: mergedOptions.color,
    })

    logger.info({ url, width: mergedOptions.width }, 'QR code generated successfully')

    return buffer
  } catch (error: any) {
    logger.error({ url, error: error.message }, 'Failed to generate QR code')
    throw new Error(`Failed to generate QR code: ${error.message}`)
  }
}

/**
 * Upload a QR code buffer to Azure Blob Storage
 *
 * @param buffer - The QR code PNG buffer
 * @param slug - The animation slug (used for blob naming)
 * @returns Promise<string> URL of the uploaded blob
 */
export async function uploadQRCodeToBlob(
  buffer: Buffer,
  slug: string
): Promise<string> {
  try {
    const timestamp = Date.now()
    const blobName = `${slug}-${timestamp}.png`

    const result = await blobStorageService.uploadFile(
      CONTAINERS.QRCODES,
      blobName,
      buffer,
      {
        contentType: 'image/png',
        metadata: {
          slug,
          generatedAt: new Date().toISOString(),
        },
      }
    )

    logger.info(
      { blobName, url: result.url },
      'QR code uploaded to blob storage'
    )

    return result.url
  } catch (error: any) {
    logger.error({ slug, error: error.message }, 'Failed to upload QR code to blob storage')
    throw new Error(`Failed to upload QR code: ${error.message}`)
  }
}

/**
 * Generate a QR code and upload it to Azure Blob Storage in one step
 *
 * @param publicUrl - The public URL to encode in the QR code
 * @param slug - The animation slug (used for blob naming)
 * @param options - QR code generation options
 * @returns Promise<string> URL of the uploaded QR code blob
 */
export async function generateAndUploadQRCode(
  publicUrl: string,
  slug: string,
  options: QRCodeOptions = {}
): Promise<string> {
  // Generate QR code
  const buffer = await generateQRCode(publicUrl, options)

  // Upload to blob storage
  const blobUrl = await uploadQRCodeToBlob(buffer, slug)

  logger.info(
    { publicUrl, slug, blobUrl },
    'QR code generated and uploaded successfully'
  )

  return blobUrl
}

/**
 * Generate a signed URL for a QR code blob (for download)
 *
 * @param blobUrl - The QR code blob URL
 * @param expiryMinutes - Expiry time in minutes (default: 60)
 * @returns Promise<string> Signed URL for download
 */
export async function getQRCodeDownloadUrl(
  blobUrl: string,
  expiryMinutes: number = 60
): Promise<string> {
  try {
    // Extract blob name from URL
    const urlParts = new URL(blobUrl)
    const pathParts = urlParts.pathname.split('/')
    const blobName = pathParts.slice(2).join('/') // Skip container name

    const sasUrl = await blobStorageService.generateSasUrl(
      CONTAINERS.QRCODES,
      blobName,
      expiryMinutes
    )

    logger.info({ blobName, expiryMinutes }, 'QR code download URL generated')

    return sasUrl
  } catch (error: any) {
    logger.error({ blobUrl, error: error.message }, 'Failed to generate QR code download URL')
    throw new Error(`Failed to generate download URL: ${error.message}`)
  }
}

/**
 * Build the public animation URL from slug
 *
 * @param slug - The animation slug
 * @returns string Public URL for the animation
 */
export function buildPublicUrl(slug: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://appsbymci.com'
  return `${baseUrl}/a/${slug}`
}
