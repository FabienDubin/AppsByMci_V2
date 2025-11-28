// In-memory rate limiting for login attempts and animation creation
// MVP implementation - consider Redis/DB for horizontal scaling

interface RateLimitEntry {
  attempts: number
  firstAttempt: number
  blocked: boolean
  blockedUntil: number
}

// Rate limit configuration for login attempts
const MAX_ATTEMPTS = 5
const WINDOW_MS = 60 * 60 * 1000 // 1 hour
const BLOCK_DURATION_MS = 60 * 60 * 1000 // 1 hour

// Rate limit configuration for animation creation
const MAX_ANIMATION_CREATIONS = 10
const ANIMATION_WINDOW_MS = 60 * 60 * 1000 // 1 hour

// In-memory stores (resets on restart, not shared across instances)
const rateLimitStore = new Map<string, RateLimitEntry>()
const animationCreationStore = new Map<string, RateLimitEntry>()

// Periodic cleanup to prevent memory leaks
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000 // 5 min
let cleanupInterval: ReturnType<typeof setInterval> | null = null

// Skip cleanup interval in test environment
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  cleanupInterval = setInterval(() => {
    const now = Date.now()

    // Cleanup login rate limits
    for (const [key, entry] of rateLimitStore.entries()) {
      // Remove expired non-blocked entries
      if (!entry.blocked && now - entry.firstAttempt > WINDOW_MS) {
        rateLimitStore.delete(key)
      }
      // Remove entries with expired blocks
      if (entry.blocked && now > entry.blockedUntil) {
        rateLimitStore.delete(key)
      }
    }

    // Cleanup animation creation rate limits
    for (const [key, entry] of animationCreationStore.entries()) {
      // Remove expired entries
      if (now - entry.firstAttempt > ANIMATION_WINDOW_MS) {
        animationCreationStore.delete(key)
      }
    }
  }, CLEANUP_INTERVAL_MS)
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt?: Date
}

/**
 * Check if an IP is rate limited
 * @param ip The client IP address
 * @returns Whether the request is allowed and remaining attempts
 */
export function checkRateLimit(ip: string): RateLimitResult {
  const now = Date.now()
  const entry = rateLimitStore.get(ip)

  // First request from this IP
  if (!entry) {
    return { allowed: true, remaining: MAX_ATTEMPTS }
  }

  // IP is currently blocked
  if (entry.blocked) {
    if (now < entry.blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(entry.blockedUntil),
      }
    }
    // Block expired, clear entry
    rateLimitStore.delete(ip)
    return { allowed: true, remaining: MAX_ATTEMPTS }
  }

  // Time window expired, reset counter
  if (now - entry.firstAttempt > WINDOW_MS) {
    rateLimitStore.delete(ip)
    return { allowed: true, remaining: MAX_ATTEMPTS }
  }

  // Check if attempt limit reached
  if (entry.attempts >= MAX_ATTEMPTS) {
    // Block this IP
    entry.blocked = true
    entry.blockedUntil = now + BLOCK_DURATION_MS
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(entry.blockedUntil),
    }
  }

  return { allowed: true, remaining: MAX_ATTEMPTS - entry.attempts }
}

/**
 * Record a failed login attempt for an IP
 * @param ip The client IP address
 */
export function recordFailedAttempt(ip: string): void {
  const now = Date.now()
  const entry = rateLimitStore.get(ip)

  if (!entry) {
    rateLimitStore.set(ip, {
      attempts: 1,
      firstAttempt: now,
      blocked: false,
      blockedUntil: 0,
    })
    return
  }

  // Time window expired, start fresh
  if (now - entry.firstAttempt > WINDOW_MS) {
    rateLimitStore.set(ip, {
      attempts: 1,
      firstAttempt: now,
      blocked: false,
      blockedUntil: 0,
    })
    return
  }

  // Increment attempt counter
  entry.attempts++

  // Block if limit reached
  if (entry.attempts >= MAX_ATTEMPTS) {
    entry.blocked = true
    entry.blockedUntil = now + BLOCK_DURATION_MS
  }
}

/**
 * Reset rate limit for an IP on successful login
 * @param ip The client IP address
 */
export function resetRateLimitOnSuccess(ip: string): void {
  rateLimitStore.delete(ip)
}

/**
 * Get current rate limit status for an IP (for testing/debugging)
 * @param ip The client IP address
 */
export function getRateLimitStatus(ip: string): RateLimitEntry | undefined {
  return rateLimitStore.get(ip)
}

/**
 * Clear all rate limit entries (for testing)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear()
  animationCreationStore.clear()
}

/**
 * Check if a user has exceeded animation creation rate limit
 * @param userId The user ID
 * @returns Whether the request is allowed and remaining creations
 */
export function checkAnimationCreationRateLimit(userId: string): RateLimitResult {
  const now = Date.now()
  const entry = animationCreationStore.get(userId)

  // First creation from this user
  if (!entry) {
    return { allowed: true, remaining: MAX_ANIMATION_CREATIONS }
  }

  // Time window expired, reset counter
  if (now - entry.firstAttempt > ANIMATION_WINDOW_MS) {
    animationCreationStore.delete(userId)
    return { allowed: true, remaining: MAX_ANIMATION_CREATIONS }
  }

  // Check if creation limit reached
  if (entry.attempts >= MAX_ANIMATION_CREATIONS) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(entry.firstAttempt + ANIMATION_WINDOW_MS),
    }
  }

  return { allowed: true, remaining: MAX_ANIMATION_CREATIONS - entry.attempts }
}

/**
 * Record an animation creation for a user
 * @param userId The user ID
 */
export function recordAnimationCreation(userId: string): void {
  const now = Date.now()
  const entry = animationCreationStore.get(userId)

  if (!entry) {
    animationCreationStore.set(userId, {
      attempts: 1,
      firstAttempt: now,
      blocked: false,
      blockedUntil: 0,
    })
    return
  }

  // Time window expired, start fresh
  if (now - entry.firstAttempt > ANIMATION_WINDOW_MS) {
    animationCreationStore.set(userId, {
      attempts: 1,
      firstAttempt: now,
      blocked: false,
      blockedUntil: 0,
    })
    return
  }

  // Increment creation counter
  entry.attempts++
}
