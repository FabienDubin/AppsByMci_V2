import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth'
import { blobStorageService } from '@/lib/blob-storage'
import {
  blobAssetsService,
  MAX_REFERENCE_IMAGE_SIZE,
  ALLOWED_REFERENCE_IMAGE_TYPES,
} from '@/lib/services/blob'
import { logger } from '@/lib/logger'

// API response helpers
function successResponse<T>(data: T) {
  return NextResponse.json({ success: true, data })
}

function errorResponse(code: string, message: string, status: number = 400) {
  return NextResponse.json({ success: false, error: { code, message } }, { status })
}

// Extract and verify auth token from request
function extractAuthToken(request: NextRequest): { userId: string; email: string; role: string } | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  try {
    const token = authHeader.split(' ')[1]
    return verifyAccessToken(token)
  } catch {
    return null
  }
}

/**
 * POST /api/uploads/reference-image
 * Upload a reference image for AI generation block (Story 4.8)
 * Requires authentication
 *
 * FormData:
 *   - file: File (PNG, JPEG, WebP, max 10MB)
 *   - animationId: string
 *
 * Response:
 *   - url: string (Azure Blob URL)
 *   - filename: string
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const auth = extractAuthToken(request)
    if (!auth) {
      return errorResponse('AUTH_REQUIRED', 'Authentification requise', 401)
    }

    // Check if blob storage is available
    if (!blobStorageService.isInitialized() && !process.env.AZURE_STORAGE_CONNECTION_STRING) {
      logger.warn({ msg: 'Azure Blob Storage not configured - uploads disabled' })
      return errorResponse(
        'STORAGE_NOT_CONFIGURED',
        'Le stockage de fichiers n\'est pas configuré. Contactez l\'administrateur ou configurez AZURE_STORAGE_CONNECTION_STRING.',
        503
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const animationId = formData.get('animationId') as string | null

    if (!file) {
      return errorResponse('VALIDATION_ERROR', 'Aucun fichier fourni', 400)
    }

    if (!animationId) {
      return errorResponse('VALIDATION_ERROR', 'animationId est requis', 400)
    }

    // Validate file size
    if (file.size > MAX_REFERENCE_IMAGE_SIZE) {
      return errorResponse(
        'FILE_TOO_LARGE',
        `L'image de référence ne doit pas dépasser ${MAX_REFERENCE_IMAGE_SIZE / (1024 * 1024)} MB`,
        400
      )
    }

    // Validate file type
    if (!ALLOWED_REFERENCE_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_REFERENCE_IMAGE_TYPES)[number])) {
      return errorResponse(
        'INVALID_FILE_TYPE',
        'Format de fichier non supporté. Formats acceptés: PNG, JPEG, WebP',
        400
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Ensure containers exist before upload
    await blobStorageService.ensureContainersExist()

    // Upload to Azure Blob Storage
    const result = await blobAssetsService.uploadReferenceImage(buffer, file.type, animationId)

    logger.info({
      msg: 'Reference image uploaded via API',
      userId: auth.userId,
      animationId,
      size: file.size,
      type: file.type,
      filename: result.filename,
    })

    return successResponse({ url: result.url, filename: result.filename })
  } catch (error: unknown) {
    const err = error as Error
    logger.error(
      {
        err: { message: err.message, stack: err.stack, name: err.name },
      },
      'Error uploading reference image'
    )

    // Check if it's a blob storage initialization error
    if (err.message?.includes('Blob Storage not initialized')) {
      return errorResponse(
        'STORAGE_NOT_CONFIGURED',
        'Le stockage de fichiers n\'est pas disponible. Vérifiez la configuration Azure.',
        503
      )
    }

    // Check if container doesn't exist (Azure error)
    if ((error as { code?: string }).code === 'ContainerNotFound' || err.message?.includes('ContainerNotFound')) {
      return errorResponse(
        'STORAGE_ERROR',
        'Le conteneur de stockage n\'existe pas. Contactez l\'administrateur.',
        503
      )
    }

    // Check if it's a known validation error from blob service
    if (err.message?.includes('ne doit pas dépasser') || err.message?.includes('Format de fichier')) {
      return errorResponse('VALIDATION_ERROR', err.message, 400)
    }

    return errorResponse('INTERNAL_ERROR', 'Erreur lors de l\'upload de l\'image de référence', 500)
  }
}

/**
 * DELETE /api/uploads/reference-image
 * Delete a reference image from Azure Blob Storage
 * Requires authentication
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const auth = extractAuthToken(request)
    if (!auth) {
      return errorResponse('AUTH_REQUIRED', 'Authentification requise', 401)
    }

    // Get URL from query
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return errorResponse('VALIDATION_ERROR', 'URL de l\'image requise', 400)
    }

    // Delete from Azure Blob Storage
    await blobAssetsService.deleteReferenceImage(url)

    logger.info({ msg: 'Reference image deleted via API', userId: auth.userId, url })

    return successResponse({ deleted: true })
  } catch (error: unknown) {
    const err = error as Error
    logger.error(
      {
        err: { message: err.message, stack: err.stack, name: err.name },
      },
      'Error deleting reference image'
    )

    return errorResponse('INTERNAL_ERROR', 'Erreur lors de la suppression de l\'image de référence', 500)
  }
}
