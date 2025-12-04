// Pipeline Executor Service
// Orchestrates the execution of AI generation pipeline blocks

import { logger } from '@/lib/logger'
import { blobStorageService, CONTAINERS } from '@/lib/blob-storage'
import { generationService, type ParticipantData } from '@/lib/services/generation.service'
import type { IGeneration } from '@/models/Generation.model'
import type { IAnimation, IPipelineBlock } from '@/models/Animation.model'
import { openaiImageService } from '@/lib/services/openai-image.service'
import { googleAIService } from '@/lib/services/google-ai.service'
import { withRetry, isRetryableError } from '@/lib/utils/retry'

/**
 * Pipeline execution context with variables for prompt substitution
 */
export interface ExecutionContext {
  nom: string
  prenom: string
  email: string
  [key: string]: string | number // Dynamic question answers
}

/**
 * Block execution result
 */
export interface BlockResult {
  blockId: string
  success: boolean
  imageBuffer?: Buffer
  error?: string
}

/**
 * Pipeline execution result
 */
export interface PipelineResult {
  success: boolean
  finalImageBuffer?: Buffer
  error?: {
    code: string
    message: string
  }
  blockResults: BlockResult[]
  executionTimeMs: number
}

/**
 * Error codes for pipeline execution
 */
export const PIPELINE_ERRORS = {
  TIMEOUT: 'GEN_5002',
  API_ERROR: 'GEN_5003',
  UNSUPPORTED_MODEL: 'GEN_5004',
  INVALID_CONFIG: 'GEN_5005',
} as const

/**
 * Pipeline execution timeout (120 seconds)
 */
const PIPELINE_TIMEOUT_MS = 120000

/**
 * Build execution context from participant data
 * Creates variables for prompt substitution: {nom}, {prenom}, {email}, {question1}, etc.
 */
export function buildExecutionContext(participantData: ParticipantData): ExecutionContext {
  const context: ExecutionContext = {
    nom: participantData.nom || '',
    prenom: participantData.prenom || '',
    email: participantData.email || '',
  }

  // Add answers as indexed variables: question1, question2, etc.
  // Also add by elementId: answer_<elementId>
  if (participantData.answers) {
    participantData.answers.forEach((answer, index) => {
      const value = String(answer.value)
      context[`question${index + 1}`] = value
      context[`answer_${answer.elementId}`] = value
    })
  }

  return context
}

/**
 * Replace variables in text with values from context
 * Supports {nom}, {prenom}, {email}, {question1}, {answer_elementId}, etc.
 * Unknown variables are replaced with empty string
 */
export function replaceVariables(text: string, context: ExecutionContext): string {
  return text.replace(/\{(\w+)\}/g, (_match, key) => {
    const value = context[key]
    if (value !== undefined) {
      return String(value)
    }
    // Unknown variable - replace with empty string
    logger.warn({ variable: key }, 'Unknown variable in prompt, replaced with empty string')
    return ''
  })
}

/**
 * Download selfie from Azure Blob Storage
 */
async function downloadSelfie(selfieUrl: string): Promise<Buffer | null> {
  try {
    // Extract blob name from URL
    // URL format: https://<account>.blob.core.windows.net/uploads/selfies/<generationId>.jpg
    const urlObj = new URL(selfieUrl)
    const pathParts = urlObj.pathname.split('/')
    // Path: /uploads/selfies/<generationId>.jpg
    if (pathParts[1] === 'uploads') {
      const blobName = pathParts.slice(2).join('/')
      return await blobStorageService.downloadFile(CONTAINERS.UPLOADS, blobName)
    }
    logger.error({ selfieUrl }, 'Invalid selfie URL format')
    return null
  } catch (error) {
    logger.error({ error, selfieUrl }, 'Failed to download selfie')
    return null
  }
}

/**
 * Execute a single AI generation block
 */
