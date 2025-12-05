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

// Valid period values
const VALID_PERIODS = ['7d', '30d', 'all'] as const
type Period = (typeof VALID_PERIODS)[number]

/**
 * GET /api/animations/[id]/timeline
 * Get timeline data for animation participations chart (Story 5.2 AC4)
 * Query params: period=7d|30d|all (default: 30d)
 * Returns: { period, data: TimelineDataPoint[] }
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
      logger.warn({ path: '/api/animations/[id]/timeline', method: 'GET' }, 'Unauthorized access attempt')
      return errorResponse('AUTH_1001', 'Authentication requise', 401)
    }

    // Get animation ID from route params
    const { id: animationId } = await params

    // Get period from query params (default: 30d)
    const searchParams = request.nextUrl.searchParams
    const periodParam = searchParams.get('period') || '30d'

    // Validate period
    if (!VALID_PERIODS.includes(periodParam as Period)) {
      return errorResponse('VALIDATION_ERROR', 'Période invalide. Valeurs acceptées: 7d, 30d, all', 400)
    }

    const period = periodParam as Period

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

    // Get timeline data
    const timeline = await generationService.getAnimationTimeline(animationId, period)

    logger.info(
      { userId: user.userId, animationId, period, dataPoints: timeline.data.length },
      'Animation timeline retrieved successfully'
    )

    return successResponse(timeline)
  } catch (error: any) {
    logger.error(
      { error: error.message, stack: error.stack },
      'Error retrieving animation timeline'
    )
    return errorResponse('INTERNAL_3000', 'Une erreur est survenue', 500)
  }
}
