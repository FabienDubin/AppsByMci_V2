import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDatabase } from '@/lib/database'
import Generation from '@/models/Generation.model'
import { blobStorageService } from '@/lib/blob-storage'
import { logger } from '@/lib/logger'

// API response helpers
function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

function errorResponse(
  code: string,
  message: string,
  status: number = 400
) {
  return NextResponse.json({ success: false, error: { code, message } }, { status })
}

/**
 * GET /api/generations/[id]
 * Get generation status and result URL for frontend polling
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(
        'GEN_4004',
        'ID de génération invalide',
        400
      )
    }

    // Connect to database
    await connectDatabase()

    // Find generation
    const generation = await Generation.findById(id)

    if (!generation) {
      return errorResponse(
        'GEN_4003',
        'Génération non trouvée',
        404
      )
    }

    // Build response based on status
    const response: {
      id: string
      status: string
      resultUrl?: string
      error?: { code: string; message: string }
    } = {
      id: generation._id.toString(),
      status: generation.status,
    }

    // Add result URL with SAS token if completed
    if (generation.status === 'completed' && generation.generatedImageUrl) {
      try {
        // Generate a SAS URL valid for 60 minutes
        response.resultUrl = await blobStorageService.getResultSasUrl(id, 60)
      } catch (sasError) {
        // Fallback to raw URL if SAS generation fails
        logger.warn({ generationId: id, error: sasError }, 'SAS URL generation failed, using raw URL')
        response.resultUrl = generation.generatedImageUrl
      }
    }

    // Add error details if failed
    if (generation.status === 'failed' && generation.error) {
      try {
        response.error = JSON.parse(generation.error)
      } catch {
        response.error = { code: 'GEN_5001', message: generation.error }
      }
    }

    logger.debug({
      generationId: id,
      status: generation.status,
    }, 'Generation status fetched')

    return successResponse(response)
  } catch (error) {
    logger.error({ error }, 'Error fetching generation')
    return errorResponse(
      'GEN_5001',
      'Une erreur interne est survenue',
      500
    )
  }
}
