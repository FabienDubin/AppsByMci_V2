import { NextRequest, NextResponse } from 'next/server'
import { connectDatabase } from '@/lib/database'
import { logger } from '@/lib/logger'
import { getAuthenticatedUser } from '@/lib/api-helpers'
import { animationService } from '@/lib/services/animation.service'
import { generationService } from '@/lib/services/generation.service'

// API response helpers
function successResponse<T>(data: T) {
  return NextResponse.json({ success: true, data })
}

function errorResponse(code: string, message: string, status: number = 400) {
  return NextResponse.json({ success: false, error: { code, message } }, { status })
}

/**
 * GET /api/animations/[id]/stats
 * Get detailed statistics for an animation (Story 5.2 AC3)
 * Returns: totalParticipations, successfulGenerations, failedGenerations,
 * successRate, averageGenerationTime, emailsSent
 * Requires authentication and ownership (or admin role)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const user = getAuthenticatedUser(request)
    if (!user) {
      logger.warn({ path: '/api/animations/[id]/stats', method: 'GET' }, 'Unauthorized access attempt')
      return errorResponse('AUTH_1001', 'Authentication requise', 401)
    }

    // Get animation ID from route params
    const { id: animationId } = await params

    // Connect to database
    await connectDatabase()

    // Verify animation exists and user has access (ownership check or admin)
    try {
      await animationService.getAnimationById(animationId, user.userId, user.role)
    } catch (error: any) {
      if (error.code === 'NOT_FOUND_3001') {
        return errorResponse(error.code, error.message, 404)
      }
      if (error.code === 'AUTH_1003') {
        return errorResponse(error.code, error.message, 403)
      }
      throw error
    }

    // Get detailed stats
    const stats = await generationService.getAnimationDetailStats(animationId)

    logger.info(
      { userId: user.userId, animationId, totalParticipations: stats.totalParticipations },
      'Animation stats retrieved successfully'
    )

    return successResponse(stats)
  } catch (error: any) {
    logger.error(
      { error: error.message, stack: error.stack },
      'Error retrieving animation stats'
    )
    return errorResponse('INTERNAL_3000', 'Une erreur est survenue', 500)
  }
}
