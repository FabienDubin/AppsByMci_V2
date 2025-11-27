import { AuthService } from '@/lib/services/auth.service'
import User from '@/models/User.model'
import Session from '@/models/Session.model'
import * as authHelpers from '@/lib/auth'

jest.mock('@/models/User.model')
jest.mock('@/models/Session.model')
jest.mock('@/lib/auth')
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}))

const mockUser = User as jest.Mocked<typeof User>
const mockSession = Session as jest.Mocked<typeof Session>
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

      mockUser.findOne.mockResolvedValue(null)
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

  describe('login', () => {
    const validEmail = 'test@example.com'
    const validPassword = 'Test123!@#'
    const hashedPassword = '$2b$10$hashedpassword'
    const hashedRefreshToken = '$2b$10$hashedrefreshtoken'
    const mockAccessToken = 'mock.jwt.token'
    const mockRefreshToken = 'mock-uuid-refresh-token'

    const mockExistingUser = {
      _id: { toString: () => 'user-id-123' },
      email: validEmail,
      passwordHash: hashedPassword,
      name: 'Test User',
      role: 'admin' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    beforeEach(() => {
      mockAuthHelpers.comparePassword.mockResolvedValue(true)
      mockAuthHelpers.generateAccessToken.mockReturnValue(mockAccessToken)
      mockAuthHelpers.generateRefreshToken.mockReturnValue(mockRefreshToken)
      mockAuthHelpers.hashPassword.mockResolvedValue(hashedRefreshToken)
      mockSession.create.mockResolvedValue({} as any)
    })

    it('should login successfully with valid credentials', async () => {
      mockUser.findOne.mockResolvedValue(mockExistingUser as any)

      const result = await authService.login(validEmail, validPassword)

      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        user: {
          id: 'user-id-123',
          email: validEmail,
          name: 'Test User',
          role: 'admin',
          createdAt: mockExistingUser.createdAt,
        },
      })
      expect(mockAuthHelpers.comparePassword).toHaveBeenCalledWith(validPassword, hashedPassword)
      expect(mockAuthHelpers.generateAccessToken).toHaveBeenCalledWith({
        userId: 'user-id-123',
        email: validEmail,
        role: 'admin',
      })
      expect(mockSession.create).toHaveBeenCalled()
    })

    it('should throw AUTH_1001 error if email does not exist', async () => {
      mockUser.findOne.mockResolvedValue(null)

      await expect(authService.login(validEmail, validPassword)).rejects.toMatchObject({
        message: 'Email ou mot de passe incorrect',
        code: 'AUTH_1001',
      })

      expect(mockAuthHelpers.comparePassword).not.toHaveBeenCalled()
      expect(mockSession.create).not.toHaveBeenCalled()
    })

    it('should throw AUTH_1001 error if password is incorrect', async () => {
      mockUser.findOne.mockResolvedValue(mockExistingUser as any)
      mockAuthHelpers.comparePassword.mockResolvedValue(false)

      await expect(authService.login(validEmail, 'wrongpassword')).rejects.toMatchObject({
        message: 'Email ou mot de passe incorrect',
        code: 'AUTH_1001',
      })

      expect(mockAuthHelpers.comparePassword).toHaveBeenCalledWith('wrongpassword', hashedPassword)
      expect(mockSession.create).not.toHaveBeenCalled()
    })

    it('should hash refresh token before storing in session', async () => {
      mockUser.findOne.mockResolvedValue(mockExistingUser as any)

      await authService.login(validEmail, validPassword)

      // Verify refresh token is hashed before storage
      expect(mockAuthHelpers.hashPassword).toHaveBeenCalledWith(mockRefreshToken)
      expect(mockSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          refreshToken: hashedRefreshToken,
        })
      )
    })

    it('should create session with correct expiration (7 days)', async () => {
      mockUser.findOne.mockResolvedValue(mockExistingUser as any)

      await authService.login(validEmail, validPassword)

      const sessionCreateCall = mockSession.create.mock.calls[0][0]
      const expiresAt = sessionCreateCall.expiresAt as Date
      const now = new Date()
      const daysDiff = Math.round((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      expect(daysDiff).toBe(7)
    })

    it('should not return passwordHash in user response', async () => {
      mockUser.findOne.mockResolvedValue(mockExistingUser as any)

      const result = await authService.login(validEmail, validPassword)

      expect(result.user).not.toHaveProperty('passwordHash')
    })
  })

  describe('refreshAccessToken', () => {
    const validRefreshToken = 'valid-refresh-token-uuid'
    const hashedRefreshToken = '$2b$10$hashedrefreshtoken'
    const mockAccessToken = 'new.jwt.token'

    const mockUser = {
      _id: { toString: () => 'user-id-123' },
      email: 'test@example.com',
      role: 'admin' as const,
    }

    const mockSession = {
      userId: mockUser,
      refreshToken: hashedRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    }

    beforeEach(() => {
      mockAuthHelpers.generateAccessToken.mockReturnValue(mockAccessToken)
    })

    it('should return new access token for valid refresh token', async () => {
      // Mock Session.find with populate
      const mockFind = {
        populate: jest.fn().mockResolvedValue([mockSession]),
      }
      ;(Session.find as jest.Mock).mockReturnValue(mockFind)
      mockAuthHelpers.comparePassword.mockResolvedValue(true)

      const result = await authService.refreshAccessToken(validRefreshToken)

      expect(result).toEqual({ accessToken: mockAccessToken })
      expect(mockAuthHelpers.generateAccessToken).toHaveBeenCalledWith({
        userId: 'user-id-123',
        email: 'test@example.com',
        role: 'admin',
      })
    })

    it('should throw AUTH_1002 if no session matches refresh token', async () => {
      const mockFind = {
        populate: jest.fn().mockResolvedValue([mockSession]),
      }
      ;(Session.find as jest.Mock).mockReturnValue(mockFind)
      mockAuthHelpers.comparePassword.mockResolvedValue(false) // Token doesn't match

      await expect(authService.refreshAccessToken('invalid-token')).rejects.toMatchObject({
        message: 'Session expirée. Veuillez vous reconnecter.',
        code: 'AUTH_1002',
      })
    })

    it('should throw AUTH_1002 if no non-expired sessions exist', async () => {
      const mockFind = {
        populate: jest.fn().mockResolvedValue([]), // No sessions
      }
      ;(Session.find as jest.Mock).mockReturnValue(mockFind)

      await expect(authService.refreshAccessToken(validRefreshToken)).rejects.toMatchObject({
        message: 'Session expirée. Veuillez vous reconnecter.',
        code: 'AUTH_1002',
      })
    })

    it('should only check non-expired sessions', async () => {
      const mockFind = {
        populate: jest.fn().mockResolvedValue([mockSession]),
      }
      ;(Session.find as jest.Mock).mockReturnValue(mockFind)
      mockAuthHelpers.comparePassword.mockResolvedValue(true)

      await authService.refreshAccessToken(validRefreshToken)

      // Verify find was called with expiration filter
      expect(Session.find).toHaveBeenCalledWith({
        expiresAt: { $gt: expect.any(Date) },
      })
    })
  })
})
