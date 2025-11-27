'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth.store'

/**
 * Hook for silent auth initialization on page load
 * Attempts to refresh the JWT if cookie is present but token is missing in memory
 *
 * Usage: Call this hook in your root layout or auth provider
 */
export function useAuthInit() {
  const { accessToken, isAuthenticated, updateAccessToken } = useAuthStore()
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    async function initAuth() {
      // If we already have a valid token, we're done
      if (accessToken && isAuthenticated) {
        setIsInitializing(false)
        return
      }

      // No token in memory - try silent refresh (cookie might be present)
      try {
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include', // Send cookies
        })

        const data = await response.json()

        if (data.success && data.data?.accessToken) {
          // Refresh succeeded - update token
          // Note: We only have the token, not user info
          // The user info should be fetched separately or stored in a secure cookie
          updateAccessToken(data.data.accessToken)
        }
        // If refresh failed, user stays logged out (no redirect here)
      } catch {
        // Network error - user stays logged out
      } finally {
        setIsInitializing(false)
      }
    }

    initAuth()
  }, [accessToken, isAuthenticated, updateAccessToken])

  return { isInitializing }
}

/**
 * Handle AUTH_1002 error (session expired)
 * Clears auth state, redirects to login, shows toast
 */
export function handleSessionExpired(
  clearAuth: () => void,
  router: ReturnType<typeof useRouter>,
  showToast?: (message: string) => void
) {
  // Clear auth state
  clearAuth()

  // Show toast if provided
  if (showToast) {
    showToast('Session expirée. Veuillez vous reconnecter.')
  }

  // Redirect to login
  router.push('/login')
}

/**
 * Hook that provides session expiration handler
 */
export function useSessionExpiredHandler() {
  const router = useRouter()
  const { clearAuth } = useAuthStore()

  const handleExpired = (showToast?: (message: string) => void) => {
    handleSessionExpired(clearAuth, router, showToast)
  }

  return { handleExpired }
}
