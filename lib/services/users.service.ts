import User, { IUser } from '@/models/User.model'
import Session from '@/models/Session.model'
import { hashPassword, comparePassword } from '@/lib/auth'
import { logger } from '@/lib/logger'

// User service error codes
const USER_ERRORS = {
  INCORRECT_PASSWORD: 'AUTH_1005',
  USER_NOT_FOUND: 'USER_1001',
} as const

// User response type (excludes passwordHash for security)
export interface UserResponse {
  id: string
  email: string
  name?: string
  role: 'admin' | 'editor' | 'viewer'
  createdAt: Date
}

/**
 * User profile management service
 */
export class UsersService {
  /**
   * Find user by ID
   * @throws Error with code USER_1001 if user not found
   */
  async findById(userId: string): Promise<IUser> {
    const user = await User.findById(userId)
    if (!user) {
      logger.warn({ userId }, 'User not found')
      const error = new Error('Utilisateur non trouvé')
      ;(error as any).code = USER_ERRORS.USER_NOT_FOUND
      throw error
    }
    return user
  }

  /**
   * Update user profile (name only for now)
   * @param userId - User ID to update
   * @param updates - Object containing name to update
   * @returns Updated user response
   * @throws Error with code USER_1001 if user not found
   */
  async updateProfile(
    userId: string,
    updates: { name: string }
  ): Promise<UserResponse> {
    // Find user
    const user = await this.findById(userId)

    // Update name
    user.name = updates.name

    // Save changes
    await user.save()

    logger.info({ userId, name: updates.name }, 'User profile updated successfully')

    return this.toUserResponse(user)
  }

  /**
   * Change user password
   * @param userId - User ID
   * @param currentPassword - Current password for verification
   * @param newPassword - New password to set
   * @param keepCurrentSession - Refresh token of current session to keep active (optional)
   * @throws Error with code AUTH_1005 if current password is incorrect
   * @throws Error with code USER_1001 if user not found
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    keepCurrentSession?: string
  ): Promise<void> {
    // Find user
    const user = await this.findById(userId)

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.passwordHash)
    if (!isPasswordValid) {
      logger.warn({ userId }, 'Password change attempt with incorrect current password')
      const error = new Error('Mot de passe actuel incorrect')
      ;(error as any).code = USER_ERRORS.INCORRECT_PASSWORD
      throw error
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword)

    // Update password
    user.passwordHash = newPasswordHash
    await user.save()

    // Invalidate other sessions but keep current one
    await this.invalidateOtherSessions(userId, keepCurrentSession)

    logger.info({ userId }, 'Password changed successfully and other sessions invalidated')
  }

  /**
   * Invalidate all user sessions
   * @param userId - User ID
   */
  async invalidateAllSessions(userId: string): Promise<void> {
    const result = await Session.deleteMany({ userId })
    logger.info(
      { userId, deletedCount: result.deletedCount },
      'All user sessions invalidated'
    )
  }

  /**
   * Invalidate other user sessions (keep current one)
   * @param userId - User ID
   * @param currentRefreshToken - Current session refresh token to keep (optional)
   */
  async invalidateOtherSessions(userId: string, currentRefreshToken?: string): Promise<void> {
    if (!currentRefreshToken) {
      // No current session specified, invalidate all
      return this.invalidateAllSessions(userId)
    }

    // Find all sessions for this user
    const sessions = await Session.find({ userId })

    // Find the current session by comparing refresh token hashes
    let currentSessionId = null
    for (const session of sessions) {
      const isMatch = await comparePassword(currentRefreshToken, session.refreshToken)
      if (isMatch) {
        currentSessionId = session._id
        break
      }
    }

    // Delete all sessions except the current one
    if (currentSessionId) {
      const result = await Session.deleteMany({
        userId,
        _id: { $ne: currentSessionId },
      })
      logger.info(
        { userId, deletedCount: result.deletedCount, keptSessionId: currentSessionId.toString() },
        'Other user sessions invalidated (current session kept)'
      )
    } else {
      // Current session not found, invalidate all for safety
      logger.warn({ userId }, 'Current session not found, invalidating all sessions')
      await this.invalidateAllSessions(userId)
    }
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
export const usersService = new UsersService()
