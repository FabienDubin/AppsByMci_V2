import { NextRequest, NextResponse } from 'next/server'
import { updateProfileSchema } from '@/lib/schemas/auth.schema'
import { usersService } from '@/lib/services/users.service'
import { connectDatabase } from '@/lib/database'
import { logger } from '@/lib/logger'
import { verifyAccessToken } from '@/lib/auth'

// API response helpers
function successResponse<T>(data: T) {
  return NextResponse.json({ success: true, data })
}

function errorResponse(code: string, message: string, status: number = 400) {
  return NextResponse.json({ success: false, error: { code, message } }, { status })
}

export async function PUT(request: NextRequest) {
  try {
    // Extract and verify JWT from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('AUTH_1002', 'Token d\'accès manquant ou invalide', 401)
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    let userId: string

    try {
      const payload = verifyAccessToken(token)
      userId = payload.userId
    } catch (error) {
      return errorResponse('AUTH_1002', 'Token d\'accès invalide ou expiré', 401)
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = updateProfileSchema.safeParse(body)

    if (!validation.success) {
      return errorResponse('VALIDATION_ERROR', 'Données invalides', 400)
    }

    const { name } = validation.data

    // Connect to DB
    await connectDatabase()

    // Update user profile
    const updatedUser = await usersService.updateProfile(userId, { name })

    return successResponse(updatedUser)
  } catch (error: any) {
    // Handle user not found error
    if (error.code === 'USER_1001') {
      logger.warn({ error: error.message }, 'User not found during profile update')
      return errorResponse('USER_1001', 'Utilisateur non trouvé', 404)
    }

    // Handle unexpected errors
    logger.error(
      {
        err:
          error instanceof Error
            ? { message: error.message, stack: error.stack, name: error.name }
            : error,
      },
      'Unexpected error during profile update'
    )
    return errorResponse('INTERNAL_ERROR', 'Une erreur est survenue', 500)
  }
}
