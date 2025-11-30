import { NextRequest, NextResponse } from 'next/server'
import { animationService } from '@/lib/services/animation.service'
import { connectDatabase } from '@/lib/database'
import { logger } from '@/lib/logger'
import { getAuthenticatedUser } from '@/lib/api-helpers'
import { buildPublicUrl } from '@/lib/services/qrcode.service'

// API response helpers
function successResponse<T>(data: T) {
  return NextResponse.json({ success: true, data })
}

function errorResponse(code: string, message: string, status: number = 400) {
  return NextResponse.json({ success: false, error: { code, message } }, { status })
}

/**
 * POST /api/animations/[id]/publish
 * Publish an existing draft animation
 * - Validates slug uniqueness
 * - Sets status to 'published'
 * - Sets publishedAt timestamp
 * - Generates QR code and uploads to Azure Blob
 * - Returns animation with publicUrl and qrCodeUrl
 *
 * Requires authentication
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const user = getAuthenticatedUser(request)
    if (!user) {
      logger.warn({ path: '/api/animations/[id]/publish', method: 'POST' }, 'Unauthorized access attempt')
      return errorResponse('AUTH_1001', 'Authentication requise', 401)
    }

    const { id: animationId } = await params

    // Validate animation ID format
    if (!animationId || !/^[a-f0-9]{24}$/i.test(animationId)) {
      return errorResponse('VALIDATION_ERROR', 'ID animation invalide', 400)
    }

    // Connect to database
    await connectDatabase()

    // Publish the animation (validates ownership, slug uniqueness, generates QR)
    const animation = await animationService.publishAnimation(animationId, user.userId)

    // Transform to response format
    const response = animationService.toAnimationResponse(animation)

    // Add public URL to response
    const publicUrl = buildPublicUrl(animation.slug)

    logger.info(
      {
        userId: user.userId,
        animationId,
        slug: animation.slug,
        publicUrl,
        qrCodeUrl: animation.qrCodeUrl,
      },
      'Animation published successfully'
    )

    return successResponse({
      ...response,
      publicUrl,
    })
  } catch (error: any) {
    // Handle specific business errors
    if (error.code === 'VALIDATION_2002') {
      // Slug already exists
      return errorResponse(error.code, 'Ce slug est déjà utilisé par une autre animation', 409)
    }

    if (error.code === 'NOT_FOUND_3001') {
      return errorResponse(error.code, error.message, 404)
    }

    if (error.code === 'AUTH_1003') {
      return errorResponse(error.code, error.message, 403)
    }

    // Log unexpected errors
    logger.error({ error: error.message, stack: error.stack }, 'Error publishing animation')
    return errorResponse('INTERNAL_3000', 'Une erreur est survenue lors de la publication', 500)
  }
}
