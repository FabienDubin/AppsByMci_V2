import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDatabase } from '@/lib/database'
import Generation from '@/models/Generation.model'
import Animation from '@/models/Animation.model'
import { blobCoreService, CONTAINERS } from '@/lib/services/blob'
import { logger } from '@/lib/logger'

// API response helpers
function errorResponse(
  code: string,
  message: string,
  status: number = 400
) {
  return NextResponse.json({ success: false, error: { code, message } }, { status })
}

/**
 * GET /api/generations/[id]/download
 * Download the generated image with proper Content-Disposition header
 * Generates a fresh SAS token for security
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

    // Check that generation is completed
    if (generation.status !== 'completed') {
      return errorResponse(
        'GEN_4005',
        'La génération n\'est pas terminée',
        400
      )
    }

    // Get animation for slug (used in filename)
    const animation = await Animation.findById(generation.animationId)
    const slug = animation?.slug || 'generation'

    // Generate filename: {animation-slug}-{timestamp}.png
    const timestamp = Math.floor(Date.now() / 1000)
    const filename = `${slug}-${timestamp}.png`

    // Download the image from blob storage
    const blobName = `results/${id}.png`
    let imageBuffer: Buffer

    try {
      imageBuffer = await blobCoreService.downloadFile(CONTAINERS.GENERATED_IMAGES, blobName)
    } catch (error: any) {
      if (error.message?.includes('not found')) {
        return errorResponse(
          'GEN_4006',
          'Image non trouvée',
          404
        )
      }
      throw error
    }

    logger.info({
      generationId: id,
      animationSlug: slug,
      filename,
    }, 'Image download requested')

    // Return the image with Content-Disposition header for download
    // Convert Buffer to Uint8Array for NextResponse compatibility
    return new NextResponse(new Uint8Array(imageBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': imageBuffer.length.toString(),
        'Cache-Control': 'private, no-cache',
      },
    })
  } catch (error) {
    logger.error({ error }, 'Error downloading generation')
    return errorResponse(
      'GEN_5001',
      'Une erreur interne est survenue',
      500
    )
  }
}
