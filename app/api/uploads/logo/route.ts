import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth'
import { blobStorageService, MAX_LOGO_SIZE, ALLOWED_LOGO_TYPES } from '@/lib/blob-storage'
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
 * POST /api/uploads/logo
 * Upload a logo file to Azure Blob Storage
 * Requires authentication
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

    if (!file) {
      return errorResponse('VALIDATION_ERROR', 'Aucun fichier fourni', 400)
    }

    // Validate file size
    if (file.size > MAX_LOGO_SIZE) {
      return errorResponse('FILE_TOO_LARGE', `Le logo ne doit pas dépasser ${MAX_LOGO_SIZE / (1024 * 1024)} MB`, 400)
    }

    // Validate file type
    if (!ALLOWED_LOGO_TYPES.includes(file.type as typeof ALLOWED_LOGO_TYPES[number])) {
      return errorResponse(
        'INVALID_FILE_TYPE',
        `Format de fichier non supporté. Formats acceptés: ${ALLOWED_LOGO_TYPES.join(', ')}`,
        400
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Ensure containers exist before upload
    await blobStorageService.ensureContainersExist()

    // Upload to Azure Blob Storage
    const url = await blobStorageService.uploadLogo(buffer, file.type, auth.userId)

    logger.info({ msg: 'Logo uploaded via API', userId: auth.userId, size: file.size, type: file.type })

    return successResponse({ url })
  } catch (error: any) {
    logger.error({
      err: error instanceof Error ? { message: error.message, stack: error.stack, name: error.name } : error,
    }, 'Error uploading logo')

    // Check if it's a blob storage initialization error
    if (error.message?.includes('Blob Storage not initialized')) {
      return errorResponse(
        'STORAGE_NOT_CONFIGURED',
        'Le stockage de fichiers n\'est pas disponible. Vérifiez la configuration Azure.',
        503
      )
    }

    // Check if container doesn't exist (Azure error)
    if (error.code === 'ContainerNotFound' || error.message?.includes('ContainerNotFound')) {
      return errorResponse(
        'STORAGE_ERROR',
        'Le conteneur de stockage n\'existe pas. Contactez l\'administrateur.',
        503
      )
    }

    // Check if it's a known validation error from blob service
    if (error.message?.includes('ne doit pas dépasser') || error.message?.includes('Format de fichier')) {
      return errorResponse('VALIDATION_ERROR', error.message, 400)
    }

    return errorResponse('INTERNAL_ERROR', 'Erreur lors de l\'upload du logo', 500)
  }
}

/**
 * DELETE /api/uploads/logo
 * Delete a logo file from Azure Blob Storage
 * Requires authentication
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const auth = extractAuthToken(request)
    if (!auth) {
      return errorResponse('AUTH_REQUIRED', 'Authentification requise', 401)
    }

    // Get URL from query or body
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return errorResponse('VALIDATION_ERROR', 'URL du logo requise', 400)
    }

    // Delete from Azure Blob Storage
    await blobStorageService.deleteLogo(url)

    logger.info({ msg: 'Logo deleted via API', userId: auth.userId, url })

    return successResponse({ deleted: true })
  } catch (error: any) {
    logger.error({
      err: error instanceof Error ? { message: error.message, stack: error.stack, name: error.name } : error,
    }, 'Error deleting logo')

    return errorResponse('INTERNAL_ERROR', 'Erreur lors de la suppression du logo', 500)
  }
}
