import { NextRequest } from 'next/server'
import { PUT } from '@/app/api/users/me/route'
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

describe('PUT /api/users/me', () => {
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

    return new NextRequest('http://localhost:3000/api/users/me', {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    })
  }

  describe('Success cases', () => {
    it('should update user profile successfully', async () => {
      const createdAt = new Date()
      const mockUpdatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'New Name',
        role: 'admin' as const,
        createdAt,
      }

      mockAuth.verifyAccessToken.mockReturnValue({
        userId: 'user-123',
        email: 'test@example.com',
        role: 'admin',
      })
      mockUsersService.updateProfile.mockResolvedValue(mockUpdatedUser)

      const request = createMockRequest({ name: 'New Name' })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe('user-123')
      expect(data.data.email).toBe('test@example.com')
      expect(data.data.name).toBe('New Name')
      expect(data.data.role).toBe('admin')
      expect(mockUsersService.updateProfile).toHaveBeenCalledWith('user-123', { name: 'New Name' })
    })
  })

  describe('Authentication errors', () => {
    it('should return 401 if no authorization header', async () => {
      const request = createMockRequest({ name: 'New Name' }, null)
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('AUTH_1002')
    })

    it('should return 401 if authorization header does not start with Bearer', async () => {
      const request = createMockRequest({ name: 'New Name' }, 'InvalidFormat token')
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

      const request = createMockRequest({ name: 'New Name' })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('AUTH_1002')
    })
  })

  describe('Validation errors', () => {
    it('should return 400 if name is missing', async () => {
      mockAuth.verifyAccessToken.mockReturnValue({
        userId: 'user-123',
        email: 'test@example.com',
        role: 'admin',
      })

      const request = createMockRequest({}) // Missing name
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 if name exceeds 100 characters', async () => {
      mockAuth.verifyAccessToken.mockReturnValue({
        userId: 'user-123',
        email: 'test@example.com',
        role: 'admin',
      })

      const longName = 'a'.repeat(101)
      const request = createMockRequest({ name: longName })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
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
      mockUsersService.updateProfile.mockRejectedValue(error)

      const request = createMockRequest({ name: 'New Name' })
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

      mockUsersService.updateProfile.mockRejectedValue(new Error('Database connection failed'))

      const request = createMockRequest({ name: 'New Name' })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_ERROR')
    })
  })
})
