import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import mongoose from 'mongoose'
import { connectDatabase } from '@/lib/database'
import Animation from '@/models/Animation.model'
import { generationService } from '@/lib/services/generation.service'
import { blobStorageService } from '@/lib/blob-storage'
import { checkGenerationRateLimit, recordGenerationSubmission } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

// Generation error codes
const GENERATION_ERRORS = {
  RATE_LIMIT: 'GEN_4001',
  VALIDATION: 'GEN_4002',
  NOT_FOUND: 'GEN_4003',
  INTERNAL: 'GEN_5001',
} as const

// API response helpers
function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

function errorResponse(
  code: string,
  message: string,
  status: number = 400,
  details?: string[]
) {
  const error: { code: string; message: string; details?: string[] } = { code, message }
  if (details) {
    error.details = details
  }
  return NextResponse.json({ success: false, error }, { status })
}

// Zod schema for request body validation
const answerSchema = z.object({
  elementId: z.string().min(1),
  type: z.enum(['choice', 'slider', 'free-text']),
  value: z.union([z.string(), z.number()]),
})

const formDataSchema = z.object({
  nom: z.string().optional(),
  prenom: z.string().optional(),
  email: z.string().email('Format email invalide').optional().or(z.literal('')),
  answers: z.array(answerSchema).default([]),
})

const createGenerationSchema = z.object({
  animationId: z.string().min(1, 'Animation ID requis'),
  formData: formDataSchema,
  selfie: z.string().optional(),
})

/**
 * Get client IP from request
 */
function getClientIp(request: NextRequest): string {
  // Check common headers for proxied requests
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback - use a default for local development
  return '127.0.0.1'
}

/**
 * POST /api/generations
 * Create a new generation request
 */
export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIp = getClientIp(request)

    // Check rate limit (FR37: max 5 requests per minute per IP)
    const rateLimitResult = checkGenerationRateLimit(clientIp)
    if (!rateLimitResult.allowed) {
      logger.warn({ ip: clientIp }, 'Generation rate limit exceeded')
      return errorResponse(
        GENERATION_ERRORS.RATE_LIMIT,
        'Trop de tentatives. Veuillez patienter quelques instants.',
        429
      )
    }

    // Parse request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return errorResponse(
        GENERATION_ERRORS.VALIDATION,
        'Corps de requête invalide',
        400
      )
    }

    // Validate request body with Zod
    const parseResult = createGenerationSchema.safeParse(body)
    if (!parseResult.success) {
      const details = parseResult.error.errors.map(
        (e) => `${e.path.join('.')}: ${e.message}`
      )
      return errorResponse(
        GENERATION_ERRORS.VALIDATION,
        'Données manquantes ou invalides',
        400,
        details
      )
    }

    const { animationId, formData, selfie } = parseResult.data

    // Connect to database
    await connectDatabase()

    // Validate animation exists and is published
    if (!mongoose.Types.ObjectId.isValid(animationId)) {
      return errorResponse(
        GENERATION_ERRORS.NOT_FOUND,
        "Cette animation n'est pas disponible",
        404
      )
    }

    const animation = await Animation.findById(animationId)
    if (!animation) {
      return errorResponse(
        GENERATION_ERRORS.NOT_FOUND,
        "Cette animation n'est pas disponible",
        404
      )
    }

    if (animation.status !== 'published') {
      logger.info(
        { animationId, status: animation.status },
        'Attempt to generate for non-published animation'
      )
      return errorResponse(
        GENERATION_ERRORS.NOT_FOUND,
        "Cette animation n'est pas disponible",
        404
      )
    }

    // Validate required fields based on animation configuration
    const validationErrors: string[] = []

    // Check base fields requirements
    if (animation.baseFields) {
      if (
        animation.baseFields.name?.enabled &&
        animation.baseFields.name?.required &&
        !formData.nom
      ) {
        validationErrors.push('Le champ nom est requis')
      }
      if (
        animation.baseFields.firstName?.enabled &&
        animation.baseFields.firstName?.required &&
        !formData.prenom
      ) {
        validationErrors.push('Le champ prénom est requis')
      }
      if (
        animation.baseFields.email?.enabled &&
        animation.baseFields.email?.required &&
        !formData.email
      ) {
        validationErrors.push('Le champ email est requis')
      }
    }

    // Note: Email format validation is already handled by Zod schema (line 47)

    if (validationErrors.length > 0) {
      return errorResponse(
        GENERATION_ERRORS.VALIDATION,
        'Données manquantes',
        400,
        validationErrors
      )
    }

    // Record rate limit attempt before processing
    recordGenerationSubmission(clientIp)

    // Upload selfie to Azure Blob if provided
    let selfieUrl: string | undefined

    // Create generation first to get ID for selfie naming
    const generation = await generationService.createGeneration({
      animationId,
      participantData: formData,
    })

    // Upload selfie with generation ID
    if (selfie) {
      try {
        selfieUrl = await blobStorageService.uploadSelfie(
          selfie,
          generation._id.toString()
        )

        // Update generation with selfie URL
        await generation.updateOne({ selfieUrl })
      } catch (uploadError) {
        logger.error(
          { error: uploadError, generationId: generation._id.toString() },
          'Failed to upload selfie'
        )
        // Continue without selfie - non-blocking error
      }
    }

    logger.info(
      {
        generationId: generation._id.toString(),
        animationId,
        hasSelfie: !!selfie,
      },
      'Generation created successfully'
    )

    // Return success response
    return successResponse(
      {
        generationId: generation._id.toString(),
        status: 'pending',
      },
      201
    )
  } catch (error) {
    logger.error({ error }, 'Error creating generation')
    return errorResponse(
      GENERATION_ERRORS.INTERNAL,
      'Une erreur interne est survenue',
      500
    )
  }
}
