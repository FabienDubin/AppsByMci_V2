// Graceful shutdown handler
// Handles SIGTERM and SIGINT signals for clean application termination

import { logger } from '@/lib/logger'
import { disconnectDatabase } from '@/lib/database'

let isShuttingDown = false

/**
 * Graceful shutdown handler
 * Cleans up resources before application exit
 */
async function handleShutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    logger.warn({ msg: 'Shutdown already in progress, ignoring signal', signal })
    return
  }

  isShuttingDown = true
  logger.info({ msg: 'Shutdown signal received, closing server...', signal })

  try {
    // Disconnect from database
    await disconnectDatabase()
    logger.info({ msg: 'Database disconnected' })

    logger.info({ msg: 'Server closed gracefully' })
    process.exit(0)
  } catch (error) {
    logger.error({ msg: 'Error during shutdown', error })
    process.exit(1)
  }
}

/**
 * Register shutdown handlers
 * Call this once at application startup
 */
export function registerShutdownHandlers(): void {
  process.on('SIGTERM', () => handleShutdown('SIGTERM'))
  process.on('SIGINT', () => handleShutdown('SIGINT'))

  logger.debug({ msg: 'Shutdown handlers registered' })
}
