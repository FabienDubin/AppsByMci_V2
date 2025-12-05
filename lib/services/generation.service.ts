// Generation Service
// Business logic for creating and managing generations

import mongoose from 'mongoose'
import { connectDatabase } from '@/lib/database'
import Generation, { type IGeneration, type IEmailError } from '@/models/Generation.model'
import { logger } from '@/lib/logger'

/**
 * Participant data structure
 */
export interface ParticipantData {
  nom?: string
  prenom?: string
  email?: string
  answers: Array<{
    elementId: string
    type: 'choice' | 'slider' | 'free-text'
    value: string | number
  }>
}

/**
 * Create generation input
 */
export interface CreateGenerationInput {
  animationId: string
  participantData: ParticipantData
  selfieUrl?: string
}

/**
 * Generation service for managing generation documents
 */
export const generationService = {
  /**
   * Create a new generation document
   * @param input - Generation data
   * @returns Created generation document
   */
  async createGeneration(input: CreateGenerationInput): Promise<IGeneration> {
    await connectDatabase()

    // Validate animation ID format
    if (!mongoose.Types.ObjectId.isValid(input.animationId)) {
      throw new Error('Invalid animation ID format')
    }

    // Create generation document
    const generation = await Generation.create({
      animationId: new mongoose.Types.ObjectId(input.animationId),
      participantData: input.participantData,
      selfieUrl: input.selfieUrl,
      status: 'pending',
    })

    logger.info({
      msg: 'Generation created',
      generationId: generation._id.toString(),
      animationId: input.animationId,
    })

    return generation
  },

  /**
   * Get a generation by ID
   * @param generationId - Generation document ID
   * @returns Generation document or null
   */
  async getGenerationById(generationId: string): Promise<IGeneration | null> {
    await connectDatabase()

    if (!mongoose.Types.ObjectId.isValid(generationId)) {
      return null
    }

    return Generation.findById(generationId)
  },

  /**
   * Update generation status
   * @param generationId - Generation document ID
   * @param status - New status
   * @param error - Optional error message (for failed status)
   * @returns Updated generation or null
   */
  async updateGenerationStatus(
    generationId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    error?: string
  ): Promise<IGeneration | null> {
    await connectDatabase()

    if (!mongoose.Types.ObjectId.isValid(generationId)) {
      return null
    }

    const updateData: Record<string, unknown> = { status }
    if (error) {
      updateData.error = error
    }

    const generation = await Generation.findByIdAndUpdate(
      generationId,
      updateData,
      { new: true }
    )

    if (generation) {
      logger.info({
        msg: 'Generation status updated',
        generationId,
        status,
        error: error || undefined,
      })
    }

    return generation
  },

  /**
   * Update generation with successful result
   * @param generationId - Generation document ID
   * @param resultUrl - URL of the generated image
   * @param finalPrompt - Optional final prompt sent to AI after variable substitution
   * @returns Updated generation or null
   */
  async updateGenerationResult(
    generationId: string,
    resultUrl: string,
    finalPrompt?: string
  ): Promise<IGeneration | null> {
    await connectDatabase()

    if (!mongoose.Types.ObjectId.isValid(generationId)) {
      return null
    }

    const updateData: Record<string, unknown> = {
      status: 'completed',
      generatedImageUrl: resultUrl,
      completedAt: new Date(),
    }

    if (finalPrompt) {
      updateData.finalPrompt = finalPrompt
    }

    const generation = await Generation.findByIdAndUpdate(
      generationId,
      updateData,
      { new: true }
    )

    if (generation) {
      logger.info({
        msg: 'Generation completed',
        generationId,
        resultUrl,
        finalPromptLength: finalPrompt?.length,
      })
    }

    return generation
  },

  /**
   * Update generation with error information
   * @param generationId - Generation document ID
   * @param errorCode - Error code (e.g., GEN_5002)
   * @param errorMessage - Error message
   * @returns Updated generation or null
   */
  async updateGenerationError(
    generationId: string,
    errorCode: string,
    errorMessage: string
  ): Promise<IGeneration | null> {
    await connectDatabase()

    if (!mongoose.Types.ObjectId.isValid(generationId)) {
      return null
    }

    const generation = await Generation.findByIdAndUpdate(
      generationId,
      {
        status: 'failed',
        error: JSON.stringify({ code: errorCode, message: errorMessage }),
      },
      { new: true }
    )

    if (generation) {
      logger.error({
        msg: 'Generation failed',
        generationId,
        errorCode,
        errorMessage,
      })
    }

    return generation
  },

  /**
   * Update email send status for a generation (Story 4.7 AC4, AC5)
   * @param generationId - Generation document ID
   * @param success - Whether email was sent successfully
   * @param error - Optional error details if send failed
   * @returns Updated generation or null
   */
  async updateEmailStatus(
    generationId: string,
    success: boolean,
    error?: IEmailError
  ): Promise<IGeneration | null> {
    await connectDatabase()

    if (!mongoose.Types.ObjectId.isValid(generationId)) {
      return null
    }

    const updateData: Record<string, unknown> = {
      emailSent: success,
    }

    if (success) {
      updateData.emailSentAt = new Date()
      // Clear any previous error
      updateData.emailError = undefined
    } else if (error) {
      updateData.emailError = error
    }

    const generation = await Generation.findByIdAndUpdate(
      generationId,
      updateData,
      { new: true }
    )

    if (generation) {
      logger.info({
        msg: success ? 'Email status updated: sent' : 'Email status updated: failed',
        generationId,
        emailSent: success,
        emailError: error,
      })
    }

    return generation
  },

  /**
   * Get animation statistics (participation count and last activity)
   * Used by dashboard to display stats for each animation (Story 5.1 AC4)
   * @param animationIds - Array of animation IDs
   * @returns Map of animationId -> { participationCount, lastActivity }
   */
  async getAnimationStats(
    animationIds: string[]
  ): Promise<Map<string, { participationCount: number; lastActivity: Date | null }>> {
    await connectDatabase()

    // Convert string IDs to ObjectIds, filtering out invalid ones
    const validObjectIds = animationIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id))

    if (validObjectIds.length === 0) {
      return new Map()
    }

    // Aggregate to get count and last activity per animation
    const stats = await Generation.aggregate([
      {
        $match: {
          animationId: { $in: validObjectIds },
        },
      },
      {
        $group: {
          _id: '$animationId',
          participationCount: { $sum: 1 },
          lastActivity: { $max: '$createdAt' },
        },
      },
    ])

    // Convert array to Map
    const statsMap = new Map<string, { participationCount: number; lastActivity: Date | null }>()

    // Initialize all requested IDs with zero stats
    for (const id of animationIds) {
      statsMap.set(id, { participationCount: 0, lastActivity: null })
    }

    // Update with actual stats from aggregation
    for (const stat of stats) {
      statsMap.set(stat._id.toString(), {
        participationCount: stat.participationCount,
        lastActivity: stat.lastActivity,
      })
    }

    logger.info({
      msg: 'Animation stats retrieved',
      animationCount: animationIds.length,
      statsCount: stats.length,
    })

    return statsMap
  },
}
