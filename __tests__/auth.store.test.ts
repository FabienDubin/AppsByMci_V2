import { useAuthStore } from '@/lib/stores/auth.store'

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth()
  })

  describe('initial state', () => {
    it('should have null user initially', () => {
      const state = useAuthStore.getState()

      expect(state.user).toBeNull()
      expect(state.accessToken).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe('setAuth', () => {
    it('should set user and token', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin' as const,
      }
      const mockToken = 'mock.jwt.token'

      useAuthStore.getState().setAuth(mockUser, mockToken)

      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.accessToken).toBe(mockToken)
      expect(state.isAuthenticated).toBe(true)
    })

    it('should update isAuthenticated to true', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'admin' as const,
      }

      useAuthStore.getState().setAuth(mockUser, 'token')

      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })
  })

  describe('clearAuth', () => {
    it('should reset all auth state', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'admin' as const,
      }
      useAuthStore.getState().setAuth(mockUser, 'token')
      expect(useAuthStore.getState().isAuthenticated).toBe(true)

      useAuthStore.getState().clearAuth()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.accessToken).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe('getAccessToken', () => {
    it('should return null when not authenticated', () => {
      const token = useAuthStore.getState().getAccessToken()

      expect(token).toBeNull()
    })

    it('should return token when authenticated', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'admin' as const,
      }
      const mockToken = 'mock.jwt.token'

      useAuthStore.getState().setAuth(mockUser, mockToken)

      const token = useAuthStore.getState().getAccessToken()
      expect(token).toBe(mockToken)
    })
  })
})
