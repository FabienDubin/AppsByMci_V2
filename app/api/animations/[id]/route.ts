import { NextRequest, NextResponse } from 'next/server'
import { updateAnimationSchema } from '@/lib/schemas/animation.schema'
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
 * GET /api/animations/[id]
 * Get a single animation by ID
 * Requires authentication and ownership
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const user = getAuthenticatedUser(request)
    if (!user) {
      logger.warn({ path: '/api/animations/[id]', method: 'GET' }, 'Unauthorized access attempt')
      return errorResponse('AUTH_1001', 'Authentication requise', 401)
    }

    // Get animation ID from route params
    const { id: animationId } = await params

    // Connect to database
    await connectDatabase()

    // Get animation (service handles ownership check)
    const animation = await animationService.getAnimationById(animationId, user.userId)

    // Transform to response format
    const response = animationService.toAnimationResponse(animation)

    logger.info(
      { userId: user.userId, animationId },
      'Animation retrieved successfully'
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
      'Error retrieving animation'
    )
    return errorResponse('INTERNAL_3000', 'Une erreur est survenue', 500)
  }
}

/**
 * PUT /api/animations/[id]
 * Update an existing animation
 * Requires authentication and ownership
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const user = getAuthenticatedUser(request)
    if (!user) {
      logger.warn({ path: '/api/animations/[id]', method: 'PUT' }, 'Unauthorized access attempt')
      return errorResponse('AUTH_1001', 'Authentication requise', 401)
    }

    // Get animation ID from route params
    const { id: animationId } = await params

    // Parse and validate request body
    const body = await request.json()
    const validation = updateAnimationSchema.safeParse(body)

    if (!validation.success) {
      logger.warn(
        { userId: user.userId, animationId, errors: validation.error.flatten() },
        'Invalid animation update data'
      )
      return errorResponse('VALIDATION_ERROR', 'Données invalides', 400)
    }

    // Connect to database
    await connectDatabase()

    // Update animation (service handles ownership check)
    const animation = await animationService.updateAnimation(
      animationId,
      user.userId,
      validation.data
    )

    // Transform to response format
    const response = animationService.toAnimationResponse(animation)

    logger.info(
      { userId: user.userId, animationId, updatedFields: Object.keys(validation.data) },
      'Animation updated successfully'
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
    if (error.code === 'VALIDATION_2002') {
      return errorResponse(error.code, error.message, 400)
    }

    // Log unexpected errors
    logger.error(
      { error: error.message, stack: error.stack },
      'Error updating animation'
    )
    return errorResponse('INTERNAL_3000', 'Une erreur est survenue', 500)
  }
}
