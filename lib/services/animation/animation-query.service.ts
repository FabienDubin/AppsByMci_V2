// Animation Query Service
// Handles read operations (get, list, find)

import Animation, { IAnimation } from '@/models/Animation.model'
import { logger } from '@/lib/logger'
import mongoose from 'mongoose'
import { ANIMATION_ERRORS, AnimationResponse, AnimationFilter, AnimationListOptions, AnimationListResult } from './animation.types'
import { animationValidationService } from './animation-validation.service'

/**
 * Animation query service
 * Handles all read operations for animations
 */
class AnimationQueryService {
  /**
   * Get animation by ID
   * @param animationId - The animation ID
   * @param userId - The user ID requesting the animation
   * @returns Animation document
   * @throws Error with code NOT_FOUND_3001 if animation not found
   * @throws Error with code AUTH_1003 if user doesn't own the animation
   */
  async getAnimationById(animationId: string, userId: string): Promise<IAnimation> {
    const animation = await Animation.findById(animationId)

    if (!animation) {
      logger.warn({ animationId, userId }, 'Animation not found')
      const error = new Error('Animation introuvable')
      ;(error as any).code = ANIMATION_ERRORS.NOT_FOUND
      throw error
    }

    // Check ownership
    animationValidationService.validateOwnership(animation, userId)

    return animation
  }

  /**
   * Build status filter based on filter parameter
   */
  private buildStatusFilter(filter: AnimationFilter): Record<string, any> {
    if (filter === 'active') {
      return { status: { $in: ['draft', 'published'] } }
    } else if (filter === 'archived') {
      return { status: 'archived' }
    }
    return {} // 'all' = no status filter
  }

  /**
   * Build search filter for name
   */
  private buildSearchFilter(search?: string): Record<string, any> {
    if (!search || search.trim() === '') {
      return {}
    }
    // Case-insensitive search on name field
    return { name: { $regex: search.trim(), $options: 'i' } }
  }

  /**
   * List all animations for a user with search and pagination
   * @param userId - The user ID to list animations for
   * @param options - List options (filter, search, page, limit)
   * @returns Paginated list of animations
   */
  async listAnimations(userId: string, options: AnimationListOptions = {}): Promise<AnimationListResult> {
    const { filter = 'active', search, page = 1, limit = 10 } = options

    const statusFilter = this.buildStatusFilter(filter)
    const searchFilter = this.buildSearchFilter(search)

    const query = {
      userId: new mongoose.Types.ObjectId(userId),
      ...statusFilter,
      ...searchFilter,
    }

    // Count total for pagination
    const total = await Animation.countDocuments(query)
    const totalPages = Math.ceil(total / limit)
    const skip = (page - 1) * limit

    const animations = await Animation.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    logger.info(
      { userId, filter, search, page, limit, total, count: animations.length },
      'Listed animations for user'
    )

    return {
      data: animations,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    }
  }

  /**
   * List all animations (admin only) with search and pagination
   * @param options - List options (filter, search, page, limit)
   * @returns Paginated list of all animations from all users
   */
  async listAllAnimations(options: AnimationListOptions = {}): Promise<AnimationListResult> {
    const { filter = 'active', search, page = 1, limit = 10 } = options

    const statusFilter = this.buildStatusFilter(filter)
    const searchFilter = this.buildSearchFilter(search)

    const query = {
      ...statusFilter,
      ...searchFilter,
    }

    // Count total for pagination
    const total = await Animation.countDocuments(query)
    const totalPages = Math.ceil(total / limit)
    const skip = (page - 1) * limit

    const animations = await Animation.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    logger.info(
      { filter, search, page, limit, total, count: animations.length },
      'Listed all animations (admin)'
    )

    return {
      data: animations,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    }
  }

  /**
   * Get a published animation by slug (public access, no authentication)
   * @param slug - The animation slug
   * @returns Animation document if published
   * @throws Error with code NOT_FOUND_3001 if animation not found or not published
   */
  async getPublishedAnimationBySlug(slug: string): Promise<IAnimation> {
    const animation = await Animation.findOne({ slug })

    if (!animation) {
      logger.info({ slug }, 'Animation not found by slug')
      const error = new Error('Animation introuvable')
      ;(error as any).code = ANIMATION_ERRORS.NOT_FOUND
      throw error
    }

    // Only return published animations
    if (animation.status !== 'published') {
      logger.info(
        { slug, status: animation.status },
        'Animation found but not published'
      )
      const error = new Error('Animation introuvable')
      ;(error as any).code = ANIMATION_ERRORS.NOT_FOUND
      throw error
    }

    return animation
  }

  /**
   * Transform animation document to response format
   */
  toAnimationResponse(animation: IAnimation): AnimationResponse {
    const obj = animation.toJSON()
    return {
      id: obj.id || obj._id.toString(),
      userId: obj.userId.toString(),
      name: obj.name,
      slug: obj.slug,
      description: obj.description,
      status: obj.status,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
      // Explicitly include wizard step fields (safe, no spread)
      accessConfig: obj.accessConfig, // Step 2
      baseFields: obj.baseFields, // Step 2
      inputCollection: obj.inputCollection, // Step 3
      pipeline: obj.pipeline,
      aiModel: obj.aiModel,
      emailConfig: obj.emailConfig,
      publicDisplayConfig: obj.publicDisplayConfig, // Step 6
      customization: obj.customization, // Step 7
      qrCodeUrl: obj.qrCodeUrl,
      publishedAt: obj.publishedAt,
      archivedAt: obj.archivedAt, // Story 3.11
    }
  }
}

// Export singleton instance
export const animationQueryService = new AnimationQueryService()
