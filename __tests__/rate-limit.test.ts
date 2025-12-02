import {
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimitOnSuccess,
  clearAllRateLimits,
  checkGenerationRateLimit,
  recordGenerationSubmission,
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

describe('Generation Rate Limiting (FR37)', () => {
  beforeEach(() => {
    clearAllRateLimits()
  })

  describe('checkGenerationRateLimit', () => {
    it('should allow first submission from new IP', () => {
      const result = checkGenerationRateLimit('192.168.1.100')

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(5)
    })

    it('should allow submissions within limit', () => {
      const ip = '192.168.1.101'

      for (let i = 0; i < 4; i++) {
        recordGenerationSubmission(ip)
      }

      const result = checkGenerationRateLimit(ip)

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(1)
    })

    it('should block after 5 submissions within 1 minute', () => {
      const ip = '192.168.1.102'

      for (let i = 0; i < 5; i++) {
        recordGenerationSubmission(ip)
      }

      const result = checkGenerationRateLimit(ip)

      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.resetAt).toBeDefined()
    })
  })

  describe('recordGenerationSubmission', () => {
    it('should increment submission count', () => {
      const ip = '192.168.1.103'

      recordGenerationSubmission(ip)
      let result = checkGenerationRateLimit(ip)
      expect(result.remaining).toBe(4)

      recordGenerationSubmission(ip)
      result = checkGenerationRateLimit(ip)
      expect(result.remaining).toBe(3)
    })
  })

  describe('isolation from login rate limit', () => {
    it('should track generation limits independently from login limits', () => {
      const ip = '192.168.1.104'

      // Max out login attempts (5)
      for (let i = 0; i < 5; i++) {
        recordFailedAttempt(ip)
      }

      // Login should be blocked
      expect(checkRateLimit(ip).allowed).toBe(false)

      // But generation should still be allowed
      expect(checkGenerationRateLimit(ip).allowed).toBe(true)
      expect(checkGenerationRateLimit(ip).remaining).toBe(5)
    })

    it('should track login limits independently from generation limits', () => {
      const ip = '192.168.1.105'

      // Max out generation submissions (5)
      for (let i = 0; i < 5; i++) {
        recordGenerationSubmission(ip)
      }

      // Generation should be blocked
      expect(checkGenerationRateLimit(ip).allowed).toBe(false)

      // But login should still be allowed
      expect(checkRateLimit(ip).allowed).toBe(true)
      expect(checkRateLimit(ip).remaining).toBe(5)
    })
  })
})
