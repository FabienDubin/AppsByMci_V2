import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDatabase } from '@/lib/database'
import Animation from '@/models/Animation.model'
import { blobCoreService, CONTAINERS } from '@/lib/services/blob'
import { logger } from '@/lib/logger'
import { getAuthenticatedUser } from '@/lib/api-helpers'

// API response helpers
function errorResponse(code: string, message: string, status: number = 400) {
  return NextResponse.json({ success: false, error: { code, message } }, { status })
}

/**
 * GET /api/animations/[id]/qrcode
 * Download the QR code image with proper Content-Disposition header
 * Requires authentication and ownership (or admin)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const user = getAuthenticatedUser(request)
    if (!user) {
      return errorResponse('AUTH_1001', 'Authentication requise', 401)
    }

    const { id } = await params

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('ANIM_4001', 'ID animation invalide', 400)
    }

    // Connect to database
    await connectDatabase()

    // Find animation
    const animation = await Animation.findById(id)

    if (!animation) {
      return errorResponse('NOT_FOUND_3001', 'Animation non trouvée', 404)
    }

    // Check ownership (or admin)
    const isOwner = animation.userId.toString() === user.userId
    const isAdmin = user.role === 'admin'

    if (!isOwner && !isAdmin) {
      return errorResponse('AUTH_1003', 'Accès non autorisé', 403)
    }

    // Check that animation has a QR code
    if (!animation.qrCodeUrl) {
      return errorResponse('ANIM_4002', 'QR code non disponible', 404)
    }

    // Extract blob name from QR code URL
    // URL format: https://xxx.blob.core.windows.net/qrcodes/slug-timestamp.png
    const urlObj = new URL(animation.qrCodeUrl)
    const pathParts = urlObj.pathname.split('/')
    // Skip first empty part and container name
    const blobName = pathParts.slice(2).join('/')

    // Download the QR code from blob storage
    let imageBuffer: Buffer

    try {
      imageBuffer = await blobCoreService.downloadFile(CONTAINERS.QRCODES, blobName)
    } catch (error: any) {
      logger.error({ animationId: id, blobName, error: error.message }, 'QR code download failed')
      if (error.message?.includes('not found') || error.statusCode === 404) {
        return errorResponse('ANIM_4003', 'QR code non trouvé dans le storage', 404)
      }
      throw error
    }

    // Generate filename
    const filename = `qrcode-${animation.slug}.png`

    logger.info({
      animationId: id,
      animationSlug: animation.slug,
      filename,
    }, 'QR code download requested')

    // Return the image with Content-Disposition header for download
    return new NextResponse(new Uint8Array(imageBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': imageBuffer.length.toString(),
        'Cache-Control': 'private, no-cache',
      },
    })
  } catch (error) {
    logger.error({ error }, 'Error downloading QR code')
    return errorResponse('INTERNAL_3000', 'Une erreur interne est survenue', 500)
  }
}
