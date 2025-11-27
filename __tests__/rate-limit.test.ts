import {
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimitOnSuccess,
  clearAllRateLimits,
} from '@/lib/rate-limit'

describe('Rate Limiting', () => {
  beforeEach(() => {
    clearAllRateLimits()
  })

  describe('checkRateLimit', () => {
    it('should allow first request from new IP', () => {
      const result = checkRateLimit('192.168.1.1')

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(5)
    })

    it('should allow requests within limit', () => {
      const ip = '192.168.1.2'

      for (let i = 0; i < 4; i++) {
        recordFailedAttempt(ip)
      }

      const result = checkRateLimit(ip)

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(1)
    })

    it('should block after 5 failed attempts', () => {
      const ip = '192.168.1.3'

      for (let i = 0; i < 5; i++) {
        recordFailedAttempt(ip)
      }

      const result = checkRateLimit(ip)

      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.resetAt).toBeDefined()
    })
  })

  describe('recordFailedAttempt', () => {
    it('should increment attempt count', () => {
      const ip = '192.168.1.4'

      recordFailedAttempt(ip)
      let result = checkRateLimit(ip)
      expect(result.remaining).toBe(4)

      recordFailedAttempt(ip)
      result = checkRateLimit(ip)
      expect(result.remaining).toBe(3)
    })

    it('should block IP after reaching max attempts', () => {
      const ip = '192.168.1.5'

      for (let i = 0; i < 5; i++) {
        recordFailedAttempt(ip)
      }

      const result = checkRateLimit(ip)

      expect(result.allowed).toBe(false)
    })
  })

  describe('resetRateLimitOnSuccess', () => {
    it('should reset rate limit after successful login', () => {
      const ip = '192.168.1.6'

      for (let i = 0; i < 4; i++) {
        recordFailedAttempt(ip)
      }

      let result = checkRateLimit(ip)
      expect(result.remaining).toBe(1)

      resetRateLimitOnSuccess(ip)

      result = checkRateLimit(ip)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(5)
    })

    it('should allow login after reset even if was blocked', () => {
      const ip = '192.168.1.7'

      for (let i = 0; i < 5; i++) {
        recordFailedAttempt(ip)
      }

      let result = checkRateLimit(ip)
      expect(result.allowed).toBe(false)

      resetRateLimitOnSuccess(ip)

      result = checkRateLimit(ip)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(5)
    })
  })

  describe('multiple IPs', () => {
    it('should track rate limits independently per IP', () => {
      const ip1 = '192.168.1.10'
      const ip2 = '192.168.1.11'

      for (let i = 0; i < 5; i++) {
        recordFailedAttempt(ip1)
      }

      expect(checkRateLimit(ip1).allowed).toBe(false)
      expect(checkRateLimit(ip2).allowed).toBe(true)
      expect(checkRateLimit(ip2).remaining).toBe(5)
    })
  })
})
