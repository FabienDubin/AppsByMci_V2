// Azure Blob Storage Services - Barrel exports

// Core service (initialization, CRUD, SAS)
export { blobCoreService } from './blob-core.service'

// Assets service (logos, backgrounds)
export { blobAssetsService } from './blob-assets.service'

// Results service (selfies, generated images)
export { blobResultsService } from './blob-results.service'

// Constants
export {
  CONTAINERS,
  ALLOWED_LOGO_TYPES,
  ALLOWED_BACKGROUND_TYPES,
  ALLOWED_REFERENCE_IMAGE_TYPES,
  MAX_LOGO_SIZE,
  MAX_BACKGROUND_SIZE,
  MAX_SELFIE_SIZE,
  MAX_REFERENCE_IMAGE_SIZE,
} from './blob.constants'

// Types
export type { UploadOptions, UploadResult } from './blob.types'

// Utils
export { getExtensionFromMimeType, extractBlobNameFromUrl, parseBase64DataUrl } from './blob-utils'
