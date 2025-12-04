// Generation Service
// Business logic for creating and managing generations

import mongoose from 'mongoose'
import { connectDatabase } from '@/lib/database'
import Generation, { type IGeneration } from '@/models/Generation.model'
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
}
