import pino from 'pino'

/**
 * Pino logger configuration
 *
 * NOTE: We don't use pino-pretty transport because it uses worker threads
 * which are not compatible with Next.js/Turbopack.
 *
 * For pretty logs in development, pipe the output:
 * npm run dev | npx pino-pretty
 *
 * Or just use the JSON output - it's still readable.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
  // No transport - Next.js/Turbopack doesn't support worker threads
})
