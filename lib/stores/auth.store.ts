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
}))
