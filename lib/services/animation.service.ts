import Animation, { IAnimation } from '@/models/Animation.model'
import { logger } from '@/lib/logger'
import mongoose from 'mongoose'

// Animation error codes
const ANIMATION_ERRORS = {
  SLUG_EXISTS: 'VALIDATION_2002',
  NOT_FOUND: 'NOT_FOUND_3001',
  ACCESS_DENIED: 'AUTH_1003',
} as const

// Animation response type for API
export interface AnimationResponse {
  id: string
  userId: string
  name: string
  slug: string
  description: string
  status: 'draft' | 'published' | 'archived'
  createdAt: Date
  updatedAt: Date
  [key: string]: any // Allow additional fields from wizard steps
}

/**
 * Animation service
 */
export class AnimationService {
  /**
   * Validate that a slug is unique
   * @param slug - The slug to check
   * @param excludeId - Optional animation ID to exclude from check (for updates)
   * @returns true if slug is available
   * @throws Error with code VALIDATION_2002 if slug already exists
   */
  async validateSlugUnique(slug: string, excludeId?: string): Promise<boolean> {
    const query: any = { slug }
    if (excludeId) {
      query._id = { $ne: new mongoose.Types.ObjectId(excludeId) }
    }

    const existing = await Animation.findOne(query)
    if (existing) {
      logger.warn({ slug, excludeId }, 'Attempt to use existing slug')
      const error = new Error('Ce slug existe déjà')
      ;(error as any).code = ANIMATION_ERRORS.SLUG_EXISTS
      throw error
    }

    return true
  }

  /**
   * Create a new draft animation
   * @param userId - The user ID creating the animation
   * @param data - Initial animation data (name, description, slug)
   * @returns Created animation
   * @throws Error with code VALIDATION_2002 if slug already exists
   */
  async createDraft(
    userId: string,
    data: { name: string; description?: string; slug: string }
  ): Promise<IAnimation> {
    // Validate slug uniqueness
    await this.validateSlugUnique(data.slug)

    // Create animation with draft status
    const animation = await Animation.create({
      userId: new mongoose.Types.ObjectId(userId),
      name: data.name,
      slug: data.slug,
      description: data.description || '',
      status: 'draft',
      accessValidation: {
        type: 'open',
      },
      pipeline: [],
      questions: [],
    })

    logger.info(
      { animationId: animation._id.toString(), userId, slug: data.slug },
      'Animation draft created successfully'
    )

    return animation
  }

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
    if (animation.userId.toString() !== userId) {
      logger.warn(
        { animationId, userId, ownerId: animation.userId.toString() },
        'Access denied to animation'
      )
      const error = new Error('Accès refusé à cette animation')
      ;(error as any).code = ANIMATION_ERRORS.ACCESS_DENIED
      throw error
    }

    return animation
  }

  /**
   * Update an existing animation
   * @param animationId - The animation ID to update
   * @param userId - The user ID making the update
   * @param data - Partial animation data to update
   * @returns Updated animation
   * @throws Error with code NOT_FOUND_3001 if animation not found
   * @throws Error with code AUTH_1003 if user doesn't own the animation
   * @throws Error with code VALIDATION_2002 if slug already exists
   */
  async updateAnimation(
    animationId: string,
    userId: string,
    data: Partial<IAnimation>
  ): Promise<IAnimation> {
    // Get animation and verify ownership
    const animation = await this.getAnimationById(animationId, userId)

    // If slug is being updated, validate uniqueness
    if (data.slug && data.slug !== animation.slug) {
      await this.validateSlugUnique(data.slug, animationId)
    }

    // Update animation fields using set() for proper Mongoose change tracking
    // Object.assign doesn't trigger Mongoose change detection on nested objects
    for (const [key, value] of Object.entries(data)) {
      animation.set(key, value)
    }
    await animation.save()

    logger.info(
      { animationId, userId, updatedFields: Object.keys(data) },
      'Animation updated successfully'
    )

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
      accessValidation: obj.accessValidation,
      accessConfig: obj.accessConfig, // Step 2
      baseFields: obj.baseFields, // Step 2
      inputCollection: obj.inputCollection, // Step 3
      questions: obj.questions,
      pipeline: obj.pipeline,
      aiModel: obj.aiModel,
      emailConfig: obj.emailConfig,
      displayConfig: obj.displayConfig,
      customization: obj.customization,
      qrCodeUrl: obj.qrCodeUrl,
      publishedAt: obj.publishedAt,
    }
  }
}

// Export singleton instance
export const animationService = new AnimationService()
