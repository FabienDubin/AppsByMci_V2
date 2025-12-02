import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { animationService } from '@/lib/services/animation.service'
import { connectDatabase } from '@/lib/database'
import { logger } from '@/lib/logger'

// Request body schema
const validateAccessSchema = z.object({
  accessCode: z.string().min(1, "Le code d'accès est requis"),
})

// API response helpers
function successResponse<T>(data: T) {
  return NextResponse.json({ success: true, data })
}

function errorResponse(code: string, message: string, status: number = 400) {
  return NextResponse.json({ success: false, error: { code, message } }, { status })
}

/**
 * POST /api/animations/by-slug/[slug]/validate-access
 * Validate access code for an animation (public access, no authentication required)
 * Returns 200 OK if code is valid, 403 Forbidden if code is invalid
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Get slug from route params
    const { slug } = await params

    // Parse and validate request body
    const body = await request.json()
    const validation = validateAccessSchema.safeParse(body)

    if (!validation.success) {
      logger.warn(
        { slug, errors: validation.error.flatten() },
        'Invalid access validation request'
      )
      return errorResponse('VALIDATION_ERROR', "Code d'accès requis", 400)
    }

    const { accessCode } = validation.data

    // Connect to database
    await connectDatabase()

    // Validate access code
    await animationService.validateAccessCode(slug, accessCode)

    logger.info(
      { slug },
      'Access code validated successfully'
    )

    return successResponse({ valid: true })
  } catch (error: any) {
    // Handle not found error
    if (error.code === 'NOT_FOUND_3001') {
      return errorResponse(error.code, error.message, 404)
    }

    // Handle access denied (invalid code)
    if (error.code === 'AUTH_1003') {
      return errorResponse('ACCESS_DENIED', error.message, 403)
    }

    // Log unexpected errors
    logger.error(
      { error: error.message, stack: error.stack },
      'Error validating access code'
    )
    return errorResponse('INTERNAL_3000', 'Une erreur est survenue', 500)
  }
}
