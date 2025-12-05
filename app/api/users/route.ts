import { NextRequest, NextResponse } from 'next/server'
import { createUserByAdminSchema, getUsersQuerySchema } from '@/lib/schemas/user.schema'
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

/**
 * GET /api/users - List all users (admin only)
 * Query params: ?search={query}&role={role}
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const auth = verifyAdminAccess(request)
    if (auth.error) return auth.error

    // Parse query params
    const { searchParams } = new URL(request.url)
    const queryParams = {
      search: searchParams.get('search') || undefined,
      role: searchParams.get('role') || undefined,
    }

    // Validate query params
    const validation = getUsersQuerySchema.safeParse(queryParams)
    if (!validation.success) {
      return errorResponse('VALIDATION_ERROR', 'Paramètres de requête invalides', 400)
    }

    // Connect to DB
    await connectDatabase()

    // Get users with filters
    const users = await usersService.getUsers(validation.data)

    return successResponse(users)
  } catch (error: any) {
    logger.error(
      {
        err: error instanceof Error
          ? { message: error.message, stack: error.stack, name: error.name }
          : error,
      },
      'Error fetching users'
    )
    return errorResponse('INTERNAL_ERROR', 'Une erreur est survenue', 500)
  }
}

/**
 * POST /api/users - Create a new user (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const auth = verifyAdminAccess(request)
    if (auth.error) return auth.error

    // Parse and validate request body
    const body = await request.json()
    const validation = createUserByAdminSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.errors[0]
      return errorResponse('VALIDATION_ERROR', firstError.message, 400)
    }

    // Connect to DB
    await connectDatabase()

    // Create user
    const user = await usersService.createUser(validation.data)

    return successResponse(user)
  } catch (error: any) {
    // Handle email exists error
    if (error.code === 'USER_1002') {
      return errorResponse('CONFLICT', 'Cet email est déjà utilisé', 409)
    }

    logger.error(
      {
        err: error instanceof Error
          ? { message: error.message, stack: error.stack, name: error.name }
          : error,
      },
      'Error creating user'
    )
    return errorResponse('INTERNAL_ERROR', 'Une erreur est survenue', 500)
  }
}
