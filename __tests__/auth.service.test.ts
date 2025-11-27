import { AuthService } from '@/lib/services/auth.service'
import User from '@/models/User.model'
import * as authHelpers from '@/lib/auth'

// Mock the User model
jest.mock('@/models/User.model')
// Mock the auth helpers
jest.mock('@/lib/auth')
// Mock the logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}))

const mockUser = User as jest.Mocked<typeof User>
const mockAuthHelpers = authHelpers as jest.Mocked<typeof authHelpers>

describe('AuthService', () => {
  let authService: AuthService

  beforeEach(() => {
    jest.clearAllMocks()
    authService = new AuthService()
  })

  describe('createUser', () => {
    const validEmail = 'test@example.com'
    const validPassword = 'Test123!@#'
    const validName = 'Test User'
    const hashedPassword = '$2b$10$hashedpassword'

    beforeEach(() => {
      mockAuthHelpers.hashPassword.mockResolvedValue(hashedPassword)
    })

    it('should create a new user successfully', async () => {
      const mockCreatedUser = {
        _id: { toString: () => 'user-id-123' },
        email: validEmail.toLowerCase(),
        passwordHash: hashedPassword,
        name: validName,
        role: 'admin' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockUser.findOne.mockResolvedValue(null) // No existing user
      mockUser.create.mockResolvedValue(mockCreatedUser as any)

      const result = await authService.createUser(validEmail, validPassword, validName)

      expect(result).toEqual({
        id: 'user-id-123',
        email: validEmail.toLowerCase(),
        name: validName,
        role: 'admin',
        createdAt: mockCreatedUser.createdAt,
      })
      expect(mockAuthHelpers.hashPassword).toHaveBeenCalledWith(validPassword)
      expect(mockUser.create).toHaveBeenCalledWith({
        email: validEmail.toLowerCase(),
        passwordHash: hashedPassword,
        name: validName,
        role: 'admin',
      })
    })

    it('should create user without name', async () => {
      const mockCreatedUser = {
        _id: { toString: () => 'user-id-123' },
        email: validEmail.toLowerCase(),
        passwordHash: hashedPassword,
        name: undefined,
        role: 'admin' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockUser.findOne.mockResolvedValue(null)
      mockUser.create.mockResolvedValue(mockCreatedUser as any)

      const result = await authService.createUser(validEmail, validPassword)

      expect(result.name).toBeUndefined()
      expect(mockUser.create).toHaveBeenCalledWith({
        email: validEmail.toLowerCase(),
        passwordHash: hashedPassword,
        name: undefined,
        role: 'admin',
      })
    })

    it('should throw AUTH_1003 error if email already exists', async () => {
      const existingUser = {
        _id: { toString: () => 'existing-id' },
        email: validEmail.toLowerCase(),
      }

      mockUser.findOne.mockResolvedValue(existingUser as any)

      await expect(authService.createUser(validEmail, validPassword)).rejects.toMatchObject({
        message: 'Cet email est déjà utilisé',
        code: 'AUTH_1003',
      })

      expect(mockUser.create).not.toHaveBeenCalled()
    })

    it('should convert email to lowercase', async () => {
      const uppercaseEmail = 'TEST@EXAMPLE.COM'
      const mockCreatedUser = {
        _id: { toString: () => 'user-id-123' },
        email: uppercaseEmail.toLowerCase(),
        passwordHash: hashedPassword,
        role: 'admin' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockUser.findOne.mockResolvedValue(null)
      mockUser.create.mockResolvedValue(mockCreatedUser as any)

      await authService.createUser(uppercaseEmail, validPassword)

      expect(mockUser.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: uppercaseEmail.toLowerCase(),
        })
      )
    })

    it('should not return passwordHash in response', async () => {
      const mockCreatedUser = {
        _id: { toString: () => 'user-id-123' },
        email: validEmail.toLowerCase(),
        passwordHash: hashedPassword,
        name: validName,
        role: 'admin' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockUser.findOne.mockResolvedValue(null)
      mockUser.create.mockResolvedValue(mockCreatedUser as any)

      const result = await authService.createUser(validEmail, validPassword, validName)

      expect(result).not.toHaveProperty('passwordHash')
    })
  })

  describe('findUserByEmail', () => {
    it('should find user by email', async () => {
      const mockFoundUser = {
        _id: { toString: () => 'user-id-123' },
        email: 'test@example.com',
        role: 'admin',
      }

      mockUser.findOne.mockResolvedValue(mockFoundUser as any)

      const result = await authService.findUserByEmail('test@example.com')

      expect(result).toEqual(mockFoundUser)
      expect(mockUser.findOne).toHaveBeenCalledWith({ email: 'test@example.com' })
    })

    it('should return null if user not found', async () => {
      mockUser.findOne.mockResolvedValue(null)

      const result = await authService.findUserByEmail('notfound@example.com')

      expect(result).toBeNull()
    })

    it('should convert email to lowercase when searching', async () => {
      mockUser.findOne.mockResolvedValue(null)

      await authService.findUserByEmail('TEST@EXAMPLE.COM')

      expect(mockUser.findOne).toHaveBeenCalledWith({ email: 'test@example.com' })
    })
  })
})
