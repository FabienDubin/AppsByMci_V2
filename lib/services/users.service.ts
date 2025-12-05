import User, { IUser } from '@/models/User.model'
import Session from '@/models/Session.model'
import Animation from '@/models/Animation.model'
import { hashPassword, comparePassword } from '@/lib/auth'
import { logger } from '@/lib/logger'
import type { CreateUserByAdmin, UpdateUserByAdmin, GetUsersQuery } from '@/lib/schemas/user.schema'

// User service error codes
const USER_ERRORS = {
  INCORRECT_PASSWORD: 'AUTH_1005',
  USER_NOT_FOUND: 'USER_1001',
  EMAIL_EXISTS: 'USER_1002',
  SELF_DELETE: 'USER_1003',
} as const

// User response type (excludes passwordHash for security)
export interface UserResponse {
  id: string
  email: string
  name?: string
  role: 'admin' | 'editor' | 'viewer'
  createdAt: Date
}

// Extended user response with animation count (for admin list)
export interface UserWithStatsResponse extends UserResponse {
  animationCount: number
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
  toUserResponse(user: IUser): UserResponse {
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    }
  }

  // ============================================
  // Admin CRUD Operations (Story 5.0)
  // ============================================

  /**
   * Get all users with optional filters (admin only)
   * @param filters - Optional filters for role and search
   * @returns Array of users with animation counts
   */
  async getUsers(filters?: GetUsersQuery): Promise<UserWithStatsResponse[]> {
    // Build query
    const query: Record<string, any> = {}

    // Filter by role if specified
    if (filters?.role) {
      query.role = filters.role
    }

    // Search by email or name (case-insensitive regex)
    if (filters?.search && filters.search.trim()) {
      const searchRegex = new RegExp(filters.search.trim(), 'i')
      query.$or = [
        { email: searchRegex },
        { name: searchRegex },
      ]
    }

    // Get users
    const users = await User.find(query).sort({ createdAt: -1 })

    // Get animation counts for all users
    const userIds = users.map((u) => u._id)
    const animationCounts = await this.getUserAnimationCounts(userIds)

    // Map users to response with animation counts
    const usersWithStats: UserWithStatsResponse[] = users.map((user) => ({
      ...this.toUserResponse(user),
      animationCount: animationCounts.get(user._id.toString()) || 0,
    }))

    logger.info(
      { userCount: users.length, filters },
      'Users retrieved successfully'
    )

    return usersWithStats
  }

  /**
   * Get animation counts for multiple users
   * @param userIds - Array of user IDs
   * @returns Map of userId to animation count
   */
  async getUserAnimationCounts(userIds: any[]): Promise<Map<string, number>> {
    if (userIds.length === 0) {
      return new Map()
    }

    // Aggregate animation counts by userId
    const counts = await Animation.aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
    ])

    // Build map
    const countMap = new Map<string, number>()
    for (const item of counts) {
      countMap.set(item._id.toString(), item.count)
    }

    return countMap
  }

  /**
   * Create a new user (admin only)
   * @param data - User creation data
   * @returns Created user
   * @throws Error with code USER_1002 if email already exists
   */
  async createUser(data: CreateUserByAdmin): Promise<UserResponse> {
    // Check for existing user with same email
    const existingUser = await User.findOne({ email: data.email.toLowerCase() })
    if (existingUser) {
      logger.warn({ email: data.email }, 'Attempt to create user with existing email')
      const error = new Error('Cet email est déjà utilisé')
      ;(error as any).code = USER_ERRORS.EMAIL_EXISTS
      throw error
    }

    // Hash password
    const passwordHash = await hashPassword(data.password)

    // Create user
    const user = await User.create({
      email: data.email.toLowerCase(),
      passwordHash,
      name: data.name,
      role: data.role,
    })

    logger.info({ email: data.email, userId: user._id.toString(), role: data.role }, 'User created by admin')

    return this.toUserResponse(user)
  }

  /**
   * Update an existing user (admin only)
   * @param userId - User ID to update
   * @param data - User update data
   * @returns Updated user
   * @throws Error with code USER_1001 if user not found
   */
  async updateUser(userId: string, data: UpdateUserByAdmin): Promise<UserResponse> {
    // Find user
    const user = await this.findById(userId)

    // Update fields if provided
    if (data.name !== undefined) {
      user.name = data.name
    }
    if (data.role !== undefined) {
      user.role = data.role
    }

    await user.save()

    logger.info({ userId, updates: Object.keys(data) }, 'User updated by admin')

    return this.toUserResponse(user)
  }

  /**
   * Delete a user and archive their animations (admin only)
   * @param userId - User ID to delete
   * @param currentUserId - Current admin user ID (to prevent self-delete)
   * @throws Error with code USER_1001 if user not found
   * @throws Error with code USER_1003 if attempting self-delete
   */
  async deleteUser(userId: string, currentUserId: string): Promise<void> {
    // Prevent self-delete
    if (userId === currentUserId) {
      logger.warn({ userId, currentUserId }, 'Attempt to self-delete')
      const error = new Error('Vous ne pouvez pas vous supprimer')
      ;(error as any).code = USER_ERRORS.SELF_DELETE
      throw error
    }

    // Find user (throws if not found)
    const user = await this.findById(userId)

    // Archive all user's animations (don't delete them)
    const archiveResult = await Animation.updateMany(
      { userId: user._id },
      { $set: { status: 'archived', archivedAt: new Date() } }
    )

    logger.info(
      { userId, archivedAnimations: archiveResult.modifiedCount },
      'User animations archived'
    )

    // Delete all user sessions
    await Session.deleteMany({ userId: user._id })

    // Delete user
    await User.findByIdAndDelete(userId)

    logger.info({ userId, email: user.email }, 'User deleted by admin')
  }
}

// Singleton instance export
export const usersService = new UsersService()
