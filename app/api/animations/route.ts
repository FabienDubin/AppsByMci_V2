import { NextRequest, NextResponse } from 'next/server'
import { createAnimationSchema } from '@/lib/schemas/animation.schema'
import { animationService } from '@/lib/services/animation.service'
import { connectDatabase } from '@/lib/database'
import { logger } from '@/lib/logger'
import { getAuthenticatedUser } from '@/lib/api-helpers'
import {
  checkAnimationCreationRateLimit,
  recordAnimationCreation,
} from '@/lib/rate-limit'

// API response helpers
function successResponse<T>(data: T) {
  return NextResponse.json({ success: true, data })
}

function errorResponse(code: string, message: string, status: number = 400) {
  return NextResponse.json({ success: false, error: { code, message } }, { status })
}

/**
 * GET /api/animations
 * List all animations for authenticated user
 * Requires authentication
 * Query params:
 *   - filter: 'active' (default), 'archived', or 'all'
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = getAuthenticatedUser(request)
    if (!user) {
      logger.warn({ path: '/api/animations', method: 'GET' }, 'Unauthorized access attempt')
      return errorResponse('AUTH_1001', 'Authentication requise', 401)
    }

    // Get filter from query params (Story 3.11)
    const searchParams = request.nextUrl.searchParams
    const filterParam = searchParams.get('filter')
    const filter: 'active' | 'archived' | 'all' =
      filterParam === 'archived' ? 'archived' :
      filterParam === 'all' ? 'all' :
      'active' // default

    // Connect to database
    await connectDatabase()

    // List animations for user with filter
    const animations = await animationService.listAnimations(user.userId, filter)

    // Transform to response format
    const response = animations.map((animation) =>
      animationService.toAnimationResponse(animation)
    )

    logger.info(
      { userId: user.userId, filter, count: response.length },
      'Animations listed successfully'
    )

    return successResponse(response)
  } catch (error: any) {
    // Log unexpected errors
    logger.error({ error: error.message, stack: error.stack }, 'Error listing animations')
    return errorResponse('INTERNAL_3000', 'Une erreur est survenue', 500)
  }
}

/**
 * POST /api/animations
 * Create a new animation draft
 * Requires authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = getAuthenticatedUser(request)
    if (!user) {
      logger.warn({ path: '/api/animations', method: 'POST' }, 'Unauthorized access attempt')
      return errorResponse('AUTH_1001', 'Authentication requise', 401)
    }

    // Check rate limit (10 creations per hour per user)
    const rateLimitResult = checkAnimationCreationRateLimit(user.userId)
    if (!rateLimitResult.allowed) {
      logger.warn(
        { userId: user.userId, resetAt: rateLimitResult.resetAt },
        'Animation creation rate limit exceeded'
      )
      return errorResponse(
        'RATE_LIMIT_EXCEEDED',
        'Limite de créations atteinte (10/heure). Réessayez dans quelques minutes.',
        429
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = createAnimationSchema.safeParse(body)

    if (!validation.success) {
      logger.warn(
        { userId: user.userId, errors: validation.error.flatten() },
        'Invalid animation creation data'
      )
      return errorResponse('VALIDATION_ERROR', 'Données invalides', 400)
    }

    const { name, description, slug } = validation.data

    // Connect to database
    await connectDatabase()

    // Create draft animation
    const animation = await animationService.createDraft(user.userId, {
      name,
      description,
      slug,
    })

    // Transform to response format
    const response = animationService.toAnimationResponse(animation)

    // Record successful creation for rate limiting
    recordAnimationCreation(user.userId)

    logger.info(
      { userId: user.userId, animationId: animation._id.toString(), slug },
      'Animation draft created successfully'
    )

    return successResponse(response)
  } catch (error: any) {
    // Handle specific business errors
    if (error.code === 'VALIDATION_2002') {
      return errorResponse(error.code, error.message, 400)
    }

    // Log unexpected errors
    logger.error({ error: error.message, stack: error.stack }, 'Error creating animation')
    return errorResponse('INTERNAL_3000', 'Une erreur est survenue', 500)
  }
}
