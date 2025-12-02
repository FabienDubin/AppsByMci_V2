import Animation, { IAnimation } from '@/models/Animation.model'
import Generation from '@/models/Generation.model'
import { logger } from '@/lib/logger'
import mongoose from 'mongoose'
import { generateAndUploadQRCode, buildPublicUrl, deleteQRCode } from '@/lib/services/qrcode.service'
import type { UpdateAnimation } from '@/lib/schemas/animation.schema'

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
      pipeline: [],
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
   * @param data - Partial animation data to update (from Zod validated schema)
   * @returns Updated animation
   * @throws Error with code NOT_FOUND_3001 if animation not found
   * @throws Error with code AUTH_1003 if user doesn't own the animation
   * @throws Error with code VALIDATION_2002 if slug already exists
   */
  async updateAnimation(
    animationId: string,
    userId: string,
    data: UpdateAnimation
  ): Promise<IAnimation> {
    // Get animation and verify ownership
    const animation = await this.getAnimationById(animationId, userId)

    // If slug is being updated, validate uniqueness
    if (data.slug && data.slug !== animation.slug) {
      await this.validateSlugUnique(data.slug, animationId)
    }

    // Update animation fields using set() for proper Mongoose change tracking
    // For nested objects (publicDisplayConfig, customization), we need to merge
    // with existing values to preserve fields not being updated
    for (const [key, value] of Object.entries(data)) {
      if (key === 'publicDisplayConfig' && value && typeof value === 'object') {
        // Merge with existing publicDisplayConfig
        const existing = animation.publicDisplayConfig || {}
        animation.set('publicDisplayConfig', { ...existing, ...value })
      } else if (key === 'customization' && value && typeof value === 'object') {
        // Deep merge with existing customization to preserve nested objects like textCard
        const existing = (animation.customization || {}) as Record<string, any>
        const incoming = value as Record<string, any>

        // Deep merge textCard if both exist
        const mergedTextCard = incoming.textCard !== undefined
          ? { ...(existing.textCard || {}), ...incoming.textCard }
          : existing.textCard

        animation.set('customization', {
          ...existing,
          ...incoming,
          ...(mergedTextCard ? { textCard: mergedTextCard } : {}),
        })
      } else {
        animation.set(key, value)
      }
    }

    // Mark nested paths as modified to ensure Mongoose saves them
    if (data.publicDisplayConfig) {
      animation.markModified('publicDisplayConfig')
    }
    if (data.customization) {
      animation.markModified('customization')
    }

    await animation.save()

    logger.info(
      { animationId, userId, updatedFields: Object.keys(data) },
      'Animation updated successfully'
    )

    return animation
  }

  /**
   * Create a new animation with full data (for Step 8 publication or draft save)
   * @param userId - The user ID creating the animation
   * @param data - Complete animation data from wizard
   * @param status - 'draft' or 'published'
   * @returns Created animation with optional QR code
   * @throws Error with code VALIDATION_2002 if slug already exists for published animations
   */
  async createAnimation(
    userId: string,
    data: Partial<IAnimation>,
    status: 'draft' | 'published' = 'draft'
  ): Promise<IAnimation> {
    // For published animations, validate slug uniqueness
    if (status === 'published' && data.slug) {
      await this.validateSlugUnique(data.slug)
    }

    // Prepare animation data
    const animationData: Partial<IAnimation> = {
      ...data,
      userId: new mongoose.Types.ObjectId(userId),
      status,
      pipeline: data.pipeline || [],
    }

    // For published animations, set publishedAt and generate QR code
    if (status === 'published') {
      animationData.publishedAt = new Date()

      // Generate QR code
      if (data.slug) {
        try {
          const publicUrl = buildPublicUrl(data.slug)
          const qrCodeUrl = await generateAndUploadQRCode(publicUrl, data.slug)
          animationData.qrCodeUrl = qrCodeUrl

          logger.info(
            { slug: data.slug, qrCodeUrl },
            'QR code generated for published animation'
          )
        } catch (error: any) {
          // QR code generation failed - log error but don't fail publication
          logger.error(
            { slug: data.slug, error: error.message },
            'Failed to generate QR code - animation will be published without QR'
          )
          // Animation remains published, qrCodeUrl stays undefined
        }
      }
    }

    // Create the animation
    const animation = await Animation.create(animationData)

    logger.info(
      {
        animationId: animation._id.toString(),
        userId,
        slug: data.slug,
        status,
        hasQrCode: !!animationData.qrCodeUrl,
      },
      `Animation ${status === 'published' ? 'published' : 'saved as draft'} successfully`
    )

    return animation
  }

  /**
   * Publish an existing draft animation
   * @param animationId - The animation ID to publish
   * @param userId - The user ID publishing the animation
   * @returns Published animation with QR code
   * @throws Error if animation not found, not owned by user, or slug already exists
   */
  async publishAnimation(
    animationId: string,
    userId: string
  ): Promise<IAnimation> {
    // Get animation and verify ownership
    const animation = await this.getAnimationById(animationId, userId)

    // Validate slug uniqueness for publication (excluding current animation)
    await this.validateSlugUnique(animation.slug, animationId)

    // Update status and publish metadata
    animation.status = 'published'
    animation.publishedAt = new Date()

    // Generate QR code
    try {
      const publicUrl = buildPublicUrl(animation.slug)
      const qrCodeUrl = await generateAndUploadQRCode(publicUrl, animation.slug)
      animation.qrCodeUrl = qrCodeUrl

      logger.info(
        { animationId, slug: animation.slug, qrCodeUrl },
        'QR code generated for published animation'
      )
    } catch (error: any) {
      // QR code generation failed - log error but don't fail publication
      logger.error(
        { animationId, slug: animation.slug, error: error.message },
        'Failed to generate QR code - animation will be published without QR'
      )
    }

    await animation.save()

    logger.info(
      { animationId, userId, slug: animation.slug },
      'Animation published successfully'
    )

    return animation
  }

  /**
   * Save existing animation as draft with all wizard data
   * @param animationId - The animation ID to save
   * @param userId - The user ID saving the animation
   * @param data - Complete animation data from wizard
   * @returns Updated animation
   */
  async saveDraft(
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

    // Update all fields from data
    for (const [key, value] of Object.entries(data)) {
      if (key !== '_id' && key !== 'userId') {
        animation.set(key, value)
      }
    }

    // Ensure status is draft
    animation.status = 'draft'

    await animation.save()

    logger.info(
      { animationId, userId, slug: animation.slug },
      'Animation saved as draft'
    )

    return animation
  }

  /**
   * List all animations for a user
   * @param userId - The user ID to list animations for
   * @param filter - Optional filter: 'active' (draft+published), 'archived', or 'all'
   * @returns Array of animations
   */
  async listAnimations(userId: string, filter: 'active' | 'archived' | 'all' = 'active'): Promise<IAnimation[]> {
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
   * Validate access code for an animation
   * @param slug - The animation slug
   * @param accessCode - The access code to validate
   * @returns true if access code is valid
   * @throws Error with code NOT_FOUND_3001 if animation not found
   * @throws Error with code ACCESS_DENIED if access code is invalid
   */
  async validateAccessCode(slug: string, accessCode: string): Promise<boolean> {
    const animation = await this.getPublishedAnimationBySlug(slug)

    // Check if animation requires code access
    if (animation.accessConfig?.type !== 'code') {
      // No code required - access granted
      return true
    }

    // Validate the access code
    if (animation.accessConfig.code !== accessCode) {
      logger.info({ slug }, 'Invalid access code provided')
      const error = new Error("Code d'accès incorrect")
      ;(error as any).code = ANIMATION_ERRORS.ACCESS_DENIED
      throw error
    }

    return true
  }

  /**
   * Duplicate an existing animation
   * Creates a copy with new name, slug, and draft status
   * @param animationId - The animation ID to duplicate
   * @param userId - The user ID making the request
   * @returns The newly created animation copy
   */
  async duplicateAnimation(animationId: string, userId: string): Promise<IAnimation> {
    // Get original animation (validates ownership)
    const original = await this.getAnimationById(animationId, userId)

    // Generate new name and slug
    const newName = `${original.name} (copie)`
    const timestamp = Date.now()
    const newSlug = `${original.slug}-copy-${timestamp}`

    // Create copy object - exclude system fields and regeneratable fields
    const copyData: Partial<IAnimation> = {
      userId: new mongoose.Types.ObjectId(userId),
      name: newName,
      slug: newSlug,
      description: original.description,
      status: 'draft', // Always create as draft
      accessConfig: original.accessConfig,
      baseFields: original.baseFields,
      inputCollection: original.inputCollection,
      pipeline: original.pipeline,
      aiModel: original.aiModel,
      emailConfig: original.emailConfig,
      publicDisplayConfig: original.publicDisplayConfig,
      customization: original.customization,
      // Explicitly NOT copying: qrCodeUrl, publishedAt, archivedAt
    }

    // Create the new animation
    const duplicate = await Animation.create(copyData)

    logger.info(
      {
        originalId: animationId,
        duplicateId: duplicate._id.toString(),
        userId,
        newSlug,
      },
      'Animation duplicated successfully'
    )

    return duplicate
  }

  /**
   * Archive an animation
   * Sets status to 'archived' and records archive timestamp
   * @param animationId - The animation ID to archive
   * @param userId - The user ID making the request
   * @returns The archived animation
   */
  async archiveAnimation(animationId: string, userId: string): Promise<IAnimation> {
    // Get animation (validates ownership)
    const animation = await this.getAnimationById(animationId, userId)

    // Update status and archive timestamp
    animation.status = 'archived'
    animation.archivedAt = new Date()

    await animation.save()

    logger.info(
      { animationId, userId },
      'Animation archived successfully'
    )

    return animation
  }

  /**
   * Restore an archived animation
   * Restores to previous status (published if was published, otherwise draft)
   * @param animationId - The animation ID to restore
   * @param userId - The user ID making the request
   * @returns The restored animation
   */
  async restoreAnimation(animationId: string, userId: string): Promise<IAnimation> {
    // Get animation (validates ownership)
    const animation = await this.getAnimationById(animationId, userId)

    // Restore status based on whether it was previously published
    if (animation.publishedAt) {
      animation.status = 'published'
    } else {
      animation.status = 'draft'
    }

    // Clear archive timestamp
    animation.archivedAt = undefined

    await animation.save()

    logger.info(
      { animationId, userId, restoredStatus: animation.status },
      'Animation restored successfully'
    )

    return animation
  }

  /**
   * Delete an animation permanently
   * Cascade deletes: all generations, QR code from blob storage
   * @param animationId - The animation ID to delete
   * @param userId - The user ID making the request
   */
  async deleteAnimation(animationId: string, userId: string): Promise<void> {
    // Get animation (validates ownership)
    const animation = await this.getAnimationById(animationId, userId)

    // 1. Delete all generations associated with this animation
    const deleteResult = await Generation.deleteMany({ animationId: animation._id })
    logger.info(
      { animationId, deletedGenerations: deleteResult.deletedCount },
      'Deleted associated generations'
    )

    // 2. Delete QR code from Azure Blob Storage if exists
    if (animation.qrCodeUrl) {
      await deleteQRCode(animation.qrCodeUrl)
    }

    // 3. Delete the animation document
    await Animation.findByIdAndDelete(animationId)

    logger.info(
      { animationId, userId, slug: animation.slug },
      'Animation deleted permanently'
    )
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
export const animationService = new AnimationService()
