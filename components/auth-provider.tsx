'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth.store'

/**
 * Auth Provider
 * Restores user session on page load if refresh token exists
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false)
  const { isAuthenticated, setAuth } = useAuthStore()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    async function initializeAuth() {
      // Skip if already authenticated or on public pages
      if (isAuthenticated) {
        setIsInitialized(true)
        return
      }

      // Skip auth check on public pages
      const publicPaths = ['/login', '/a/']
      if (publicPaths.some((path) => pathname.startsWith(path))) {
        setIsInitialized(true)
        return
      }

      try {
        // Try to refresh the access token using the httpOnly cookie
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        })

        const data = await response.json()

        if (data.success && data.data?.accessToken) {
          // Decode JWT to get user info (client-side decode, no verification needed)
          const token = data.data.accessToken
          const payload = JSON.parse(atob(token.split('.')[1]))

          // Restore user info in store
          const user = {
            id: payload.userId,
            email: payload.email,
            role: payload.role,
          }

          setAuth(user, token)
        } else {
          // No valid session - redirect to login if on protected page
          if (!publicPaths.some((path) => pathname.startsWith(path))) {
            router.push('/login')
          }
        }
      } catch {
        // Session restoration failed - redirect to login if on protected page
        if (!publicPaths.some((path) => pathname.startsWith(path))) {
          router.push('/login')
        }
      } finally {
        setIsInitialized(true)
      }
    }

    initializeAuth()
  }, [isAuthenticated, pathname, router, setAuth])

  // Show loading or nothing while initializing
  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return <>{children}</>
}
