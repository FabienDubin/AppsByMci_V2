// Animation Mutation Service
// Handles write operations (create, update, delete, publish, archive)

import Animation, { IAnimation } from '@/models/Animation.model'
import Generation from '@/models/Generation.model'
import { logger } from '@/lib/logger'
import mongoose from 'mongoose'
import { generateAndUploadQRCode, buildPublicUrl, deleteQRCode } from '@/lib/services/qrcode.service'
import type { UpdateAnimation } from '@/lib/schemas/animation.schema'
import { animationValidationService } from './animation-validation.service'
import { animationQueryService } from './animation-query.service'

/**
 * Animation mutation service
 * Handles all write operations for animations
 */
class AnimationMutationService {
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
    await animationValidationService.validateSlugUnique(data.slug)

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
   * Update an existing animation
   * @param animationId - The animation ID to update
   * @param userId - The user ID making the update
   * @param data - Partial animation data to update (from Zod validated schema)
   * @param userRole - The user role (admin bypasses ownership check)
   * @returns Updated animation
   * @throws Error with code NOT_FOUND_3001 if animation not found
   * @throws Error with code AUTH_1003 if user doesn't own the animation
   * @throws Error with code VALIDATION_2002 if slug already exists
   */
  async updateAnimation(
    animationId: string,
    userId: string,
    data: UpdateAnimation,
    userRole?: string
  ): Promise<IAnimation> {
    // Get animation and verify ownership (admin bypasses)
    const animation = await animationQueryService.getAnimationById(animationId, userId, userRole)

    // If slug is being updated, validate uniqueness
    if (data.slug && data.slug !== animation.slug) {
      await animationValidationService.validateSlugUnique(data.slug, animationId)
    }

    // Separate pipeline from other fields - pipeline needs special handling
    const { pipeline: pipelineData, ...otherData } = data

    // Update non-pipeline fields using set() for proper Mongoose change tracking
    // For nested objects (publicDisplayConfig, customization), we need to merge
    // with existing values to preserve fields not being updated
    for (const [key, value] of Object.entries(otherData)) {
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
    if (otherData.publicDisplayConfig) {
      animation.markModified('publicDisplayConfig')
    }
    if (otherData.customization) {
      animation.markModified('customization')
    }

    // Save non-pipeline changes first
    if (Object.keys(otherData).length > 0) {
      await animation.save()
    }

    // Handle pipeline separately using findByIdAndUpdate with $set
    // This bypasses Mongoose schema validation issues with deeply nested objects
    if (pipelineData && Array.isArray(pipelineData)) {
      // Use updateOne with $set to directly set the pipeline array
      // This preserves nested objects like config.referenceImages and config.aspectRatio
      await Animation.updateOne(
        { _id: animationId },
        { $set: { pipeline: pipelineData } }
      )

      // Reload the animation to get the updated pipeline
      const updatedAnimation = await Animation.findById(animationId)
      if (updatedAnimation) {
        logger.info(
          { animationId, userId, updatedFields: Object.keys(data) },
          'Animation updated successfully'
        )

        return updatedAnimation
      }
    }

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
      await animationValidationService.validateSlugUnique(data.slug)
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
   * @param userRole - The user role (admin bypasses ownership check)
   * @returns Published animation with QR code
   * @throws Error if animation not found, not owned by user, or slug already exists
   */
  async publishAnimation(
    animationId: string,
    userId: string,
    userRole?: string
  ): Promise<IAnimation> {
    // Get animation and verify ownership (admin bypasses)
    const animation = await animationQueryService.getAnimationById(animationId, userId, userRole)

    // Validate slug uniqueness for publication (excluding current animation)
    await animationValidationService.validateSlugUnique(animation.slug, animationId)

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
   * @param userRole - The user role (admin bypasses ownership check)
   * @returns Updated animation
   */
  async saveDraft(
    animationId: string,
    userId: string,
    data: Partial<IAnimation>,
    userRole?: string
  ): Promise<IAnimation> {
    // Get animation and verify ownership (admin bypasses)
    const animation = await animationQueryService.getAnimationById(animationId, userId, userRole)

    // If slug is being updated, validate uniqueness
    if (data.slug && data.slug !== animation.slug) {
      await animationValidationService.validateSlugUnique(data.slug, animationId)
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
   * Duplicate an existing animation
   * Creates a copy with new name, slug, and draft status
   * @param animationId - The animation ID to duplicate
   * @param userId - The user ID making the request
   * @param userRole - The user role (admin bypasses ownership check)
   * @returns The newly created animation copy
   */
  async duplicateAnimation(animationId: string, userId: string, userRole?: string): Promise<IAnimation> {
    // Get original animation (validates ownership, admin bypasses)
    const original = await animationQueryService.getAnimationById(animationId, userId, userRole)

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
   * @param userRole - The user role (admin bypasses ownership check)
   * @returns The archived animation
   */
  async archiveAnimation(animationId: string, userId: string, userRole?: string): Promise<IAnimation> {
    // Get animation (validates ownership, admin bypasses)
    const animation = await animationQueryService.getAnimationById(animationId, userId, userRole)

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
   * @param userRole - The user role (admin bypasses ownership check)
   * @returns The restored animation
   */
  async restoreAnimation(animationId: string, userId: string, userRole?: string): Promise<IAnimation> {
    // Get animation (validates ownership, admin bypasses)
    const animation = await animationQueryService.getAnimationById(animationId, userId, userRole)

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
   * @param userRole - The user role (admin bypasses ownership check)
   */
  async deleteAnimation(animationId: string, userId: string, userRole?: string): Promise<void> {
    // Get animation (validates ownership, admin bypasses)
    const animation = await animationQueryService.getAnimationById(animationId, userId, userRole)

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
   * Increment animation statistics atomically
   * @param animationId - The animation ID to update
   * @param type - 'success' for successful generation, 'failure' for failed generation
   */
  async incrementStats(
    animationId: string,
    type: 'success' | 'failure'
  ): Promise<void> {
    try {
      // Build the update operation
      // Always increment totalParticipations
      // Increment successfulGenerations or failedGenerations based on type
      const updateOps: Record<string, number> = {
        'stats.totalParticipations': 1,
      }

      if (type === 'success') {
        updateOps['stats.successfulGenerations'] = 1
      } else {
        updateOps['stats.failedGenerations'] = 1
      }

      // Use $inc for atomic increment
      await Animation.findByIdAndUpdate(
        animationId,
        { $inc: updateOps },
        { new: true }
      )

      logger.info(
        { animationId, type },
        'Animation stats incremented'
      )
    } catch (error) {
      // Log but don't throw - stats update shouldn't break the main flow
      logger.error(
        { animationId, type, error },
        'Failed to increment animation stats'
      )
    }
  }
}

// Export singleton instance
export const animationMutationService = new AnimationMutationService()