async function executeAIBlock(
  block: IPipelineBlock,
  context: ExecutionContext,
  selfieBuffer: Buffer | null,
  previousBlockResult: Buffer | null
): Promise<BlockResult> {
  const { config } = block
  const modelId = config.modelId

  if (!modelId || !config.promptTemplate) {
    return {
      blockId: block.id,
      success: false,
      error: 'Missing modelId or promptTemplate in block config',
    }
  }

  // Replace variables in prompt
  const prompt = replaceVariables(config.promptTemplate, context)

  logger.info({
    blockId: block.id,
    modelId,
    promptLength: prompt.length,
    imageUsageMode: config.imageUsageMode,
    imageSource: config.imageSource,
  }, 'Executing AI block')

  // Determine image source
  let sourceImage: Buffer | null = null
  if (config.imageUsageMode !== 'none') {
    switch (config.imageSource) {
      case 'selfie':
        sourceImage = selfieBuffer
        break
      case 'ai-block-output':
        sourceImage = previousBlockResult
        break
      case 'url':
        // TODO: Download from URL if needed
        break
    }
  }

  try {
    let imageBuffer: Buffer

    // Execute based on model
    switch (modelId) {
      case 'gpt-image-1':
        // GPT Image 1: Supports text-to-image, reference, and edit modes
        if (config.imageUsageMode === 'edit' && sourceImage) {
          imageBuffer = await withRetry(
            () => openaiImageService.editImage(sourceImage!, prompt, { size: '1024x1024' }),
            { maxRetries: 3, baseDelayMs: 2000, shouldRetry: isRetryableError }
          )
        } else {
          // Text-to-image mode
          imageBuffer = await withRetry(
            () => openaiImageService.generateImage(prompt, { size: '1024x1024' }),
            { maxRetries: 3, baseDelayMs: 2000, shouldRetry: isRetryableError }
          )
        }
        break

      case 'gemini-2.5-flash-image':
        // Gemini 2.5 Flash Image: Supports text-to-image AND image-to-image with reference
        imageBuffer = await withRetry(
          () => googleAIService.generateImageWithGemini(prompt, {
            referenceImage: sourceImage || undefined,
          }),
          { maxRetries: 3, baseDelayMs: 2000, shouldRetry: isRetryableError }
        )
        break

      default:
        logger.error({ modelId }, 'Unsupported AI model')
        return {
          blockId: block.id,
          success: false,
          error: `Unsupported model: ${modelId}`,
        }
    }

    logger.info({
      blockId: block.id,
      modelId,
      imageSize: imageBuffer.length,
    }, 'AI block executed successfully')

    return {
      blockId: block.id,
      success: true,
      imageBuffer,
    }
  } catch (error: any) {
    logger.error({
      blockId: block.id,
      modelId,
      error: error.message,
    }, 'AI block execution failed')

    return {
      blockId: block.id,
      success: false,
      error: error.message,
    }
  }
}

/**
 * Execute the full pipeline for a generation
 * Orchestrates block execution, handles chaining, timeout, and error handling
 */
export async function executePipeline(
  generation: IGeneration,
  animation: IAnimation
): Promise<PipelineResult> {
  const startTime = Date.now()
  const generationId = generation._id.toString()
  const blockResults: BlockResult[] = []

  logger.info({
    generationId,
    animationId: animation._id.toString(),
    blockCount: animation.pipeline.length,
  }, 'Starting pipeline execution')

  try {
    // Update status to processing
    await generationService.updateGenerationStatus(generationId, 'processing')

    // Build execution context
    const context = buildExecutionContext(generation.participantData as ParticipantData)

    // Load selfie if present
    let selfieBuffer: Buffer | null = null
    if (generation.selfieUrl) {
      selfieBuffer = await downloadSelfie(generation.selfieUrl)
      logger.info({ generationId, hasSelfie: !!selfieBuffer }, 'Selfie loaded')
    }

    // Get AI generation blocks sorted by order
    const aiBlocks = animation.pipeline
      .filter(block => block.type === 'ai-generation')
      .sort((a, b) => a.order - b.order)

    if (aiBlocks.length === 0) {
      return {
        success: false,
        error: {
          code: PIPELINE_ERRORS.INVALID_CONFIG,
          message: 'No AI generation blocks configured in pipeline',
        },
        blockResults,
        executionTimeMs: Date.now() - startTime,
      }
    }

    // Execute blocks sequentially with timeout
    let previousResult: Buffer | null = null

    for (const block of aiBlocks) {
      // Check timeout
      const elapsed = Date.now() - startTime
      if (elapsed >= PIPELINE_TIMEOUT_MS) {
        logger.error({
          generationId,
          elapsed,
          timeout: PIPELINE_TIMEOUT_MS,
        }, 'Pipeline execution timeout')

        return {
          success: false,
          error: {
            code: PIPELINE_ERRORS.TIMEOUT,
            message: 'Timeout de génération dépassé (120s)',
          },
          blockResults,
          executionTimeMs: elapsed,
        }
      }

      // Execute block
      const result = await executeAIBlock(block, context, selfieBuffer, previousResult)
      blockResults.push(result)

      if (!result.success) {
        // Block failed - stop pipeline
        return {
          success: false,
          error: {
            code: PIPELINE_ERRORS.API_ERROR,
            message: result.error || 'AI generation failed',
          },
          blockResults,
          executionTimeMs: Date.now() - startTime,
        }
      }

      // Pass result to next block (for chaining)
      previousResult = result.imageBuffer || null
    }

    // Pipeline completed successfully
    const executionTimeMs = Date.now() - startTime

    logger.info({
      generationId,
      executionTimeMs,
      blocksExecuted: blockResults.length,
    }, 'Pipeline execution completed successfully')

    return {
      success: true,
      finalImageBuffer: previousResult || undefined,
      blockResults,
      executionTimeMs,
    }
  } catch (error: any) {
    const executionTimeMs = Date.now() - startTime

    logger.error({
      generationId,
      executionTimeMs,
      error: error.message,
      stack: error.stack,
    }, 'Pipeline execution failed with unexpected error')

    return {
      success: false,
      error: {
        code: PIPELINE_ERRORS.API_ERROR,
        message: error.message || 'Unexpected pipeline error',
      },
      blockResults,
      executionTimeMs,
    }
  }
}

/**
 * Pipeline executor service object
 */
export const pipelineExecutorService = {
  executePipeline,
  buildExecutionContext,
  replaceVariables,
}
