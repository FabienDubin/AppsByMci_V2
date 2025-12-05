// Animation Service - Facade
// Re-exports modular services for backward compatibility
// All functionality is now in lib/services/animation/

import { IAnimation } from '@/models/Animation.model'
import type { UpdateAnimation } from '@/lib/schemas/animation.schema'
import {
  animationQueryService,
  animationMutationService,
  animationValidationService,
} from '@/lib/services/animation'
import type { AnimationResponse, AnimationListOptions, AnimationListResult } from '@/lib/services/animation'

// Re-export types for backward compatibility
export type { AnimationResponse } from '@/lib/services/animation'

/**
 * Unified Animation Service (facade)
 * Maintains backward compatibility with existing code
 * Delegates to specialized services internally
 */
export class AnimationService {
  // Validation operations
  async validateSlugUnique(slug: string, excludeId?: string): Promise<boolean> {
    return animationValidationService.validateSlugUnique(slug, excludeId)
  }

  async validateAccessCode(slug: string, accessCode: string): Promise<boolean> {
    const animation = await animationQueryService.getPublishedAnimationBySlug(slug)
    return animationValidationService.validateAccessCode(animation, accessCode)
  }

  // Query operations
  async getAnimationById(animationId: string, userId: string, userRole?: string): Promise<IAnimation> {
    return animationQueryService.getAnimationById(animationId, userId, userRole)
  }

  async listAnimations(userId: string, options: AnimationListOptions = {}): Promise<AnimationListResult> {
    return animationQueryService.listAnimations(userId, options)
  }

  async listAllAnimations(options: AnimationListOptions = {}): Promise<AnimationListResult> {
    return animationQueryService.listAllAnimations(options)
  }

  async getPublishedAnimationBySlug(slug: string): Promise<IAnimation> {
    return animationQueryService.getPublishedAnimationBySlug(slug)
  }

  toAnimationResponse(animation: IAnimation): AnimationResponse {
    return animationQueryService.toAnimationResponse(animation)
  }

  // Mutation operations
  async createDraft(
    userId: string,
    data: { name: string; description?: string; slug: string }
  ): Promise<IAnimation> {
    return animationMutationService.createDraft(userId, data)
  }

  async updateAnimation(
    animationId: string,
    userId: string,
    data: UpdateAnimation,
    userRole?: string
  ): Promise<IAnimation> {
    return animationMutationService.updateAnimation(animationId, userId, data, userRole)
  }

  async createAnimation(
    userId: string,
    data: Partial<IAnimation>,
    status: 'draft' | 'published' = 'draft'
  ): Promise<IAnimation> {
    return animationMutationService.createAnimation(userId, data, status)
  }

  async publishAnimation(animationId: string, userId: string, userRole?: string): Promise<IAnimation> {
    return animationMutationService.publishAnimation(animationId, userId, userRole)
  }

  async saveDraft(
    animationId: string,
    userId: string,
    data: Partial<IAnimation>,
    userRole?: string
  ): Promise<IAnimation> {
    return animationMutationService.saveDraft(animationId, userId, data, userRole)
  }

  async duplicateAnimation(animationId: string, userId: string, userRole?: string): Promise<IAnimation> {
    return animationMutationService.duplicateAnimation(animationId, userId, userRole)
  }

  async archiveAnimation(animationId: string, userId: string, userRole?: string): Promise<IAnimation> {
    return animationMutationService.archiveAnimation(animationId, userId, userRole)
  }

  async restoreAnimation(animationId: string, userId: string, userRole?: string): Promise<IAnimation> {
    return animationMutationService.restoreAnimation(animationId, userId, userRole)
  }

  async deleteAnimation(animationId: string, userId: string, userRole?: string): Promise<void> {
    return animationMutationService.deleteAnimation(animationId, userId, userRole)
  }

  async incrementStats(animationId: string, type: 'success' | 'failure'): Promise<void> {
    return animationMutationService.incrementStats(animationId, type)
  }
}

// Export singleton instance (backward compatible)
export const animationService = new AnimationService()
