// Azure Blob Storage constants and configuration

/**
 * Azure Blob Storage container configuration
 */
export const CONTAINERS = {
  GENERATED_IMAGES: 'generated-images', // AI-generated images (private with SAS access)
  UPLOADS: 'uploads', // Participant selfies (private)
  QRCODES: 'qrcodes', // Animation QR codes (private with SAS access)
  LOGOS: 'logos', // Animation logos (public read)
  BACKGROUNDS: 'backgrounds', // Animation backgrounds (public read)
} as const

/**
 * Allowed MIME types for logo uploads
 */
export const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'] as const

/**
 * Allowed MIME types for background uploads
 */
export const ALLOWED_BACKGROUND_TYPES = ['image/png', 'image/jpeg', 'image/jpg'] as const

/**
 * Maximum file sizes
 */
export const MAX_LOGO_SIZE = 2 * 1024 * 1024 // 2 MB
export const MAX_BACKGROUND_SIZE = 5 * 1024 * 1024 // 5 MB
export const MAX_SELFIE_SIZE = 10 * 1024 * 1024 // 10 MB

/**
 * MIME type to file extension mapping
 */
export const MIME_TO_EXTENSION: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/svg+xml': 'svg',
}
