import { NextRequest } from 'next/server'
import { verifyAccessToken } from '@/lib/auth'

/**
 * User info extracted from JWT token
 */
export interface AuthenticatedUser {
  userId: string
  email: string
  role: string
}

/**
 * Extract and verify JWT token from Authorization header
 * @param request Next.js request object
 * @returns User info if authenticated, null otherwise
 */
export function getAuthenticatedUser(request: NextRequest): AuthenticatedUser | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7) // Remove "Bearer " prefix
  try {
    return verifyAccessToken(token)
  } catch (error) {
    return null
  }
}
