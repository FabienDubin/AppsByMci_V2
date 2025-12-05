import { NextRequest, NextResponse } from 'next/server'
import { updateUserByAdminSchema } from '@/lib/schemas/user.schema'
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

// Helper to verify admin role
function verifyAdminAccess(request: NextRequest): { userId: string; error?: NextResponse } {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { userId: '', error: errorResponse('UNAUTHORIZED', 'Token d\'accès manquant', 401) }
  }

  const token = authHeader.substring(7)
  try {
    const payload = verifyAccessToken(token)
    if (payload.role !== 'admin') {
      return { userId: '', error: errorResponse('FORBIDDEN', 'Accès réservé aux administrateurs', 403) }
    }
    return { userId: payload.userId }
  } catch {
    return { userId: '', error: errorResponse('UNAUTHORIZED', 'Token d\'accès invalide ou expiré', 401) }
  }
}

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * PUT /api/users/[id] - Update a user (admin only)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Verify admin access
    const auth = verifyAdminAccess(request)
    if (auth.error) return auth.error

    const { id: userId } = await params

    // Validate MongoDB ObjectId format
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return errorResponse('VALIDATION_ERROR', 'ID utilisateur invalide', 400)
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = updateUserByAdminSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.errors[0]
      return errorResponse('VALIDATION_ERROR', firstError.message, 400)
    }

    // Connect to DB
    await connectDatabase()

    // Update user
    const user = await usersService.updateUser(userId, validation.data)

    return successResponse(user)
  } catch (error: any) {
    // Handle user not found error
    if (error.code === 'USER_1001') {
      return errorResponse('NOT_FOUND', 'Utilisateur non trouvé', 404)
    }

    logger.error(
      {
        err: error instanceof Error
          ? { message: error.message, stack: error.stack, name: error.name }
          : error,
      },
      'Error updating user'
    )
    return errorResponse('INTERNAL_ERROR', 'Une erreur est survenue', 500)
  }
}

/**
 * DELETE /api/users/[id] - Delete a user (admin only)
 * Also archives all user's animations
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Verify admin access
    const auth = verifyAdminAccess(request)
    if (auth.error) return auth.error

    const { id: userId } = await params

    // Validate MongoDB ObjectId format
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return errorResponse('VALIDATION_ERROR', 'ID utilisateur invalide', 400)
    }

    // Connect to DB
    await connectDatabase()

    // Delete user (archives animations, prevents self-delete)
    await usersService.deleteUser(userId, auth.userId)

    return successResponse({ message: 'Utilisateur supprimé avec succès' })
  } catch (error: any) {
    // Handle user not found error
    if (error.code === 'USER_1001') {
      return errorResponse('NOT_FOUND', 'Utilisateur non trouvé', 404)
    }

    // Handle self-delete attempt
    if (error.code === 'USER_1003') {
      return errorResponse('FORBIDDEN', 'Vous ne pouvez pas vous supprimer', 403)
    }

    logger.error(
      {
        err: error instanceof Error
          ? { message: error.message, stack: error.stack, name: error.name }
          : error,
      },
      'Error deleting user'
    )
    return errorResponse('INTERNAL_ERROR', 'Une erreur est survenue', 500)
  }
}
