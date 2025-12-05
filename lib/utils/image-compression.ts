/**
 * Image compression utilities for email backgrounds
 * Uses sharp to optimize images for email delivery
 */

import sharp from 'sharp'

// Compression settings for email images
const EMAIL_IMAGE_CONFIG = {
  maxWidth: 1200, // Max width in pixels (emails are typically 600px, 2x for retina)
  maxHeight: 1600, // Max height in pixels
  jpegQuality: 85, // JPEG quality (85% is visually lossless)
  pngCompressionLevel: 9, // PNG compression level (0-9)
  maxOutputSize: 300 * 1024, // Target max size: 300KB
}

export interface CompressionResult {
  buffer: Buffer
  mimeType: string
  originalSize: number
  compressedSize: number
  compressionRatio: number
}

/**
 * Compress an image for email use
 * - Resizes if larger than max dimensions
 * - Converts to optimized JPEG (or PNG if has transparency)
 * - Targets reasonable file size for email delivery
 *
 * @param inputBuffer - Original image buffer
 * @param mimeType - Original MIME type
 * @returns Compressed image buffer and metadata
 */
export async function compressImageForEmail(
  inputBuffer: Buffer,
  _mimeType: string
): Promise<CompressionResult> {
  const originalSize = inputBuffer.length

  // Get image metadata
  const metadata = await sharp(inputBuffer).metadata()
  const hasAlpha = metadata.hasAlpha ?? false
  const width = metadata.width ?? 0
  const height = metadata.height ?? 0

  // Determine output format based on transparency
  const outputFormat = hasAlpha ? 'png' : 'jpeg'
  const outputMimeType = hasAlpha ? 'image/png' : 'image/jpeg'

  // Start with sharp instance
  let sharpInstance = sharp(inputBuffer)

  // Resize if needed (maintain aspect ratio)
  if (width > EMAIL_IMAGE_CONFIG.maxWidth || height > EMAIL_IMAGE_CONFIG.maxHeight) {
    sharpInstance = sharpInstance.resize(EMAIL_IMAGE_CONFIG.maxWidth, EMAIL_IMAGE_CONFIG.maxHeight, {
      fit: 'inside', // Maintain aspect ratio, fit within bounds
      withoutEnlargement: true, // Don't upscale small images
    })
  }

  // Apply format-specific compression
  let outputBuffer: Buffer
  if (outputFormat === 'jpeg') {
    outputBuffer = await sharpInstance
      .jpeg({
        quality: EMAIL_IMAGE_CONFIG.jpegQuality,
        mozjpeg: true, // Use mozjpeg for better compression
      })
      .toBuffer()
  } else {
    outputBuffer = await sharpInstance
      .png({
        compressionLevel: EMAIL_IMAGE_CONFIG.pngCompressionLevel,
        palette: true, // Use palette-based PNG when possible
      })
      .toBuffer()
  }

  // If still too large for JPEG, try lower quality
  if (outputFormat === 'jpeg' && outputBuffer.length > EMAIL_IMAGE_CONFIG.maxOutputSize) {
    // Try progressively lower quality
    for (const quality of [75, 65, 55]) {
      outputBuffer = await sharp(inputBuffer)
        .resize(EMAIL_IMAGE_CONFIG.maxWidth, EMAIL_IMAGE_CONFIG.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({
          quality,
          mozjpeg: true,
        })
        .toBuffer()

      if (outputBuffer.length <= EMAIL_IMAGE_CONFIG.maxOutputSize) {
        break
      }
    }
  }

  const compressedSize = outputBuffer.length
  const compressionRatio = originalSize > 0 ? (1 - compressedSize / originalSize) * 100 : 0

  return {
    buffer: outputBuffer,
    mimeType: outputMimeType,
    originalSize,
    compressedSize,
    compressionRatio,
  }
}

/**
 * Check if an image needs compression
 * @param size - File size in bytes
 * @returns true if compression is recommended
 */
export function shouldCompressImage(size: number): boolean {
  // Compress if larger than 200KB
  return size > 200 * 1024
}
