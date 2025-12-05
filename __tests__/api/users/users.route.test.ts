import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/users/route'
import { PUT, DELETE } from '@/app/api/users/[id]/route'
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

describe('Users Admin API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDatabase.connectDatabase.mockResolvedValue({} as typeof import('mongoose'))
  })

  // Helper to create mock request
  const createMockRequest = (
    url: string,
    method: string,
    body?: any,
    authHeader: string | null = 'Bearer admin-token'
  ): NextRequest => {
    const headers = new Headers()
    if (authHeader) {
      headers.set('authorization', authHeader)
    }

    const requestInit = {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    }

    return new NextRequest(url, requestInit)
  }

  describe('GET /api/users', () => {
    beforeEach(() => {
      mockAuth.verifyAccessToken.mockReturnValue({
        userId: 'admin-id',
        email: 'admin@example.com',
        role: 'admin',
      })
    })

    it('should return all users with animation counts', async () => {
      const mockUsers = [
        { id: 'user-1', email: 'admin@test.com', name: 'Admin', role: 'admin', createdAt: new Date(), animationCount: 5 },
        { id: 'user-2', email: 'editor@test.com', name: 'Editor', role: 'editor', createdAt: new Date(), animationCount: 3 },
      ]
      mockUsersService.getUsers.mockResolvedValue(mockUsers as any)

      const request = createMockRequest('http://localhost:3000/api/users', 'GET')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2)
      expect(data.data[0].animationCount).toBe(5)
    })

    it('should filter by role', async () => {
      mockUsersService.getUsers.mockResolvedValue([])

      const request = createMockRequest('http://localhost:3000/api/users?role=editor', 'GET')
      await GET(request)

      expect(mockUsersService.getUsers).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'editor' })
      )
    })

    it('should search by query string', async () => {
      mockUsersService.getUsers.mockResolvedValue([])

      const request = createMockRequest('http://localhost:3000/api/users?search=test', 'GET')
      await GET(request)

      expect(mockUsersService.getUsers).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'test' })
      )
    })

    it('should return 403 for non-admin users', async () => {
      mockAuth.verifyAccessToken.mockReturnValue({
        userId: 'editor-id',
        email: 'editor@example.com',
        role: 'editor',
      })

      const request = createMockRequest('http://localhost:3000/api/users', 'GET')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('FORBIDDEN')
    })

    it('should return 401 without auth token', async () => {
      const request = createMockRequest('http://localhost:3000/api/users', 'GET', undefined, null)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('UNAUTHORIZED')
    })
  })

  describe('POST /api/users', () => {
    beforeEach(() => {
      mockAuth.verifyAccessToken.mockReturnValue({
        userId: 'admin-id',
        email: 'admin@example.com',
        role: 'admin',
      })
    })

    it('should create a new user', async () => {
      const newUser = { id: 'new-id', email: 'new@test.com', name: 'New User', role: 'editor', createdAt: new Date() }
      mockUsersService.createUser.mockResolvedValue(newUser as any)

      const request = createMockRequest('http://localhost:3000/api/users', 'POST', {
        email: 'new@test.com',
        password: 'Password123',
        name: 'New User',
        role: 'editor',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.email).toBe('new@test.com')
    })

    it('should return 409 if email already exists', async () => {
      const error = new Error('Cet email est déjà utilisé')
      ;(error as any).code = 'USER_1002'
      mockUsersService.createUser.mockRejectedValue(error)

      const request = createMockRequest('http://localhost:3000/api/users', 'POST', {
        email: 'existing@test.com',
        password: 'Password123',
        name: 'Existing',
        role: 'viewer',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('CONFLICT')
    })

    it('should return 400 for invalid data', async () => {
      const request = createMockRequest('http://localhost:3000/api/users', 'POST', {
        email: 'invalid-email',
        password: 'short',
        name: '',
        role: 'invalid',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 403 for non-admin users', async () => {
      mockAuth.verifyAccessToken.mockReturnValue({
        userId: 'viewer-id',
        email: 'viewer@example.com',
        role: 'viewer',
      })

      const request = createMockRequest('http://localhost:3000/api/users', 'POST', {
        email: 'new@test.com',
        password: 'Password123',
        name: 'New User',
        role: 'editor',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
    })
  })

  describe('PUT /api/users/[id]', () => {
    beforeEach(() => {
      mockAuth.verifyAccessToken.mockReturnValue({
        userId: 'admin-id',
        email: 'admin@example.com',
        role: 'admin',
      })
    })

    it('should update user name and role', async () => {
      const updatedUser = { id: 'user-123', email: 'test@test.com', name: 'Updated Name', role: 'editor', createdAt: new Date() }
      mockUsersService.updateUser.mockResolvedValue(updatedUser as any)

      const request = createMockRequest('http://localhost:3000/api/users/507f1f77bcf86cd799439011', 'PUT', {
        name: 'Updated Name',
        role: 'editor',
      })
      const response = await PUT(request, { params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.name).toBe('Updated Name')
    })

    it('should return 404 if user not found', async () => {
      const error = new Error('Utilisateur non trouvé')
      ;(error as any).code = 'USER_1001'
      mockUsersService.updateUser.mockRejectedValue(error)

      const request = createMockRequest('http://localhost:3000/api/users/507f1f77bcf86cd799439011', 'PUT', {
        name: 'Test',
      })
      const response = await PUT(request, { params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('NOT_FOUND')
    })

    it('should return 400 for invalid ObjectId', async () => {
      const request = createMockRequest('http://localhost:3000/api/users/invalid-id', 'PUT', {
        name: 'Test',
      })
      const response = await PUT(request, { params: Promise.resolve({ id: 'invalid-id' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('DELETE /api/users/[id]', () => {
    beforeEach(() => {
      mockAuth.verifyAccessToken.mockReturnValue({
        userId: 'admin-id',
        email: 'admin@example.com',
        role: 'admin',
      })
    })

    it('should delete user and archive animations', async () => {
      mockUsersService.deleteUser.mockResolvedValue(undefined)

      const request = createMockRequest('http://localhost:3000/api/users/507f1f77bcf86cd799439011', 'DELETE')
      const response = await DELETE(request, { params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockUsersService.deleteUser).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 'admin-id')
    })

    it('should return 403 if attempting self-delete', async () => {
      // Use admin-id as the same as the authenticated user's id (24 hex chars)
      mockAuth.verifyAccessToken.mockReturnValue({
        userId: '507f1f77bcf86cd799439011', // Same ID as the one being deleted
        email: 'admin@example.com',
        role: 'admin',
      })

      const error = new Error('Vous ne pouvez pas vous supprimer')
      ;(error as any).code = 'USER_1003'
      mockUsersService.deleteUser.mockRejectedValue(error)

      const request = createMockRequest('http://localhost:3000/api/users/507f1f77bcf86cd799439011', 'DELETE')
      const response = await DELETE(request, { params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }) })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('FORBIDDEN')
    })

    it('should return 404 if user not found', async () => {
      const error = new Error('Utilisateur non trouvé')
      ;(error as any).code = 'USER_1001'
      mockUsersService.deleteUser.mockRejectedValue(error)

      const request = createMockRequest('http://localhost:3000/api/users/507f1f77bcf86cd799439011', 'DELETE')
      const response = await DELETE(request, { params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('NOT_FOUND')
    })
  })
})
