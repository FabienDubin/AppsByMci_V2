import { NextResponse } from 'next/server'
import { initDatabase } from '@/lib/db-init'
import { isDatabaseConnected } from '@/lib/database'
import { initBlobStorage } from '@/lib/blob-init'
import { blobStorageService } from '@/lib/blob-storage'

export const GET = async () => {
  const checks: Record<string, any> = {}
  let overallStatus = 'healthy'

  // Check database connection
  try {
    const startTime = Date.now()
    await initDatabase()
    const responseTime = Date.now() - startTime

    const isConnected = isDatabaseConnected()

    checks.database = {
      status: isConnected ? 'up' : 'down',
      responseTime: `${responseTime}ms`,
    }

    if (!isConnected) {
      overallStatus = 'unhealthy'
    }
  } catch (error) {
    checks.database = {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
    overallStatus = 'unhealthy'
  }

  // Check blob storage connection
  try {
    const startTime = Date.now()
    await initBlobStorage()
    const responseTime = Date.now() - startTime

    const isInitialized = blobStorageService.isInitialized()

    checks.blobStorage = {
      status: isInitialized ? 'up' : 'down',
      responseTime: `${responseTime}ms`,
    }

    if (!isInitialized) {
      // Blob Storage non-bloquant : degraded status au lieu de unhealthy
      overallStatus = 'degraded'
    }
  } catch (error) {
    checks.blobStorage = {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
    overallStatus = 'degraded' // Non-bloquant
  }

  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      service: 'AppsByMci_v2',
      version: '1.0.0',
      checks,
    },
    { status: statusCode }
  )
}
