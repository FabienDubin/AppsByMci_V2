import { NextRequest, NextResponse } from 'next/server'
import { changePasswordSchema } from '@/lib/schemas/auth.schema'
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
    const validation = changePasswordSchema.safeParse(body)

    if (!validation.success) {
      return errorResponse('VALIDATION_ERROR', 'Données invalides', 400)
    }

    const { currentPassword, newPassword } = validation.data

    // Connect to DB
    await connectDatabase()

    // Get the refresh token from cookie to keep current session active
    const refreshToken = request.cookies.get('refreshToken')?.value

    // Change user password (invalidates other sessions but keeps current one)
    await usersService.changePassword(userId, currentPassword, newPassword, refreshToken)

    return successResponse({
      message: 'Mot de passe changé avec succès',
    })
  } catch (error: any) {
    // Handle incorrect current password error
    if (error.code === 'AUTH_1005') {
      logger.warn({ error: error.message }, 'Password change failed - incorrect current password')
      return errorResponse('AUTH_1005', 'Mot de passe actuel incorrect', 401)
    }

    // Handle user not found error
    if (error.code === 'USER_1001') {
      logger.warn({ error: error.message }, 'User not found during password change')
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
      'Unexpected error during password change'
    )
    return errorResponse('INTERNAL_ERROR', 'Une erreur est survenue', 500)
  }
}
