import User, { IUser } from '@/models/User.model'
import { hashPassword } from '@/lib/auth'
import { logger } from '@/lib/logger'

// Error codes
const AUTH_ERRORS = {
  EMAIL_EXISTS: 'AUTH_1003',
} as const

// User response type (without passwordHash)
export interface UserResponse {
  id: string
  email: string
  name?: string
  role: 'admin' | 'editor' | 'viewer'
  createdAt: Date
}

/**
 * Authentication service
 */
export class AuthService {
  /**
   * Create a new user
   * @throws Error with code AUTH_1003 if email already exists
   */
  async createUser(email: string, password: string, name?: string): Promise<UserResponse> {
    // Check if email already exists
    const existingUser = await this.findUserByEmail(email)
    if (existingUser) {
      logger.warn({ email }, 'Attempt to create user with existing email')
      const error = new Error('Cet email est déjà utilisé')
      ;(error as any).code = AUTH_ERRORS.EMAIL_EXISTS
      throw error
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      name,
      role: 'admin', // Sprint 1: all users are admin
    })

    logger.info({ email, userId: user._id.toString() }, 'User created successfully')

    return this.toUserResponse(user)
  }

  /**
   * Find user by email
   */
  async findUserByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase() })
  }

  /**
   * Convert IUser to UserResponse (removes sensitive data)
   */
  private toUserResponse(user: IUser): UserResponse {
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    }
  }
}

// Export singleton instance
export const authService = new AuthService()
