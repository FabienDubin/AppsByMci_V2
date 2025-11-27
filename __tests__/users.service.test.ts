import { UsersService } from '@/lib/services/users.service'
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

describe('UsersService', () => {
  let usersService: UsersService

  beforeEach(() => {
    jest.clearAllMocks()
    usersService = new UsersService()
  })

  describe('findById', () => {
    it('should find and return user by ID', async () => {
      const mockFoundUser = {
        _id: { toString: () => 'user-123' },
        email: 'test@example.com',
        passwordHash: '$2b$10$hashedpassword',
        name: 'Test User',
        role: 'admin' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockUser.findById.mockResolvedValue(mockFoundUser as any)

      const result = await usersService.findById('user-123')

      expect(result).toEqual(mockFoundUser)
      expect(mockUser.findById).toHaveBeenCalledWith('user-123')
    })

    it('should throw USER_1001 if user not found', async () => {
      mockUser.findById.mockResolvedValue(null)

      await expect(usersService.findById('non-existent-id')).rejects.toThrow(
        'Utilisateur non trouvé'
      )
      await expect(usersService.findById('non-existent-id')).rejects.toHaveProperty(
        'code',
        'USER_1001'
      )
    })
  })

  describe('updateProfile', () => {
    it('should update user name successfully', async () => {
      const mockFoundUser = {
        _id: { toString: () => 'user-123' },
        email: 'test@example.com',
        passwordHash: '$2b$10$hashedpassword',
        name: 'Old Name',
        role: 'admin' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        save: jest.fn().mockResolvedValue(true),
      }

      mockUser.findById.mockResolvedValue(mockFoundUser as any)

      const result = await usersService.updateProfile('user-123', { name: 'New Name' })

      expect(mockFoundUser.name).toBe('New Name')
      expect(mockFoundUser.save).toHaveBeenCalled()
      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        name: 'New Name',
        role: 'admin',
        createdAt: mockFoundUser.createdAt,
      })
    })

    it('should throw USER_1001 if user not found', async () => {
      mockUser.findById.mockResolvedValue(null)

      await expect(
        usersService.updateProfile('non-existent-id', { name: 'New Name' })
      ).rejects.toThrow('Utilisateur non trouvé')
    })
  })

  describe('changePassword', () => {
    const userId = 'user-123'
    const currentPassword = 'OldPassword123!'
    const newPassword = 'NewPassword456!'
    const hashedNewPassword = '$2b$10$newhashedpassword'

    it('should change password successfully and invalidate all sessions', async () => {
      const mockFoundUser = {
        _id: { toString: () => userId },
        email: 'test@example.com',
        passwordHash: '$2b$10$oldhashedpassword',
        name: 'Test User',
        role: 'admin' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        save: jest.fn().mockResolvedValue(true),
      }

      mockUser.findById.mockResolvedValue(mockFoundUser as any)
      mockAuthHelpers.comparePassword.mockResolvedValue(true)
      mockAuthHelpers.hashPassword.mockResolvedValue(hashedNewPassword)
      mockSession.deleteMany.mockResolvedValue({ deletedCount: 2 } as any)

      await usersService.changePassword(userId, currentPassword, newPassword)

      expect(mockAuthHelpers.comparePassword).toHaveBeenCalledWith(
        currentPassword,
        '$2b$10$oldhashedpassword'
      )
      expect(mockAuthHelpers.hashPassword).toHaveBeenCalledWith(newPassword)
      expect(mockFoundUser.passwordHash).toBe(hashedNewPassword)
      expect(mockFoundUser.save).toHaveBeenCalled()
      expect(mockSession.deleteMany).toHaveBeenCalledWith({ userId })
    })

    it('should throw AUTH_1005 if current password is incorrect', async () => {
      const mockFoundUser = {
        _id: { toString: () => userId },
        email: 'test@example.com',
        passwordHash: '$2b$10$oldhashedpassword',
        name: 'Test User',
        role: 'admin' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        save: jest.fn().mockResolvedValue(true),
      }

      mockUser.findById.mockResolvedValue(mockFoundUser as any)
      mockAuthHelpers.comparePassword.mockResolvedValue(false)

      await expect(
        usersService.changePassword(userId, 'WrongPassword', newPassword)
      ).rejects.toThrow('Mot de passe actuel incorrect')
      await expect(
        usersService.changePassword(userId, 'WrongPassword', newPassword)
      ).rejects.toHaveProperty('code', 'AUTH_1005')

      expect(mockFoundUser.save).not.toHaveBeenCalled()
      expect(mockSession.deleteMany).not.toHaveBeenCalled()
    })

    it('should throw USER_1001 if user not found', async () => {
      mockUser.findById.mockResolvedValue(null)

      await expect(
        usersService.changePassword('non-existent-id', currentPassword, newPassword)
      ).rejects.toThrow('Utilisateur non trouvé')
    })
  })

  describe('invalidateAllSessions', () => {
    it('should delete all sessions for a user', async () => {
      mockSession.deleteMany.mockResolvedValue({ deletedCount: 3 } as any)

      await usersService.invalidateAllSessions('user-123')

      expect(mockSession.deleteMany).toHaveBeenCalledWith({ userId: 'user-123' })
    })

    it('should handle case with no sessions to delete', async () => {
      mockSession.deleteMany.mockResolvedValue({ deletedCount: 0 } as any)

      await usersService.invalidateAllSessions('user-123')

      expect(mockSession.deleteMany).toHaveBeenCalledWith({ userId: 'user-123' })
    })
  })
})
