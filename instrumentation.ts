/**
 * Next.js Instrumentation Hook
 *
 * This file is the official entry point for server-side initialization in Next.js 15+.
 * It runs once when the server starts and is the recommended place for:
 * - Monitoring SDK initialization (Application Insights, OpenTelemetry, etc.)
 * - Server-side setup that needs to happen before any routes are called
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on Node.js runtime (not Edge) AND only in production
  // The applicationinsights package has dynamic requires that are incompatible with Turbopack
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.NODE_ENV === 'production') {
    // Dynamic import to avoid bundling in Edge builds and dev mode
    const { initializeAppInsights } = await import('@/lib/app-insights')
    initializeAppInsights()
  }
}
