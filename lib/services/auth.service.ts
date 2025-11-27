import User, { IUser } from '@/models/User.model'
import Session from '@/models/Session.model'
import { hashPassword, comparePassword, generateAccessToken, generateRefreshToken } from '@/lib/auth'
import { logger } from '@/lib/logger'

// Authentication error codes
const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'AUTH_1001',
  EMAIL_EXISTS: 'AUTH_1003',
} as const

// User response type (excludes passwordHash for security)
export interface UserResponse {
  id: string
  email: string
  name?: string
  role: 'admin' | 'editor' | 'viewer'
  createdAt: Date
}

// Login response type containing tokens and user info
export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: UserResponse
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
    // Check for existing user with same email
    const existingUser = await this.findUserByEmail(email)
    if (existingUser) {
      logger.warn({ email }, 'Attempt to create user with existing email')
      const error = new Error('Cet email est déjà utilisé')
      ;(error as any).code = AUTH_ERRORS.EMAIL_EXISTS
      throw error
    }

    // Hash password before storage
    const passwordHash = await hashPassword(password)

    // Create user (Sprint 1: all users default to admin role)
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      name,
      role: 'admin',
    })

    logger.info({ email, userId: user._id.toString() }, 'User created successfully')

    return this.toUserResponse(user)
  }

  /**
   * Login user with email and password
   * @throws Error with code AUTH_1001 if credentials are invalid
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    // Look up user by email
    const user = await this.findUserByEmail(email)
    if (!user) {
      logger.warn({ email }, 'Login attempt with non-existent email')
      const error = new Error('Email ou mot de passe incorrect')
      ;(error as any).code = AUTH_ERRORS.INVALID_CREDENTIALS
      throw error
    }

    // Validate password
    const isPasswordValid = await comparePassword(password, user.passwordHash)
    if (!isPasswordValid) {
      logger.warn({ email }, 'Login attempt with invalid password')
      const error = new Error('Email ou mot de passe incorrect')
      ;(error as any).code = AUTH_ERRORS.INVALID_CREDENTIALS
      throw error
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    })
    const refreshToken = generateRefreshToken()

    // Hash refresh token before storage (never store tokens in plain text)
    const refreshTokenHash = await hashPassword(refreshToken)

    // Create session with 7-day expiration
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await Session.create({
      userId: user._id,
      refreshToken: refreshTokenHash,
      expiresAt,
    })

    logger.info({ email, userId: user._id.toString() }, 'User logged in successfully')

    return {
      accessToken,
      refreshToken,
      user: this.toUserResponse(user),
    }
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

// Singleton instance export
export const authService = new AuthService()
