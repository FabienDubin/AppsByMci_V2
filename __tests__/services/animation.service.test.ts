import { AnimationService } from '@/lib/services/animation.service'
import Animation from '@/models/Animation.model'
import mongoose from 'mongoose'

jest.mock('@/models/Animation.model')
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

const mockAnimation = Animation as jest.Mocked<typeof Animation>

describe('AnimationService', () => {
  let service: AnimationService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new AnimationService()
  })

  describe('validateSlugUnique', () => {
    it('should return true if slug is unique', async () => {
      mockAnimation.findOne.mockResolvedValue(null)

      const result = await service.validateSlugUnique('unique-slug')

      expect(result).toBe(true)
      expect(mockAnimation.findOne).toHaveBeenCalledWith({ slug: 'unique-slug' })
    })

    it('should throw VALIDATION_2002 if slug already exists', async () => {
      const existingAnimation = { _id: 'existing-id', slug: 'existing-slug' }
      mockAnimation.findOne.mockResolvedValue(existingAnimation as any)

      await expect(service.validateSlugUnique('existing-slug')).rejects.toThrow(
        'Ce slug existe déjà'
      )
    })

    it('should exclude specified ID when checking uniqueness', async () => {
      const excludeId = '507f1f77bcf86cd799439999'
      mockAnimation.findOne.mockResolvedValue(null)

      await service.validateSlugUnique('test-slug', excludeId)

      expect(mockAnimation.findOne).toHaveBeenCalledWith({
        slug: 'test-slug',
        _id: { $ne: expect.any(mongoose.Types.ObjectId) },
      })
    })
  })

  describe('createDraft', () => {
    const userId = '507f1f77bcf86cd799439010'
    const draftData = {
      name: 'Test Animation',
      description: 'Test description',
      slug: 'test-animation',
    }

    it('should create a draft animation successfully', async () => {
      const mockCreated = {
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(userId),
        ...draftData,
        status: 'draft',
        accessValidation: { type: 'open' },
        pipeline: [],
        questions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockAnimation.findOne.mockResolvedValue(null) // Slug unique
      mockAnimation.create.mockResolvedValue(mockCreated as any)

      const result = await service.createDraft(userId, draftData)

      expect(result).toEqual(mockCreated)
      expect(mockAnimation.findOne).toHaveBeenCalledWith({ slug: draftData.slug })
      expect(mockAnimation.create).toHaveBeenCalledWith({
        userId: expect.any(mongoose.Types.ObjectId),
        name: draftData.name,
        slug: draftData.slug,
        description: draftData.description,
        status: 'draft',
        accessValidation: { type: 'open' },
        pipeline: [],
        questions: [],
      })
    })

    it('should throw VALIDATION_2002 if slug already exists', async () => {
      const existingAnimation = { _id: 'existing', slug: draftData.slug }
      mockAnimation.findOne.mockResolvedValue(existingAnimation as any)

      await expect(service.createDraft(userId, draftData)).rejects.toThrow(
        'Ce slug existe déjà'
      )
      expect(mockAnimation.create).not.toHaveBeenCalled()
    })
  })

  describe('getAnimationById', () => {
    const animationId = '507f1f77bcf86cd799439011'
    const userId = '507f1f77bcf86cd799439012'

    it('should return animation if user owns it', async () => {
      const mockAnimationDoc = {
        _id: new mongoose.Types.ObjectId(animationId),
        userId: new mongoose.Types.ObjectId(userId),
        name: 'Test',
        slug: 'test',
        status: 'draft',
      }

      mockAnimation.findById.mockResolvedValue({
        ...mockAnimationDoc,
        userId: { toString: () => userId },
      } as any)

      const result = await service.getAnimationById(animationId, userId)

      expect(result).toBeDefined()
      expect(mockAnimation.findById).toHaveBeenCalledWith(animationId)
    })

    it('should throw NOT_FOUND_3001 if animation does not exist', async () => {
      mockAnimation.findById.mockResolvedValue(null)

      await expect(service.getAnimationById(animationId, userId)).rejects.toThrow(
        'Animation introuvable'
      )
    })

    it('should throw AUTH_1003 if user does not own animation', async () => {
      const otherUserId = 'other-user-456'
      const mockAnimationDoc = {
        _id: new mongoose.Types.ObjectId(animationId),
        userId: { toString: () => otherUserId },
        name: 'Test',
      }

      mockAnimation.findById.mockResolvedValue(mockAnimationDoc as any)

      await expect(service.getAnimationById(animationId, userId)).rejects.toThrow(
        'Accès refusé à cette animation'
      )
    })
  })

  describe('updateAnimation', () => {
    const animationId = '507f1f77bcf86cd799439013'
    const userId = '507f1f77bcf86cd799439014'
    const updateData = { name: 'Updated Name', description: 'Updated description' }

    it('should update animation successfully', async () => {
      const mockAnimationDoc = {
        _id: new mongoose.Types.ObjectId(animationId),
        userId: { toString: () => userId },
        name: 'Original Name',
        slug: 'original-slug',
        save: jest.fn().mockResolvedValue(true),
        set: jest.fn(),
        markModified: jest.fn(),
      }

      mockAnimation.findById.mockResolvedValue(mockAnimationDoc as any)

      const result = await service.updateAnimation(animationId, userId, updateData)

      expect(mockAnimationDoc.save).toHaveBeenCalled()
      expect(mockAnimation.findById).toHaveBeenCalledWith(animationId)
    })

    it('should validate slug uniqueness if slug is updated', async () => {
      const newSlug = 'new-slug'
      const mockAnimationDoc = {
        _id: new mongoose.Types.ObjectId(animationId),
        userId: { toString: () => userId },
        slug: 'old-slug',
        save: jest.fn().mockResolvedValue(true),
        set: jest.fn(),
        markModified: jest.fn(),
      }

      mockAnimation.findById.mockResolvedValue(mockAnimationDoc as any)
      mockAnimation.findOne.mockResolvedValue(null) // New slug is unique

      await service.updateAnimation(animationId, userId, { slug: newSlug })

      expect(mockAnimation.findOne).toHaveBeenCalledWith({
        slug: newSlug,
        _id: { $ne: expect.any(mongoose.Types.ObjectId) },
      })
    })

    it('should throw AUTH_1003 if user does not own animation', async () => {
      const otherUserId = 'other-user-456'
      const mockAnimationDoc = {
        _id: new mongoose.Types.ObjectId(animationId),
        userId: { toString: () => otherUserId },
      }

      mockAnimation.findById.mockResolvedValue(mockAnimationDoc as any)

      await expect(
        service.updateAnimation(animationId, userId, updateData)
      ).rejects.toThrow('Accès refusé à cette animation')
    })
  })

  describe('toAnimationResponse', () => {
    it('should transform animation to response format', () => {
      const mockAnimation = {
        toJSON: () => ({
          _id: 'animation-123',
          id: 'animation-123',
          userId: 'user-123',
          name: 'Test Animation',
          slug: 'test-animation',
          description: 'Test',
          status: 'draft',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      }

      const result = service.toAnimationResponse(mockAnimation as any)

      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('name', 'Test Animation')
      expect(result).toHaveProperty('slug', 'test-animation')
    })

    it('should include accessConfig and baseFields in response (Step 2)', () => {
      const mockAnimation = {
        toJSON: () => ({
          _id: 'animation-123',
          id: 'animation-123',
          userId: 'user-123',
          name: 'Test Animation',
          slug: 'test-animation',
          description: 'Test',
          status: 'draft',
          accessConfig: {
            type: 'code',
            code: 'TEST2025',
          },
          baseFields: {
            name: {
              enabled: true,
              required: true,
              label: 'Nom',
              placeholder: 'Ex: Jean Dupont',
            },
            firstName: {
              enabled: false,
              required: true,
            },
            email: {
              enabled: false,
              required: true,
            },
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      }

      const result = service.toAnimationResponse(mockAnimation as any)

      expect(result).toHaveProperty('accessConfig')
      expect(result.accessConfig).toEqual({
        type: 'code',
        code: 'TEST2025',
      })
      expect(result).toHaveProperty('baseFields')
      expect(result.baseFields.name.enabled).toBe(true)
      expect(result.baseFields.name.label).toBe('Nom')
    })
  })

  describe('updateAnimation with Step 2 data', () => {
    const animationId = '507f1f77bcf86cd799439015'
    const userId = '507f1f77bcf86cd799439016'

    it('should update accessConfig successfully', async () => {
      const step2Data = {
        accessConfig: {
          type: 'email-domain',
          emailDomains: ['@company.com', '@partner.fr'],
        },
        baseFields: {
          name: {
            enabled: true,
            required: true,
            label: 'Nom complet',
            placeholder: 'Entrez votre nom',
          },
          firstName: {
            enabled: false,
            required: true,
          },
          email: {
            enabled: true,
            required: true,
            label: 'Email professionnel',
            placeholder: 'nom@company.com',
          },
        },
      }

      const mockAnimationDoc = {
        _id: new mongoose.Types.ObjectId(animationId),
        userId: { toString: () => userId },
        name: 'Test Animation',
        slug: 'test-animation',
        save: jest.fn().mockResolvedValue(true),
        set: jest.fn(),
        markModified: jest.fn(),
      }

      mockAnimation.findById.mockResolvedValue(mockAnimationDoc as any)

      const result = await service.updateAnimation(animationId, userId, step2Data as any)

      expect(mockAnimationDoc.save).toHaveBeenCalled()
      expect(mockAnimation.findById).toHaveBeenCalledWith(animationId)
      expect(result).toBeDefined()
    })
  })
})
