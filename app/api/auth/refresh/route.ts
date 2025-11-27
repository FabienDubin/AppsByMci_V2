import { NextRequest, NextResponse } from 'next/server'
import { connectDatabase } from '@/lib/database'
import { authService } from '@/lib/services/auth.service'
import { logger } from '@/lib/logger'

// API Response helpers
function successResponse<T>(data: T) {
  return NextResponse.json({ success: true, data })
}

function errorResponse(code: string, message: string, status: number = 400) {
  return NextResponse.json({ success: false, error: { code, message } }, { status })
}

export async function POST(request: NextRequest) {
  try {
    // Get the cookie from the request
    const refreshToken = request.cookies.get('refreshToken')?.value

    // If no cookie → AUTH_1002
    if (!refreshToken) {
      return errorResponse('AUTH_1002', 'Session expirée. Veuillez vous reconnecter.', 401)
    }

    // Connect to DB
    await connectDatabase()

    // Validate refresh token and get new access token
    const result = await authService.refreshAccessToken(refreshToken)

    // Return new access token
    return successResponse({ accessToken: result.accessToken })

  } catch (error: any) {
    // Handle AUTH_1002 (invalid/expired refresh token)
    if (error.code === 'AUTH_1002') {
      logger.warn('Refresh token invalid or expired')
      return errorResponse('AUTH_1002', 'Session expirée. Veuillez vous reconnecter.', 401)
    }

    // Handle unexpected errors
    logger.error({
      err: error instanceof Error ? { message: error.message, stack: error.stack, name: error.name } : error
    }, 'Unexpected error during token refresh')
    return errorResponse('INTERNAL_ERROR', 'Une erreur est survenue', 500)
  }
}
