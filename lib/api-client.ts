import { useAuthStore } from '@/lib/stores/auth.store'

// Refresh state management
let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

// Time buffer before expiration to trigger refresh (2 minutes in seconds)
const REFRESH_BUFFER_SECONDS = 2 * 60

/**
 * Check if token is about to expire (within 2 minutes)
 */
function isTokenExpiringSoon(): boolean {
  const expiration = useAuthStore.getState().getTokenExpiration()
  if (!expiration) return true // No token = needs refresh

  const now = Math.floor(Date.now() / 1000)
  return expiration - now < REFRESH_BUFFER_SECONDS
}

/**
 * Refresh the access token
 * Uses mutex to prevent multiple simultaneous refresh calls
 */
async function refreshAccessToken(): Promise<string | null> {
  // If already refreshing, wait for the existing promise
  if (isRefreshing && refreshPromise) {
    return refreshPromise
  }

  isRefreshing = true
  refreshPromise = (async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include', // Important: send cookies
      })

      const data = await response.json()

      if (data.success && data.data?.accessToken) {
        // Update store with new token
        useAuthStore.getState().updateAccessToken(data.data.accessToken)
        return data.data.accessToken
      }

      // Refresh failed - return null
      return null
    } catch {
      return null
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })()

  return refreshPromise
}

/**
 * API client with automatic token refresh
 * Wraps fetch to handle JWT expiration transparently
 */
export async function apiClient<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: { code: string; message: string } }> {
  // Check if token is expiring soon and refresh if needed
  if (isTokenExpiringSoon()) {
    const newToken = await refreshAccessToken()
    if (!newToken) {
      // Refresh failed - will be handled by caller (Task 3)
      return {
        success: false,
        error: { code: 'AUTH_1002', message: 'Session expirée. Veuillez vous reconnecter.' }
      }
    }
  }

  // Get current token
  const token = useAuthStore.getState().getAccessToken()

  // Build headers with Authorization
  const headers = new Headers(options.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  // Execute request
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Always include cookies
  })

  const data = await response.json()

  // If AUTH_1002 returned, the session is invalid
  if (!data.success && data.error?.code === 'AUTH_1002') {
    // Let the caller handle this (Task 3)
    return data
  }

  return data
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: <T = unknown>(url: string, options?: RequestInit) =>
    apiClient<T>(url, { ...options, method: 'GET' }),

  post: <T = unknown>(url: string, body?: unknown, options?: RequestInit) =>
    apiClient<T>(url, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T = unknown>(url: string, body?: unknown, options?: RequestInit) =>
    apiClient<T>(url, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T = unknown>(url: string, body?: unknown, options?: RequestInit) =>
    apiClient<T>(url, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = unknown>(url: string, options?: RequestInit) =>
    apiClient<T>(url, { ...options, method: 'DELETE' }),
}
