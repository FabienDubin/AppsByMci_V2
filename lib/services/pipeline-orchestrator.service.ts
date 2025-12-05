// Pipeline Orchestrator Service
// Coordinates the full pipeline execution flow from generation creation to result upload
// Story 4.7: Added email sending after successful generation

import { logger } from '@/lib/logger'
import { blobStorageService } from '@/lib/blob-storage'
import { generationService } from '@/lib/services/generation.service'
import { executePipeline, PIPELINE_ERRORS } from '@/lib/services/pipeline-executor.service'
import { emailService } from '@/lib/services/email.service'
import type { IGeneration } from '@/models/Generation.model'
import type { IAnimation } from '@/models/Animation.model'

/**
 * Send email asynchronously (fire-and-forget pattern)
 * Story 4.7 AC1, AC10: Non-blocking email send after successful generation
 *
 * @param generation - Updated generation document with result URL
 * @param animation - Animation document with email config
 */
function sendEmailAsync(generation: IGeneration, animation: IAnimation): void {
  const generationId = generation._id.toString()

  // Fire-and-forget: don't await, handle result in .then/.catch
  emailService
    .sendGenerationResult(generation, animation)
    .then(async (result) => {
      // Update email status in generation document (AC4, AC5)
      if (result.success) {
        await generationService.updateEmailStatus(generationId, true)
      } else if (result.error) {
        await generationService.updateEmailStatus(generationId, false, result.error)
      }
    })
    .catch(async (error) => {
      // Unexpected error - log and update status
      logger.error(
        {
          generationId,
          error: error.message,
        },
        'Unexpected error in async email send'
      )
      await generationService.updateEmailStatus(generationId, false, {
        code: 'EMAIL_ASYNC_ERROR',
        message: error.message || 'Unexpected async email error',
      })
    })
}

/**
 * Run the complete pipeline for a generation
 * This is called asynchronously after the generation is created
 *
 * @param generation - The generation document
 * @param animation - The animation document with pipeline configuration
 */
export async function runPipelineForGeneration(
  generation: IGeneration,
  animation: IAnimation
): Promise<void> {
  const generationId = generation._id.toString()

  logger.info({
    generationId,
    animationId: animation._id.toString(),
  }, 'Starting pipeline orchestration')

  try {
    // Execute the pipeline
    const result = await executePipeline(generation, animation)

    if (result.success && result.finalImageBuffer) {
      // Upload result to Azure Blob Storage
      const resultUrl = await blobStorageService.uploadResult(
        result.finalImageBuffer,
        generationId
      )

      // Update generation with result and final prompt
      const updatedGeneration = await generationService.updateGenerationResult(
        generationId,
        resultUrl,
        result.finalPrompt
      )

      logger.info({
        generationId,
        executionTimeMs: result.executionTimeMs,
        resultUrl,
        finalPromptLength: result.finalPrompt?.length,
      }, 'Pipeline completed successfully')

      // Story 4.7 AC1, AC10: Send email asynchronously (fire-and-forget)
      // Email sending is non-blocking to ensure result display is not delayed
      if (updatedGeneration) {
        sendEmailAsync(updatedGeneration, animation)
      }
    } else {
      // Pipeline failed
      const errorCode = result.error?.code || PIPELINE_ERRORS.API_ERROR
      const errorMessage = result.error?.message || 'Pipeline execution failed'

      await generationService.updateGenerationError(
        generationId,
        errorCode,
        errorMessage
      )

      logger.error({
        generationId,
        executionTimeMs: result.executionTimeMs,
        errorCode,
        errorMessage,
        blockResults: result.blockResults,
      }, 'Pipeline failed')
    }
  } catch (error: any) {
    // Unexpected error during orchestration
    logger.error({
      generationId,
      error: error.message,
      stack: error.stack,
    }, 'Pipeline orchestration failed with unexpected error')

    await generationService.updateGenerationError(
      generationId,
      PIPELINE_ERRORS.API_ERROR,
      error.message || 'Unexpected error during pipeline execution'
    )
  }
}

/**
 * Pipeline orchestrator service object
 */
export const pipelineOrchestratorService = {
  runPipelineForGeneration,
}
