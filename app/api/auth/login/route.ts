import { NextRequest, NextResponse } from 'next/server'
import { loginSchema } from '@/lib/schemas/auth.schema'
import { authService } from '@/lib/services/auth.service'
import { connectDatabase } from '@/lib/database'
import { logger } from '@/lib/logger'
import { checkRateLimit, recordFailedAttempt, resetRateLimitOnSuccess } from '@/lib/rate-limit'

// API response helpers
function successResponse<T>(data: T) {
  return NextResponse.json({ success: true, data })
}

function errorResponse(code: string, message: string, status: number = 400) {
  return NextResponse.json({ success: false, error: { code, message } }, { status })
}

// Extract client IP from request headers
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return request.headers.get('x-real-ip') || 'unknown'
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request)

  try {
    // Check rate limit
    const rateLimitResult = checkRateLimit(ip)
    if (!rateLimitResult.allowed) {
      logger.warn({ ip, action: 'login_rate_limited' }, 'Rate limit exceeded for login')
      return errorResponse('AUTH_1004', 'Trop de tentatives. Réessayez dans 1 heure.', 429)
    }

    // Parse and validate request
    const body = await request.json()
    const validation = loginSchema.safeParse(body)

    if (!validation.success) {
      return errorResponse('VALIDATION_ERROR', 'Données invalides', 400)
    }

    const { email, password } = validation.data

    // Connect to DB
    await connectDatabase()

    // Authenticate user
    const result = await authService.login(email, password)

    // Clear rate limit on success
    resetRateLimitOnSuccess(ip)

    // Set httpOnly cookie for refresh token (secure storage)
    const response = successResponse({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    })

    // Cookie configuration
    const isProduction = process.env.NODE_ENV === 'production'
    response.cookies.set('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: '/',
    })

    return response
  } catch (error: any) {
    // Handle auth errors
    if (error.code === 'AUTH_1001') {
      recordFailedAttempt(ip)
      logger.warn({ ip, action: 'login_failed' }, 'Login failed - invalid credentials')
      return errorResponse('AUTH_1001', 'Email ou mot de passe incorrect', 401)
    }

    // Handle unexpected errors (log and return generic message)
    logger.error({
      err: error instanceof Error ? { message: error.message, stack: error.stack, name: error.name } : error,
      ip
    }, 'Unexpected error during login')
    return errorResponse('INTERNAL_ERROR', 'Une erreur est survenue', 500)
  }
}
