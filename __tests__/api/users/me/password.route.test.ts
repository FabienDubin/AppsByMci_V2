import { NextRequest } from 'next/server'
import { PUT } from '@/app/api/users/me/password/route'
import { usersService } from '@/lib/services/users.service'
import * as auth from '@/lib/auth'
import * as database from '@/lib/database'

jest.mock('@/lib/services/users.service')
jest.mock('@/lib/auth')
jest.mock('@/lib/database')
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}))

const mockUsersService = usersService as jest.Mocked<typeof usersService>
const mockAuth = auth as jest.Mocked<typeof auth>
const mockDatabase = database as jest.Mocked<typeof database>

describe('PUT /api/users/me/password', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDatabase.connectDatabase.mockResolvedValue({} as typeof import('mongoose'))
  })

  const createMockRequest = (
    body: any,
    authHeader: string | null = 'Bearer valid-token'
  ): NextRequest => {
    const headers = new Headers()
    if (authHeader) {
      headers.set('authorization', authHeader)
    }

    return new NextRequest('http://localhost:3000/api/users/me/password', {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    })
  }

  describe('Success cases', () => {
    it('should change password successfully', async () => {
      mockAuth.verifyAccessToken.mockReturnValue({
        userId: 'user-123',
        email: 'test@example.com',
        role: 'admin',
      })
      mockUsersService.changePassword.mockResolvedValue(undefined)

      const request = createMockRequest({
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword456!',
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.message).toBe('Mot de passe changé avec succès')
      expect(mockUsersService.changePassword).toHaveBeenCalledWith(
        'user-123',
        'OldPassword123!',
        'NewPassword456!',
        undefined // No refresh token in test request
      )
    })
  })

  describe('Authentication errors', () => {
    it('should return 401 if no authorization header', async () => {
      const request = createMockRequest(
        { currentPassword: 'OldPassword123!', newPassword: 'NewPassword456!' },
        null
      )
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('AUTH_1002')
    })

    it('should return 401 if token is invalid', async () => {
      mockAuth.verifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid token')
      })

      const request = createMockRequest({
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword456!',
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('AUTH_1002')
    })
  })

  describe('Validation errors', () => {
    it('should return 400 if currentPassword is missing', async () => {
      mockAuth.verifyAccessToken.mockReturnValue({
        userId: 'user-123',
        email: 'test@example.com',
        role: 'admin',
      })

      const request = createMockRequest({ newPassword: 'NewPassword456!' })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 if newPassword is too short', async () => {
      mockAuth.verifyAccessToken.mockReturnValue({
        userId: 'user-123',
        email: 'test@example.com',
        role: 'admin',
      })

      const request = createMockRequest({
        currentPassword: 'OldPassword123!',
        newPassword: 'Short1!',
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 if newPassword does not meet requirements', async () => {
      mockAuth.verifyAccessToken.mockReturnValue({
        userId: 'user-123',
        email: 'test@example.com',
        role: 'admin',
      })

      const request = createMockRequest({
        currentPassword: 'OldPassword123!',
        newPassword: 'nouppercaseorspecial123',
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('Password verification errors', () => {
    it('should return 401 if current password is incorrect (AUTH_1005)', async () => {
      mockAuth.verifyAccessToken.mockReturnValue({
        userId: 'user-123',
        email: 'test@example.com',
        role: 'admin',
      })

      const error = new Error('Mot de passe actuel incorrect')
      ;(error as any).code = 'AUTH_1005'
      mockUsersService.changePassword.mockRejectedValue(error)

      const request = createMockRequest({
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewPassword456!',
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('AUTH_1005')
      expect(data.error.message).toBe('Mot de passe actuel incorrect')
    })
  })

  describe('User not found errors', () => {
    it('should return 404 if user not found', async () => {
      mockAuth.verifyAccessToken.mockReturnValue({
        userId: 'non-existent-user',
        email: 'test@example.com',
        role: 'admin',
      })

      const error = new Error('Utilisateur non trouvé')
      ;(error as any).code = 'USER_1001'
      mockUsersService.changePassword.mockRejectedValue(error)

      const request = createMockRequest({
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword456!',
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('USER_1001')
    })
  })

  describe('Server errors', () => {
    it('should return 500 for unexpected errors', async () => {
      mockAuth.verifyAccessToken.mockReturnValue({
        userId: 'user-123',
        email: 'test@example.com',
        role: 'admin',
      })

      mockUsersService.changePassword.mockRejectedValue(new Error('Database connection failed'))

      const request = createMockRequest({
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword456!',
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_ERROR')
    })
  })
})
