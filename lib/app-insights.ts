/**
 * Azure Application Insights initialization
 *
 * IMPORTANT ARCHITECTURE DECISION (Story 1.6):
 * =============================================
 *
 * This file is SEPARATE from logger.ts because:
 * - The `applicationinsights` package uses Node.js native modules
 * - Next.js Edge Middleware runs in Edge Runtime (not Node.js)
 * - Importing applicationinsights in any file used by middleware crashes the app
 *
 * SOLUTION:
 * - logger.ts: Pure Pino only → safe for middleware + all server code
 * - app-insights.ts: Azure SDK → only for API routes and server-side code
 *
 * HOW TO USE (when deploying to Azure):
 * 1. Set AZURE_APPINSIGHTS_CONNECTION_STRING in your .env
 * 2. Call initializeAppInsights() once at app startup (e.g., in a layout.tsx or API route)
 * 3. DO NOT import this file in middleware.ts or lib/middleware/*
 *
 * Example usage in an API route:
 * ```typescript
 * import { initializeAppInsights } from '@/lib/app-insights'
 *
 * // Initialize once (safe to call multiple times)
 * initializeAppInsights()
 *
 * export async function GET() {
 *   // Your API logic
 * }
 * ```
 *
 * Connection string format:
 * InstrumentationKey=<guid>;IngestionEndpoint=https://<region>.applicationinsights.azure.com/
 * Source: Azure Portal → Application Insights → Properties → Connection String
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
