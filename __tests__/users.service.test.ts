import { UsersService } from '@/lib/services/users.service'
import User from '@/models/User.model'
import Session from '@/models/Session.model'
import Animation from '@/models/Animation.model'
import * as authHelpers from '@/lib/auth'

jest.mock('@/models/User.model')
jest.mock('@/models/Session.model')
jest.mock('@/models/Animation.model')
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
const mockAnimation = Animation as jest.Mocked<typeof Animation>
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

  // ============================================
  // Admin CRUD Operations Tests (Story 5.0)
  // ============================================

  describe('getUsers', () => {
    it('should return all users with animation counts', async () => {
      const mockUsers = [
        {
          _id: { toString: () => 'user-1' },
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin' as const,
          createdAt: new Date('2024-01-01'),
        },
        {
          _id: { toString: () => 'user-2' },
          email: 'editor@example.com',
          name: 'Editor User',
          role: 'editor' as const,
          createdAt: new Date('2024-01-02'),
        },
      ]

      mockUser.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockUsers),
      } as any)
      mockAnimation.aggregate.mockResolvedValue([
        { _id: { toString: () => 'user-1' }, count: 5 },
        { _id: { toString: () => 'user-2' }, count: 3 },
      ] as any)

      const result = await usersService.getUsers()

      expect(result).toHaveLength(2)
      expect(result[0].animationCount).toBe(5)
      expect(result[1].animationCount).toBe(3)
    })

    it('should filter by role', async () => {
      mockUser.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      } as any)
      mockAnimation.aggregate.mockResolvedValue([])

      await usersService.getUsers({ role: 'editor' })

      expect(mockUser.find).toHaveBeenCalledWith(expect.objectContaining({ role: 'editor' }))
    })

    it('should search by email or name (case-insensitive)', async () => {
      mockUser.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      } as any)
      mockAnimation.aggregate.mockResolvedValue([])

      await usersService.getUsers({ search: 'test' })

      expect(mockUser.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: [{ email: expect.any(RegExp) }, { name: expect.any(RegExp) }],
        })
      )
    })
  })

  describe('createUser', () => {
    it('should create a new user with hashed password', async () => {
      const userData = {
        email: 'new@example.com',
        password: 'Password123!',
        name: 'New User',
        role: 'editor' as const,
      }

      mockUser.findOne.mockResolvedValue(null)
      mockAuthHelpers.hashPassword.mockResolvedValue('hashed-password')
      mockUser.create.mockResolvedValue({
        _id: { toString: () => 'new-user-id' },
        email: 'new@example.com',
        name: 'New User',
        role: 'editor',
        createdAt: new Date(),
      } as any)

      const result = await usersService.createUser(userData)

      expect(mockAuthHelpers.hashPassword).toHaveBeenCalledWith('Password123!')
      expect(mockUser.create).toHaveBeenCalledWith({
        email: 'new@example.com',
        passwordHash: 'hashed-password',
        name: 'New User',
        role: 'editor',
      })
      expect(result.email).toBe('new@example.com')
      expect(result.role).toBe('editor')
    })

    it('should throw USER_1002 if email already exists', async () => {
      mockUser.findOne.mockResolvedValue({ email: 'existing@example.com' } as any)

      await expect(
        usersService.createUser({
          email: 'existing@example.com',
          password: 'Password123!',
          name: 'Test',
          role: 'viewer',
        })
      ).rejects.toThrow('Cet email est déjà utilisé')
      await expect(
        usersService.createUser({
          email: 'existing@example.com',
          password: 'Password123!',
          name: 'Test',
          role: 'viewer',
        })
      ).rejects.toHaveProperty('code', 'USER_1002')
    })
  })

  describe('updateUser', () => {
    it('should update user name and role', async () => {
      const mockFoundUser = {
        _id: { toString: () => 'user-123' },
        email: 'test@example.com',
        name: 'Old Name',
        role: 'viewer' as const,
        createdAt: new Date(),
        save: jest.fn().mockResolvedValue(true),
      }

      mockUser.findById.mockResolvedValue(mockFoundUser as any)

      const result = await usersService.updateUser('user-123', { name: 'New Name', role: 'editor' })

      expect(mockFoundUser.name).toBe('New Name')
      expect(mockFoundUser.role).toBe('editor')
      expect(mockFoundUser.save).toHaveBeenCalled()
      expect(result.name).toBe('New Name')
      expect(result.role).toBe('editor')
    })

    it('should throw USER_1001 if user not found', async () => {
      mockUser.findById.mockResolvedValue(null)

      await expect(usersService.updateUser('non-existent', { name: 'Test' })).rejects.toThrow(
        'Utilisateur non trouvé'
      )
    })
  })

  describe('deleteUser', () => {
    it('should delete user and archive their animations', async () => {
      const mockFoundUser = {
        _id: { toString: () => 'user-to-delete' },
        email: 'delete@example.com',
        name: 'Delete Me',
        role: 'viewer' as const,
        createdAt: new Date(),
      }

      mockUser.findById.mockResolvedValue(mockFoundUser as any)
      mockAnimation.updateMany.mockResolvedValue({ modifiedCount: 3 } as any)
      mockSession.deleteMany.mockResolvedValue({ deletedCount: 1 } as any)
      mockUser.findByIdAndDelete.mockResolvedValue(mockFoundUser as any)

      await usersService.deleteUser('user-to-delete', 'admin-user-id')

      expect(mockAnimation.updateMany).toHaveBeenCalledWith(
        { userId: mockFoundUser._id },
        { $set: { status: 'archived', archivedAt: expect.any(Date) } }
      )
      expect(mockSession.deleteMany).toHaveBeenCalledWith({ userId: mockFoundUser._id })
      expect(mockUser.findByIdAndDelete).toHaveBeenCalledWith('user-to-delete')
    })

    it('should throw USER_1003 if attempting self-delete', async () => {
      await expect(usersService.deleteUser('same-user-id', 'same-user-id')).rejects.toThrow(
        'Vous ne pouvez pas vous supprimer'
      )
      await expect(usersService.deleteUser('same-user-id', 'same-user-id')).rejects.toHaveProperty(
        'code',
        'USER_1003'
      )
    })

    it('should throw USER_1001 if user not found', async () => {
      mockUser.findById.mockResolvedValue(null)

      await expect(usersService.deleteUser('non-existent', 'admin-id')).rejects.toThrow(
        'Utilisateur non trouvé'
      )
    })
  })

  describe('getUserAnimationCounts', () => {
    it('should return a map of user IDs to animation counts', async () => {
      mockAnimation.aggregate.mockResolvedValue([
        { _id: { toString: () => 'user-1' }, count: 10 },
        { _id: { toString: () => 'user-2' }, count: 5 },
      ] as any)

      const result = await usersService.getUserAnimationCounts(['user-1', 'user-2'])

      expect(result.get('user-1')).toBe(10)
      expect(result.get('user-2')).toBe(5)
    })

    it('should return empty map for empty user IDs array', async () => {
      const result = await usersService.getUserAnimationCounts([])

      expect(result.size).toBe(0)
      expect(mockAnimation.aggregate).not.toHaveBeenCalled()
    })
  })
})
