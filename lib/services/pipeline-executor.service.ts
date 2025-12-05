// Pipeline Executor Service
// Orchestrates the execution of AI generation pipeline blocks
// Story 4.9: Multi-image reference support

import { logger } from '@/lib/logger'
import { blobStorageService, CONTAINERS } from '@/lib/blob-storage'
import { generationService, type ParticipantData } from '@/lib/services/generation.service'
import type { IGeneration } from '@/models/Generation.model'
import type { IAnimation, IPipelineBlock, IInputElement } from '@/models/Animation.model'
import type { IQuizScoringConfig, IScoringProfile } from '@/models/animation/pipeline.types'
import { openaiImageService } from '@/lib/services/openai-image.service'
import { googleAIService } from '@/lib/services/google-ai.service'
import { withRetry, isRetryableError } from '@/lib/utils/retry'
import { PIPELINE_ERROR_CODES } from '@/lib/constants'
import type { ReferenceImage, AspectRatio } from '@/lib/types'

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
  prompt?: string // Final prompt sent to AI after variable substitution
  error?: string
}

/**
 * Pipeline execution result
 */
export interface PipelineResult {
  success: boolean
  finalImageBuffer?: Buffer
  finalPrompt?: string // Final prompt sent to AI after variable substitution
  error?: {
    code: string
    message: string
  }
  blockResults: BlockResult[]
  executionTimeMs: number
}

/**
 * Error codes for pipeline execution
 * Re-export from constants for backward compatibility
 */
export const PIPELINE_ERRORS = PIPELINE_ERROR_CODES

/**
 * Resolved reference image with buffer
 */
export interface ResolvedImage {
  name: string
  source: string
  buffer: Buffer
  sizeBytes: number
}

/**
 * Reference image logging info (AC9)
 */
export interface ReferenceImageLogInfo {
  name: string
  source: string
  sizeBytes: number
}

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
 * Replace image variable placeholders with "Image N" based on order (AC2)
 * E.g., {selfie} → "Image 1", {logo} → "Image 2", {fond} → "Image 3"
 *
 * @param text - Text containing image variable placeholders
 * @param referenceImages - Array of reference images sorted by order
 * @returns Text with image variables replaced
 */
export function replaceImageVariables(text: string, referenceImages: ReferenceImage[]): string {
  if (!referenceImages || referenceImages.length === 0) {
    return text
  }

  // Sort by order to ensure consistent mapping
  const sortedImages = [...referenceImages].sort((a, b) => a.order - b.order)

  // Create mapping: name → "Image N"
  const imageMapping: Record<string, string> = {}
  sortedImages.forEach((img, index) => {
    imageMapping[img.name.toLowerCase()] = `Image ${index + 1}`
  })

  // Replace {imageName} with "Image N"
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    const lowerKey = key.toLowerCase()
    if (imageMapping[lowerKey]) {
      return imageMapping[lowerKey]
    }
    // Not an image variable, return as-is for replaceVariables to handle
    return match
  })
}

/**
 * Download image from external URL
 */
