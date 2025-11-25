// API Route: GET /api/ai-models
// Returns the list of available AI models for image generation

import { NextResponse } from 'next/server'
import { getAllModels } from '@/lib/ai-models'

/**
 * GET /api/ai-models
 * Returns all available AI models for image generation
 *
 * Response: { models: AIModel[] }
 * Performance: < 100ms (hardcoded config, no DB query)
 */
export async function GET() {
  const startTime = Date.now()

  const models = getAllModels()

  const responseTime = Date.now() - startTime

  return NextResponse.json(
    { models },
    {
      status: 200,
      headers: {
        'X-Response-Time': `${responseTime}ms`,
      },
    }
  )
}
