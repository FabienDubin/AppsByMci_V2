// Retry utility with exponential backoff
// Provides robust retry logic for API calls

import { logger } from '@/lib/logger'

/**
 * Retry options configuration
 */
export interface RetryOptions {
  maxRetries: number
  baseDelayMs: number
  maxDelayMs?: number
  shouldRetry?: (error: any) => boolean
}

/**
 * Default retry options
 */
const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelayMs: 2000,
  maxDelayMs: 10000,
}

/**
 * HTTP status codes that are retryable
 */
const RETRYABLE_STATUS_CODES = [429, 503, 502, 504]

/**
 * HTTP status codes that should NOT be retried
 */
const NON_RETRYABLE_STATUS_CODES = [400, 401, 403, 404]

/**
 * Check if an error is retryable based on HTTP status code
 * - Retryable: 429 (rate limit), 503 (service unavailable), 502, 504
 * - Non-retryable: 400 (bad request), 401 (auth error), 403, 404
 */
export function isRetryableError(error: any): boolean {
  // Check for HTTP status codes
  const status = error?.status || error?.response?.status || error?.statusCode

  if (status) {
    if (NON_RETRYABLE_STATUS_CODES.includes(status)) {
      return false
    }
    if (RETRYABLE_STATUS_CODES.includes(status)) {
      return true
    }
  }

  // Check for specific error messages
  const message = error?.message?.toLowerCase() || ''
  if (
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('service unavailable') ||
    message.includes('timeout') ||
    message.includes('econnreset') ||
    message.includes('enotfound') ||
    message.includes('etimedout')
  ) {
    return true
  }

  // Check for OpenAI specific error types
  if (error?.type === 'rate_limit_error' || error?.code === 'rate_limit_exceeded') {
    return true
  }

  // Non-retryable by default for unknown errors
  return false
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Calculate delay with exponential backoff
 * Pattern: immediate (0ms), 2s, 5s for 3 retries
 */
function calculateDelay(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  if (attempt === 0) {
    return 0 // First retry is immediate
  }

  // Exponential backoff: 2s, 5s pattern
  const delays = [0, 2000, 5000, 10000, 15000]
  const delay = delays[attempt] || baseDelayMs * Math.pow(2, attempt - 1)

  return Math.min(delay, maxDelayMs)
}

/**
 * Execute a function with retry logic and exponential backoff
 *
 * @param fn - The async function to execute
 * @param options - Retry options
 * @returns The result of the function
 * @throws The last error if all retries fail
 *
 * @example
 * ```ts
 * const result = await withRetry(
 *   () => openaiImageService.generateImage(prompt),
 *   { maxRetries: 3, baseDelayMs: 2000, shouldRetry: isRetryableError }
 * )
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts: RetryOptions = { ...DEFAULT_OPTIONS, ...options }
  const { maxRetries, baseDelayMs, maxDelayMs = 10000 } = opts

  let lastError: any

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error

      // Check if we should retry
      const shouldRetry = opts.shouldRetry ? opts.shouldRetry(error) : isRetryableError(error)

      if (!shouldRetry) {
        logger.warn({
          attempt: attempt + 1,
          maxRetries: maxRetries + 1,
          error: error.message,
          retryable: false,
        }, 'Non-retryable error, failing immediately')
        throw error
      }

      // Check if we've exhausted retries
      if (attempt >= maxRetries) {
        logger.error({
          attempt: attempt + 1,
          maxRetries: maxRetries + 1,
          error: error.message,
        }, 'All retry attempts exhausted')
        throw error
      }

      // Calculate delay and wait
      const delay = calculateDelay(attempt, baseDelayMs, maxDelayMs)

      logger.warn({
        attempt: attempt + 1,
        maxRetries: maxRetries + 1,
        error: error.message,
        delayMs: delay,
        status: error?.status || error?.response?.status,
      }, 'Retryable error, waiting before retry')

      if (delay > 0) {
        await sleep(delay)
      }
    }
  }

  // Should not reach here, but throw last error just in case
  throw lastError
}

/**
 * Execute a function with a timeout
 *
 * @param fn - The async function to execute
 * @param timeoutMs - Timeout in milliseconds
 * @param timeoutMessage - Error message on timeout
 * @returns The result of the function
 * @throws Error if function exceeds timeout
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  timeoutMessage = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    ),
  ])
}
