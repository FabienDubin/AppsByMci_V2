import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/services/auth.service'
import { connectDatabase } from '@/lib/database'
import { logger } from '@/lib/logger'

// API response helpers
function successResponse<T>(data: T) {
  return NextResponse.json({ success: true, data })
}

function errorResponse(code: string, message: string, status: number = 400) {
  return NextResponse.json({ success: false, error: { code, message } }, { status })
}

export async function POST(request: NextRequest) {
  try {
    // Connect to DB
    await connectDatabase()

    // Get refresh token from httpOnly cookie
    const refreshToken = request.cookies.get('refreshToken')?.value

    // Idempotent operation: succeed even if no refresh token
    if (!refreshToken) {
      logger.info('Logout attempt without refresh token - treating as already logged out')

      // Clear cookie anyway (in case it exists but is corrupt)
      const response = successResponse({ message: 'Déconnexion réussie' })
      response.cookies.set('refreshToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0, // Delete cookie
        path: '/',
      })

      return response
    }

    // Invalidate session in database
    await authService.logout(refreshToken)

    // Create success response
    const response = successResponse({ message: 'Déconnexion réussie' })

    // Clear refresh token cookie
    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Delete cookie
      path: '/',
    })

    logger.info('User logged out successfully')

    return response
  } catch (error: any) {
    // Handle unexpected errors (log and return generic message)
    logger.error({
      err: error instanceof Error ? { message: error.message, stack: error.stack, name: error.name } : error,
    }, 'Unexpected error during logout')

    return errorResponse('INTERNAL_ERROR', 'Une erreur est survenue', 500)
  }
}
