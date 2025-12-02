import { NextRequest, NextResponse } from 'next/server'
import { animationService } from '@/lib/services/animation.service'
import { connectDatabase } from '@/lib/database'
import { logger } from '@/lib/logger'

// API response helpers
function successResponse<T>(data: T) {
  return NextResponse.json({ success: true, data })
}

function errorResponse(code: string, message: string, status: number = 400) {
  return NextResponse.json({ success: false, error: { code, message } }, { status })
}

/**
 * GET /api/animations/by-slug/[slug]
 * Get a published animation by slug (public access, no authentication required)
 * Returns 404 if animation not found or not published
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Get slug from route params
    const { slug } = await params

    // Connect to database
    await connectDatabase()

    // Get published animation by slug
    const animation = await animationService.getPublishedAnimationBySlug(slug)

    // Transform to response format
    const response = animationService.toAnimationResponse(animation)

    logger.info(
      { slug },
      'Published animation retrieved by slug'
    )

    return successResponse(response)
  } catch (error: any) {
    // Handle not found error (animation doesn't exist or not published)
    if (error.code === 'NOT_FOUND_3001') {
      return errorResponse(error.code, error.message, 404)
    }

    // Log unexpected errors
    logger.error(
      { error: error.message, stack: error.stack },
      'Error retrieving animation by slug'
    )
    return errorResponse('INTERNAL_3000', 'Une erreur est survenue', 500)
  }
}
