import { NextRequest, NextResponse } from 'next/server'
import { animationService } from '@/lib/services/animation.service'
import { connectDatabase } from '@/lib/database'
import { logger } from '@/lib/logger'
import { getAuthenticatedUser } from '@/lib/api-helpers'

// API response helpers
function successResponse<T>(data: T) {
  return NextResponse.json({ success: true, data })
}

function errorResponse(code: string, message: string, status: number = 400) {
  return NextResponse.json({ success: false, error: { code, message } }, { status })
}

/**
 * PUT /api/animations/[id]/restore
 * Restore an archived animation
 * Restores to previous status (published if was published, otherwise draft)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const user = getAuthenticatedUser(request)
    if (!user) {
      logger.warn({ path: '/api/animations/[id]/restore', method: 'PUT' }, 'Unauthorized access attempt')
      return errorResponse('AUTH_1001', 'Authentication requise', 401)
    }

    // Get animation ID from route params
    const { id: animationId } = await params

    // Validate animation ID format
    if (!animationId || !/^[a-f0-9]{24}$/i.test(animationId)) {
      return errorResponse('VALIDATION_ERROR', 'ID animation invalide', 400)
    }

    // Connect to database
    await connectDatabase()

    // Restore animation (service handles ownership check, admin bypasses)
    const animation = await animationService.restoreAnimation(animationId, user.userId, user.role)

    // Transform to response format
    const response = animationService.toAnimationResponse(animation)

    logger.info(
      { userId: user.userId, animationId, restoredStatus: animation.status },
      'Animation restored successfully'
    )

    return successResponse(response)
  } catch (error: any) {
    // Handle specific business errors
    if (error.code === 'AUTH_1003') {
      return errorResponse(error.code, error.message, 403)
    }
    if (error.code === 'NOT_FOUND_3001') {
      return errorResponse(error.code, error.message, 404)
    }

    // Log unexpected errors
    logger.error(
      { error: error.message, stack: error.stack },
      'Error restoring animation'
    )
    return errorResponse('INTERNAL_3000', 'Une erreur est survenue lors de la restauration', 500)
  }
}
