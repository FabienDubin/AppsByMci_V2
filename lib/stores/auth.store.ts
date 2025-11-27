import { create } from 'zustand'

// User info type from API response
export interface UserInfo {
  id: string
  email: string
  name?: string
  role: 'admin' | 'editor' | 'viewer'
}

// Store state type
interface AuthState {
  user: UserInfo | null
  accessToken: string | null
  isAuthenticated: boolean
}

// Store actions type
interface AuthActions {
  setAuth: (user: UserInfo, accessToken: string) => void
  clearAuth: () => void
  getAccessToken: () => string | null
  updateAccessToken: (token: string) => void
  updateUser: (user: Partial<UserInfo>) => void
  getTokenExpiration: () => number | null
}

// Combined type
type AuthStore = AuthState & AuthActions

// Default state
const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
}

/**
 * Decode JWT payload without verification (client-side only)
 * Returns null if token is invalid
 */
function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1]))
    return payload
  } catch {
    return null
  }
}

/**
 * Zustand auth store
 * Stores JWT in memory only (not localStorage) for security
 * Refresh token is stored in httpOnly cookie by server
 */
export const useAuthStore = create<AuthStore>((set, get) => ({
  ...initialState,

  /**
   * Set authentication data after successful login
   */
  setAuth: (user: UserInfo, accessToken: string) => {
    set({
      user,
      accessToken,
      isAuthenticated: true,
    })
  },

  /**
   * Clear authentication data on logout
   */
  clearAuth: () => {
    set(initialState)
  },

  /**
   * Get current access token
   */
  getAccessToken: () => {
    return get().accessToken
  },

  /**
   * Update access token without touching user info (for refresh)
   */
  updateAccessToken: (token: string) => {
    set({ accessToken: token })
  },

  /**
   * Update user info without touching token (for profile updates)
   */
  updateUser: (userUpdates: Partial<UserInfo>) => {
    const currentUser = get().user
    if (currentUser) {
      set({
        user: {
          ...currentUser,
          ...userUpdates,
        },
      })
    }
  },

  /**
   * Get token expiration timestamp (seconds since epoch)
   * Returns null if no token or invalid token
   */
  getTokenExpiration: () => {
    const token = get().accessToken
    if (!token) return null
    const payload = decodeJwtPayload(token)
    return payload?.exp ?? null
  },
}))
