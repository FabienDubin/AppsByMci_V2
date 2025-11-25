/**
 * Azure Application Insights initialization
 *
 * ARCHITECTURE DECISION (Story 1.6):
 * ==================================
 *
 * This file is SEPARATE from logger.ts because:
 * - The `applicationinsights` package uses Node.js native modules
 * - Next.js Edge Middleware runs in Edge Runtime (not Node.js)
 * - Importing applicationinsights in any file used by middleware crashes the app
 *
 * CONDITIONAL ACTIVATION:
 * - Development: App Insights is disabled (Turbopack incompatibility)
 * - Production: Enabled if AZURE_APPINSIGHTS_CONNECTION_STRING is set
 *
 * SOLUTION:
 * - logger.ts: Pure Pino only -> safe for middleware + all server code
 * - app-insights.ts: Azure SDK -> only for production API routes
 * - instrumentation.ts: Entry point that conditionally imports this module
 *
 * Connection string format:
 * InstrumentationKey=<guid>;IngestionEndpoint=https://<region>.applicationinsights.azure.com/
 * Source: Azure Portal -> Application Insights -> Properties -> Connection String
 */

import * as appInsights from 'applicationinsights'
import { logger } from '@/lib/logger'

let initialized = false

/**
 * Initialize Azure Application Insights
 * Safe to call multiple times - will only initialize once
 */
export function initializeAppInsights(): void {
  if (initialized) {
    return
  }

  // Skip in development - only enable in production
  if (process.env.NODE_ENV !== 'production') {
    logger.debug({ msg: 'Application Insights disabled in development mode' })
    return
  }

  const connectionString = process.env.AZURE_APPINSIGHTS_CONNECTION_STRING

  if (!connectionString) {
    logger.warn({ msg: 'AZURE_APPINSIGHTS_CONNECTION_STRING not set - Application Insights disabled' })
    return
  }

  try {
    appInsights
      .setup(connectionString)
      .setAutoDependencyCorrelation(true)
      .setAutoCollectRequests(true)
      .setAutoCollectPerformance(true, true)
      .setAutoCollectExceptions(true)
      .setAutoCollectDependencies(true)
      .start()

    initialized = true
    logger.info({ msg: 'Azure Application Insights initialized' })
  } catch (error) {
    logger.error({ msg: 'Failed to initialize Application Insights', error })
  }
}

/**
 * Get the Application Insights default client
 * Returns null if not initialized
 */
export function getAppInsightsClient() {
  if (!initialized) {
    return null
  }
  return appInsights.defaultClient
}

/**
 * Check if Application Insights is initialized
 */
export function isAppInsightsInitialized(): boolean {
  return initialized
}
