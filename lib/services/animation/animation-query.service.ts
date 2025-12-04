// Animation Query Service
// Handles read operations (get, list, find)

import Animation, { IAnimation } from '@/models/Animation.model'
import { logger } from '@/lib/logger'
import mongoose from 'mongoose'
import { ANIMATION_ERRORS, AnimationResponse, AnimationFilter } from './animation.types'
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
   * List all animations for a user
   * @param userId - The user ID to list animations for
   * @param filter - Optional filter: 'active' (draft+published), 'archived', or 'all'
   * @returns Array of animations
   */
  async listAnimations(userId: string, filter: AnimationFilter = 'active'): Promise<IAnimation[]> {
    let statusFilter: any = {}

    if (filter === 'active') {
      statusFilter = { status: { $in: ['draft', 'published'] } }
    } else if (filter === 'archived') {
      statusFilter = { status: 'archived' }
    }
    // 'all' = no status filter

    const animations = await Animation.find({
      userId: new mongoose.Types.ObjectId(userId),
      ...statusFilter,
    }).sort({ createdAt: -1 })

    logger.info(
      { userId, filter, count: animations.length },
      'Listed animations for user'
    )

    return animations
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
