// Animation Validation Service
// Handles slug uniqueness and access code validation

import Animation, { IAnimation } from '@/models/Animation.model'
import { logger } from '@/lib/logger'
import mongoose from 'mongoose'
import { ANIMATION_ERRORS } from './animation.types'

/**
 * Animation validation service
 * Handles validation operations (slug uniqueness, access code)
 */
class AnimationValidationService {
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
   * Validate access code for an animation
   * @param animation - The animation to validate access for
   * @param accessCode - The access code to validate
   * @returns true if access code is valid
   * @throws Error with code ACCESS_DENIED if access code is invalid
   */
  validateAccessCode(animation: IAnimation, accessCode: string): boolean {
    // Check if animation requires code access
    if (animation.accessConfig?.type !== 'code') {
      // No code required - access granted
      return true
    }

    // Validate the access code
    if (animation.accessConfig.code !== accessCode) {
      logger.info({ slug: animation.slug }, 'Invalid access code provided')
      const error = new Error("Code d'accès incorrect")
      ;(error as any).code = ANIMATION_ERRORS.ACCESS_DENIED
      throw error
    }

    return true
  }

  /**
   * Validate animation ownership
   * @param animation - The animation to check
   * @param userId - The user ID to validate
   * @param userRole - The user role (admin bypasses ownership check)
   * @throws Error with code ACCESS_DENIED if user doesn't own the animation and is not admin
   */
  validateOwnership(animation: IAnimation, userId: string, userRole?: string): void {
    // Admin can access all animations
    if (userRole === 'admin') {
      return
    }

    if (animation.userId.toString() !== userId) {
      logger.warn(
        { animationId: animation._id.toString(), userId, ownerId: animation.userId.toString() },
        'Access denied to animation'
      )
      const error = new Error('Accès refusé à cette animation')
      ;(error as any).code = ANIMATION_ERRORS.ACCESS_DENIED
      throw error
    }
  }
}

// Export singleton instance
export const animationValidationService = new AnimationValidationService()
