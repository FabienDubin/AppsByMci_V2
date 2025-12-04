// Pipeline Orchestrator Service
// Coordinates the full pipeline execution flow from generation creation to result upload

import { logger } from '@/lib/logger'
import { blobStorageService } from '@/lib/blob-storage'
import { generationService } from '@/lib/services/generation.service'
import { executePipeline, PIPELINE_ERRORS } from '@/lib/services/pipeline-executor.service'
import type { IGeneration } from '@/models/Generation.model'
import type { IAnimation } from '@/models/Animation.model'

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
      await generationService.updateGenerationResult(generationId, resultUrl, result.finalPrompt)

      logger.info({
        generationId,
        executionTimeMs: result.executionTimeMs,
        resultUrl,
        finalPromptLength: result.finalPrompt?.length,
      }, 'Pipeline completed successfully')
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
