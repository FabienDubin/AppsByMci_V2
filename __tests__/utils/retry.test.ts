// Tests for retry utility
import { withRetry, isRetryableError, withTimeout } from '@/lib/utils/retry'

// Mock logger to avoid console output during tests
jest.mock('@/lib/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}))

describe('retry utility', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('isRetryableError', () => {
    it('should return true for 429 rate limit error', () => {
      const error = { status: 429 }
      expect(isRetryableError(error)).toBe(true)
    })

    it('should return true for 503 service unavailable', () => {
      const error = { status: 503 }
      expect(isRetryableError(error)).toBe(true)
    })

    it('should return true for 502 bad gateway', () => {
      const error = { status: 502 }
      expect(isRetryableError(error)).toBe(true)
    })

    it('should return false for 400 bad request', () => {
      const error = { status: 400 }
      expect(isRetryableError(error)).toBe(false)
    })

    it('should return false for 401 unauthorized', () => {
      const error = { status: 401 }
      expect(isRetryableError(error)).toBe(false)
    })

    it('should return false for 404 not found', () => {
      const error = { status: 404 }
      expect(isRetryableError(error)).toBe(false)
    })

    it('should return true for rate limit message', () => {
      const error = { message: 'Rate limit exceeded' }
      expect(isRetryableError(error)).toBe(true)
    })

    it('should return true for timeout message', () => {
      const error = { message: 'Connection timeout occurred' }
      expect(isRetryableError(error)).toBe(true)
    })

    it('should return true for OpenAI rate limit error type', () => {
      const error = { type: 'rate_limit_error' }
      expect(isRetryableError(error)).toBe(true)
    })

    it('should return false for unknown error', () => {
      const error = { message: 'Unknown error' }
      expect(isRetryableError(error)).toBe(false)
    })
  })

  describe('withRetry', () => {
    it('should return result on first successful attempt', async () => {
      const fn = jest.fn().mockResolvedValue('success')

      const result = await withRetry(fn, { maxRetries: 3 })

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should retry on retryable error and succeed', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce({ status: 429, message: 'Rate limited' })
        .mockResolvedValue('success')

      const result = await withRetry(fn, {
        maxRetries: 3,
        baseDelayMs: 10,
      })

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('should not retry on non-retryable error', async () => {
      const fn = jest.fn().mockRejectedValue({ status: 400, message: 'Bad request' })

      await expect(withRetry(fn, { maxRetries: 3 })).rejects.toMatchObject({ status: 400 })
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should throw after max retries exhausted', async () => {
      const fn = jest.fn().mockRejectedValue({ status: 429, message: 'Rate limited' })

      await expect(
        withRetry(fn, { maxRetries: 2, baseDelayMs: 10 })
      ).rejects.toMatchObject({ status: 429 })

      expect(fn).toHaveBeenCalledTimes(3) // Initial + 2 retries
    })

    it('should use custom shouldRetry function', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce({ customCode: 'RETRY_ME' })
        .mockResolvedValue('success')

      const result = await withRetry(fn, {
        maxRetries: 3,
        baseDelayMs: 10,
        shouldRetry: (error) => error.customCode === 'RETRY_ME',
      })

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(2)
    })
  })

  describe('withTimeout', () => {
    it('should return result if function completes within timeout', async () => {
      const fn = jest.fn().mockResolvedValue('success')

      const result = await withTimeout(fn, 1000)

      expect(result).toBe('success')
    })

    it('should throw if function exceeds timeout', async () => {
      const fn = jest.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 200))
      )

      await expect(withTimeout(fn, 50, 'Test timeout')).rejects.toThrow('Test timeout')
    })

    it('should use default timeout message', async () => {
      const fn = jest.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 200))
      )

      await expect(withTimeout(fn, 50)).rejects.toThrow('Operation timed out')
    })
  })
})
