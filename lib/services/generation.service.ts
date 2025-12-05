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

  /**
   * Get detailed animation statistics for animation details page (Story 5.2 AC3)
   * Includes: totalParticipations, successfulGenerations, failedGenerations,
   * successRate, averageGenerationTime, emailsSent
   * @param animationId - Animation ID
   * @returns AnimationDetailStats object
   */
  async getAnimationDetailStats(animationId: string): Promise<{
    totalParticipations: number
    successfulGenerations: number
    failedGenerations: number
    successRate: number
    averageGenerationTime: number
    emailsSent: number
  }> {
    await connectDatabase()

    // Validate animation ID format
    if (!mongoose.Types.ObjectId.isValid(animationId)) {
      return {
        totalParticipations: 0,
        successfulGenerations: 0,
        failedGenerations: 0,
        successRate: 0,
        averageGenerationTime: 0,
        emailsSent: 0,
      }
    }

    const objectId = new mongoose.Types.ObjectId(animationId)

    // Aggregate to get detailed stats
    const stats = await Generation.aggregate([
      {
        $match: {
          animationId: objectId,
        },
      },
      {
        $group: {
          _id: null,
          totalParticipations: { $sum: 1 },
          successfulGenerations: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          failedGenerations: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] },
          },
          // Calculate average generation time for completed generations
          avgGenerationTime: {
            $avg: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'completed'] },
                    { $ne: ['$completedAt', null] },
                    { $ne: ['$createdAt', null] },
                  ],
                },
                { $divide: [{ $subtract: ['$completedAt', '$createdAt'] }, 1000] },
                null,
              ],
            },
          },
          // Count emails sent successfully
          emailsSent: {
            $sum: { $cond: [{ $eq: ['$emailSent', true] }, 1, 0] },
          },
        },
      },
    ])

    // Default values if no generations
    if (stats.length === 0) {
      return {
        totalParticipations: 0,
        successfulGenerations: 0,
        failedGenerations: 0,
        successRate: 0,
        averageGenerationTime: 0,
        emailsSent: 0,
      }
    }

    const result = stats[0]
    const successRate =
      result.totalParticipations > 0
        ? Math.round((result.successfulGenerations / result.totalParticipations) * 100)
        : 0

    logger.info({
      msg: 'Animation detail stats retrieved',
      animationId,
      totalParticipations: result.totalParticipations,
      successRate,
    })

    return {
      totalParticipations: result.totalParticipations,
      successfulGenerations: result.successfulGenerations,
      failedGenerations: result.failedGenerations,
      successRate,
      averageGenerationTime: Math.round(result.avgGenerationTime || 0),
      emailsSent: result.emailsSent,
    }
  },

  /**
   * Get animation timeline data for chart (Story 5.2 AC4)
   * Returns participations per day for the specified period
   * @param animationId - Animation ID
   * @param period - Time period: '7d' | '30d' | 'all'
   * @returns Timeline data with date and count per day
   */
  async getAnimationTimeline(
    animationId: string,
    period: '7d' | '30d' | 'all' = '30d'
  ): Promise<{
    period: '7d' | '30d' | 'all'
    data: Array<{ date: string; count: number }>
  }> {
    await connectDatabase()

    // Validate animation ID format
    if (!mongoose.Types.ObjectId.isValid(animationId)) {
      return { period, data: [] }
    }

    const objectId = new mongoose.Types.ObjectId(animationId)

    // Calculate date filter based on period
    const matchStage: Record<string, unknown> = { animationId: objectId }
    if (period !== 'all') {
      const daysAgo = period === '7d' ? 7 : 30
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - daysAgo)
      startDate.setHours(0, 0, 0, 0)
      matchStage.createdAt = { $gte: startDate }
    }

    // Aggregate by date
    const timeline = await Generation.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])

    // Transform to output format
    const data = timeline.map((item) => ({
      date: item._id,
      count: item.count,
    }))

    logger.info({
      msg: 'Animation timeline retrieved',
      animationId,
      period,
      dataPoints: data.length,
    })

    return { period, data }
  },
}