async function downloadFromUrl(url: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download image: HTTP ${response.status}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Resolve all reference images and return ordered buffers (AC1, AC7, AC8)
 *
 * @param referenceImages - Array of reference image configurations
 * @param generation - Generation document with selfieUrl
 * @param blockResults - Map of previous block results for ai-block-output source
 * @returns Array of resolved images with buffers, sorted by order
 */
export async function resolveReferenceImages(
  referenceImages: ReferenceImage[],
  generation: IGeneration,
  blockResults: Map<string, Buffer>
): Promise<ResolvedImage[]> {
  if (!referenceImages || referenceImages.length === 0) {
    return []
  }

  const downloadStartTime = Date.now()
  const resolvedImages: ResolvedImage[] = []

  // Sort by order first
  const sortedImages = [...referenceImages].sort((a, b) => a.order - b.order)

  for (const refImage of sortedImages) {
    try {
      let buffer: Buffer

      switch (refImage.source) {
        case 'selfie':
          // AC8: Selfie required but missing
          if (!generation.selfieUrl) {
            throw {
              code: PIPELINE_ERRORS.SELFIE_REQUIRED_MISSING,
              message: `Selfie requis mais non fourni par le participant`,
            }
          }
          // Download selfie from Azure Blob Storage
          const selfieUrl = new URL(generation.selfieUrl)
          const selfiePath = selfieUrl.pathname.split('/')
          if (selfiePath[1] === 'uploads') {
            const blobName = selfiePath.slice(2).join('/')
            buffer = await blobStorageService.downloadFile(CONTAINERS.UPLOADS, blobName)
          } else {
            // Fallback to direct URL download
            buffer = await downloadFromUrl(generation.selfieUrl)
          }
          break

        case 'upload':
          // Download from Azure Blob Storage (uploaded during config)
          if (!refImage.url) {
            throw {
              code: PIPELINE_ERRORS.REFERENCE_IMAGE_NOT_FOUND,
              message: `Impossible de charger l'image de référence '${refImage.name}': URL manquante`,
            }
          }
          const uploadUrl = new URL(refImage.url)
          const uploadPath = uploadUrl.pathname.split('/')
          if (uploadPath[1] === 'uploads') {
            const blobName = uploadPath.slice(2).join('/')
            buffer = await blobStorageService.downloadFile(CONTAINERS.UPLOADS, blobName)
          } else {
            buffer = await downloadFromUrl(refImage.url)
          }
          break

        case 'url':
          // Download from external URL
          if (!refImage.url) {
            throw {
              code: PIPELINE_ERRORS.REFERENCE_IMAGE_NOT_FOUND,
              message: `Impossible de charger l'image de référence '${refImage.name}': URL manquante`,
            }
          }
          buffer = await downloadFromUrl(refImage.url)
          break

        case 'ai-block-output':
          // Get from previous block result (AC6)
          if (!refImage.sourceBlockId) {
            throw {
              code: PIPELINE_ERRORS.REFERENCE_IMAGE_NOT_FOUND,
              message: `Impossible de charger l'image de référence '${refImage.name}': sourceBlockId manquant`,
            }
          }
          const previousBuffer = blockResults.get(refImage.sourceBlockId)
          if (!previousBuffer) {
            throw {
              code: PIPELINE_ERRORS.REFERENCE_IMAGE_NOT_FOUND,
              message: `Impossible de charger l'image de référence '${refImage.name}': bloc source '${refImage.sourceBlockId}' non trouvé`,
            }
          }
          buffer = previousBuffer
          break

        default:
          throw {
            code: PIPELINE_ERRORS.REFERENCE_IMAGE_NOT_FOUND,
            message: `Impossible de charger l'image de référence '${refImage.name}': source inconnue '${refImage.source}'`,
          }
      }

      resolvedImages.push({
        name: refImage.name,
        source: refImage.source,
        buffer,
        sizeBytes: buffer.length,
      })
    } catch (error: any) {
      // AC7: Log error and rethrow with proper code
      logger.error({
        refImageName: refImage.name,
        refImageSource: refImage.source,
        error: error.message || error,
      }, 'Failed to resolve reference image')

      if (error.code) {
        throw error
      }

      throw {
        code: PIPELINE_ERRORS.REFERENCE_IMAGE_NOT_FOUND,
        message: `Impossible de charger l'image de référence '${refImage.name}': ${error.message || 'Erreur inconnue'}`,
      }
    }
  }

  const downloadTimeMs = Date.now() - downloadStartTime

  // AC9: Log resolved images info
  logger.info({
    referenceImagesCount: resolvedImages.length,
    referenceImages: resolvedImages.map(img => ({
      name: img.name,
      source: img.source,
      sizeBytes: img.sizeBytes,
    })),
    downloadTimeMs,
  }, 'Reference images resolved')

  return resolvedImages
}

/**
 * Quiz Scoring result with calculated profile
 */
export interface QuizScoringResult {
  blockName: string
  winnerProfile: IScoringProfile
  scores: Record<string, number>
}

/**
 * Execute a quiz scoring block to calculate the winning profile
 * Counts profile key occurrences from selected questions and determines winner
 * In case of tie: alphabetical order wins
 *
 * @param block - The quiz-scoring pipeline block
 * @param participantData - Participant's answers
 * @param choiceQuestions - All choice questions from animation
 * @returns Quiz scoring result with winner and scores
 */
export function executeQuizScoringBlock(
  block: IPipelineBlock,
  participantData: ParticipantData,
  _choiceQuestions: IInputElement[] // Available for future validation
): QuizScoringResult | null {
  const config = block.config?.quizScoring as IQuizScoringConfig | undefined

  if (!config || !config.name) {
    logger.warn({ blockId: block.id }, 'Quiz scoring block missing configuration')
    return null
  }

  const { name, selectedQuestionIds, questionMappings, profiles } = config

  if (!selectedQuestionIds || selectedQuestionIds.length === 0) {
    logger.warn({ blockId: block.id, name }, 'Quiz scoring block has no selected questions')
    return null
  }

  if (!profiles || profiles.length < 2) {
    logger.warn({ blockId: block.id, name }, 'Quiz scoring block has less than 2 profiles')
    return null
  }

  // Initialize scores for all profiles
  const scores: Record<string, number> = {}
  for (const profile of profiles) {
    scores[profile.key] = 0
  }

  // Process each selected question
  for (const questionId of selectedQuestionIds) {
    // Find the participant's answer for this question
    const answer = participantData.answers?.find((a) => a.elementId === questionId)
    if (!answer) {
      logger.debug({ questionId, name }, 'No answer found for question in quiz scoring')
      continue
    }

    // Find the mapping for this question
    const mapping = questionMappings?.find((m) => m.elementId === questionId)
    if (!mapping) {
      logger.warn({ questionId, name }, 'No mapping found for question in quiz scoring')
      continue
    }

    // Find the profile key for this answer
    const optionMapping = mapping.optionMappings?.find(
      (om) => om.optionText === String(answer.value)
    )
    if (!optionMapping) {
      logger.warn(
        { questionId, answerValue: answer.value, name },
        'No option mapping found for answer in quiz scoring'
      )
      continue
    }

    // Increment the score for this profile key
    const profileKey = optionMapping.profileKey
    if (scores[profileKey] !== undefined) {
      scores[profileKey]++
    } else {
      logger.warn(
        { profileKey, name },
        'Profile key from mapping not found in profiles definition'
      )
    }
  }

  // Determine winner (highest score, alphabetical order for ties)
  let winnerKey: string | null = null
  let maxScore = -1

  const sortedKeys = Object.keys(scores).sort() // Alphabetical order
  for (const key of sortedKeys) {
    if (scores[key] > maxScore) {
      maxScore = scores[key]
      winnerKey = key
    }
  }

  if (!winnerKey) {
    logger.error({ name, scores }, 'Could not determine winner in quiz scoring')
    return null
  }

  const winnerProfile = profiles.find((p) => p.key === winnerKey)
  if (!winnerProfile) {
    logger.error({ winnerKey, name }, 'Winner profile not found in profiles definition')
    return null
  }

  logger.info(
    {
      blockId: block.id,
      name,
      scores,
      winnerKey,
      winnerName: winnerProfile.name,
    },
    'Quiz scoring block executed successfully'
  )

  return {
    blockName: name,
    winnerProfile,
    scores,
  }
}

/**
 * Enrich execution context with quiz scoring results
 * Adds variables prefixed with block name: {name}_profile_key, {name}_profile_name, etc.
 *
 * @param context - Execution context to enrich
 * @param scoringResult - Quiz scoring result
 */
export function enrichContextWithScoringResult(
  context: ExecutionContext,
  scoringResult: QuizScoringResult
): void {
  const prefix = scoringResult.blockName

  context[`${prefix}_profile_key`] = scoringResult.winnerProfile.key
  context[`${prefix}_profile_name`] = scoringResult.winnerProfile.name
  context[`${prefix}_profile_description`] = scoringResult.winnerProfile.description
  context[`${prefix}_profile_image_style`] = scoringResult.winnerProfile.imageStyle
  context[`${prefix}_profile_scores`] = JSON.stringify(scoringResult.scores)

  logger.debug(
    {
      prefix,
      variables: [
        `${prefix}_profile_key`,
        `${prefix}_profile_name`,
        `${prefix}_profile_description`,
        `${prefix}_profile_image_style`,
        `${prefix}_profile_scores`,
      ],
    },
    'Context enriched with quiz scoring variables'
  )
}

/**
 * Execute a single AI generation block (Story 4.9 - Multi-image support)
 * Supports AC1-AC9: reference images, prompt variable substitution, multi-model support
 */
async function executeAIBlock(
  block: IPipelineBlock,
  context: ExecutionContext,
  generation: IGeneration,
  blockResults: Map<string, Buffer>
): Promise<BlockResult> {
  const { config } = block
  const modelId = config.modelId
  const apiStartTime = Date.now()

  if (!modelId || !config.promptTemplate) {
    return {
      blockId: block.id,
      success: false,
      error: 'Missing modelId or promptTemplate in block config',
    }
  }

  // Get reference images from config (Story 4.8 format)
  const referenceImages: ReferenceImage[] = config.referenceImages || []
  const aspectRatio: AspectRatio = config.aspectRatio || '1:1'

  try {
    // AC1: Resolve all reference images
    const resolvedImages = await resolveReferenceImages(
      referenceImages,
      generation,
      blockResults
    )

    // AC2: Replace image variables in prompt ({selfie} → "Image 1", etc.)
    let processedPrompt = replaceImageVariables(config.promptTemplate, referenceImages)

    // Replace participant variables ({nom}, {prenom}, etc.)
    processedPrompt = replaceVariables(processedPrompt, context)

    // Get image buffers for API call
    const imageBuffers = resolvedImages.map(img => img.buffer)

    // AC9: Detailed logging
    logger.info({
      blockId: block.id,
      modelId,
      aspectRatio,
      promptLength: processedPrompt.length,
      referenceImagesCount: resolvedImages.length,
      referenceImages: resolvedImages.map(img => ({
        name: img.name,
        source: img.source,
        sizeBytes: img.sizeBytes,
      })),
    }, 'Executing AI block')

    let imageBuffer: Buffer

    // Execute based on model (AC3, AC4, AC5)
    switch (modelId) {
      case 'gpt-image-1':
        // AC3 & AC5: GPT Image 1
        if (imageBuffers.length > 0) {
          // Image-to-image with reference images
          // OpenAI only supports '1:1', '2:3', '3:2' - cast type for compatibility
          const openaiAspectRatio = aspectRatio as '1:1' | '2:3' | '3:2'
          imageBuffer = await withRetry(
            () => openaiImageService.editImage(imageBuffers, processedPrompt, { aspectRatio: openaiAspectRatio }),
            { maxRetries: 3, baseDelayMs: 2000, shouldRetry: isRetryableError }
          )
        } else {
          // AC5: Text-to-image mode (no reference images)
          imageBuffer = await withRetry(
            () => openaiImageService.generateImage(processedPrompt, { size: '1024x1024' }),
            { maxRetries: 3, baseDelayMs: 2000, shouldRetry: isRetryableError }
          )
        }
        break

      case 'gemini-2.5-flash-image':
        // AC4 & AC5: Gemini 2.5 Flash Image
        imageBuffer = await withRetry(
          () => googleAIService.generateImageWithGemini(processedPrompt, {
            referenceImages: imageBuffers.length > 0 ? imageBuffers : undefined,
            aspectRatio,
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

    const apiCallTimeMs = Date.now() - apiStartTime

    // AC6: Store result for chaining
    blockResults.set(block.id, imageBuffer)

    // AC9: Detailed success logging
    logger.info({
      blockId: block.id,
      modelId,
      aspectRatio,
      imageSize: imageBuffer.length,
      referenceImagesCount: resolvedImages.length,
      apiCallTimeMs,
    }, 'AI block executed successfully')

    return {
      blockId: block.id,
      success: true,
      imageBuffer,
      prompt: processedPrompt,
    }
  } catch (error: any) {
    // Handle structured errors (AC7, AC8)
    const errorCode = error.code || PIPELINE_ERRORS.API_ERROR
    const errorMessage = error.message || 'AI generation failed'

    logger.error({
      blockId: block.id,
      modelId,
      errorCode,
      error: errorMessage,
    }, 'AI block execution failed')

    return {
      blockId: block.id,
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Execute the full pipeline for a generation
 * Orchestrates block execution, handles chaining, timeout, and error handling
 * Story 4.9: Updated to use blockResults Map for multi-image chaining
 */
export async function executePipeline(
  generation: IGeneration,
  animation: IAnimation
): Promise<PipelineResult> {
  const startTime = Date.now()
  const generationId = generation._id.toString()
  const blockResultsList: BlockResult[] = []
  // AC6: Map to store block results for chaining
  const blockResultsMap = new Map<string, Buffer>()

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

    // Get choice questions for quiz scoring
    const choiceQuestions = (animation.inputCollection?.elements || []).filter(
      (el) => el.type === 'choice'
    )

    // Execute quiz-scoring blocks first to enrich context
    const scoringBlocks = animation.pipeline
      .filter((block) => block.blockName === 'quiz-scoring')
      .sort((a, b) => a.order - b.order)

    for (const scoringBlock of scoringBlocks) {
      const scoringResult = executeQuizScoringBlock(
        scoringBlock,
        generation.participantData as ParticipantData,
        choiceQuestions
      )

      if (scoringResult) {
        enrichContextWithScoringResult(context, scoringResult)
      }
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
        blockResults: blockResultsList,
        executionTimeMs: Date.now() - startTime,
      }
    }

    // Execute blocks sequentially with timeout
    let lastSuccessfulBuffer: Buffer | null = null
    let lastSuccessfulPrompt: string | undefined = undefined

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
          blockResults: blockResultsList,
          executionTimeMs: elapsed,
        }
      }

      // Execute block with new signature (Story 4.9)
      const result = await executeAIBlock(block, context, generation, blockResultsMap)
      blockResultsList.push(result)

      if (!result.success) {
        // Block failed - stop pipeline
        return {
          success: false,
          error: {
            code: PIPELINE_ERRORS.API_ERROR,
            message: result.error || 'AI generation failed',
          },
          blockResults: blockResultsList,
          executionTimeMs: Date.now() - startTime,
        }
      }

      // Track last successful buffer and prompt for final output
      if (result.imageBuffer) {
        lastSuccessfulBuffer = result.imageBuffer
        lastSuccessfulPrompt = result.prompt
      }
    }

    // Pipeline completed successfully
    const executionTimeMs = Date.now() - startTime

    // AC9: Final logging
    logger.info({
      generationId,
      executionTimeMs,
      blocksExecuted: blockResultsList.length,
    }, 'Pipeline execution completed successfully')

    return {
      success: true,
      finalImageBuffer: lastSuccessfulBuffer || undefined,
      finalPrompt: lastSuccessfulPrompt,
      blockResults: blockResultsList,
      executionTimeMs,
    }
  } catch (error: any) {
    const executionTimeMs = Date.now() - startTime

    // Handle structured errors (AC7, AC8)
    const errorCode = error.code || PIPELINE_ERRORS.API_ERROR

    logger.error({
      generationId,
      executionTimeMs,
      errorCode,
      error: error.message,
      stack: error.stack,
    }, 'Pipeline execution failed with unexpected error')

    return {
      success: false,
      error: {
        code: errorCode,
        message: error.message || 'Unexpected pipeline error',
      },
      blockResults: blockResultsList,
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
  replaceImageVariables,
  resolveReferenceImages,
  executeQuizScoringBlock,
  enrichContextWithScoringResult,
}
