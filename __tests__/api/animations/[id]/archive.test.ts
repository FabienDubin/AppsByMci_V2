/**
 * @jest-environment node
 */
import { PUT as Archive } from '@/app/api/animations/[id]/archive/route'
import { PUT as Restore } from '@/app/api/animations/[id]/restore/route'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/database', () => ({
  connectDatabase: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

const createMockAnimation = (overrides = {}) => ({
  _id: { toString: () => '507f1f77bcf86cd799439011' },
  userId: { toString: () => 'user123' },
  name: 'Test Animation',
  slug: 'test-animation',
  description: 'Test description',
  status: 'draft',
  pipeline: [],
  publishedAt: null,
  archivedAt: null,
  toJSON: function() {
    return {
      id: '507f1f77bcf86cd799439011',
      userId: 'user123',
      name: this.name,
      slug: this.slug,
      description: this.description,
      status: this.status,
      publishedAt: this.publishedAt,
      archivedAt: this.archivedAt,
      createdAt: new Date(),
      updatedAt: new Date(),
      pipeline: [],
    }
  },
  ...overrides,
})

jest.mock('@/lib/services/animation.service', () => ({
  animationService: {
    archiveAnimation: jest.fn(),
    restoreAnimation: jest.fn(),
    toAnimationResponse: jest.fn((anim) => anim.toJSON()),
  },
}))

jest.mock('@/lib/api-helpers', () => ({
  getAuthenticatedUser: jest.fn(),
}))

import { animationService } from '@/lib/services/animation.service'
import { getAuthenticatedUser } from '@/lib/api-helpers'

describe('PUT /api/animations/[id]/archive', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when not authenticated', async () => {
    ;(getAuthenticatedUser as jest.Mock).mockReturnValue(null)

    const request = new NextRequest('http://localhost/api/animations/123/archive', {
      method: 'PUT',
    })

    const response = await Archive(request, { params: Promise.resolve({ id: '123' }) })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('AUTH_1001')
  })

  it('should archive animation successfully', async () => {
    const archivedAnimation = createMockAnimation({
      status: 'archived',
      archivedAt: new Date(),
    })
    ;(getAuthenticatedUser as jest.Mock).mockReturnValue({ userId: 'user123', role: 'editor' })
    ;(animationService.archiveAnimation as jest.Mock).mockResolvedValue(archivedAnimation)

    const request = new NextRequest('http://localhost/api/animations/507f1f77bcf86cd799439011/archive', {
      method: 'PUT',
    })

    const response = await Archive(request, { params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.status).toBe('archived')
    expect(data.data.archivedAt).toBeDefined()
    expect(animationService.archiveAnimation).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 'user123', 'editor')
  })

  it('should return 400 when animation ID format is invalid', async () => {
    ;(getAuthenticatedUser as jest.Mock).mockReturnValue({ userId: 'user123' })

    const request = new NextRequest('http://localhost/api/animations/nonexistent/archive', {
      method: 'PUT',
    })

    const response = await Archive(request, { params: Promise.resolve({ id: 'nonexistent' }) })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })

  it('should return 404 when animation not found', async () => {
    ;(getAuthenticatedUser as jest.Mock).mockReturnValue({ userId: 'user123' })
    const error = new Error('Animation introuvable')
    ;(error as any).code = 'NOT_FOUND_3001'
    ;(animationService.archiveAnimation as jest.Mock).mockRejectedValue(error)

    const request = new NextRequest('http://localhost/api/animations/507f1f77bcf86cd799439099/archive', {
      method: 'PUT',
    })

    const response = await Archive(request, { params: Promise.resolve({ id: '507f1f77bcf86cd799439099' }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('NOT_FOUND_3001')
  })
})

describe('PUT /api/animations/[id]/restore', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when not authenticated', async () => {
    ;(getAuthenticatedUser as jest.Mock).mockReturnValue(null)

    const request = new NextRequest('http://localhost/api/animations/123/restore', {
      method: 'PUT',
    })

    const response = await Restore(request, { params: Promise.resolve({ id: '123' }) })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('AUTH_1001')
  })

  it('should restore animation to draft when not previously published', async () => {
    const restoredAnimation = createMockAnimation({
      status: 'draft',
      publishedAt: null,
      archivedAt: undefined,
    })
    ;(getAuthenticatedUser as jest.Mock).mockReturnValue({ userId: 'user123', role: 'editor' })
    ;(animationService.restoreAnimation as jest.Mock).mockResolvedValue(restoredAnimation)

    const request = new NextRequest('http://localhost/api/animations/507f1f77bcf86cd799439011/restore', {
      method: 'PUT',
    })

    const response = await Restore(request, { params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.status).toBe('draft')
    expect(data.data.archivedAt).toBeFalsy() // undefined or null
    expect(animationService.restoreAnimation).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 'user123', 'editor')
  })

  it('should restore animation to published when previously published', async () => {
    const restoredAnimation = createMockAnimation({
      status: 'published',
      publishedAt: new Date('2025-11-01'),
      archivedAt: undefined,
    })
    ;(getAuthenticatedUser as jest.Mock).mockReturnValue({ userId: 'user123' })
    ;(animationService.restoreAnimation as jest.Mock).mockResolvedValue(restoredAnimation)

    const request = new NextRequest('http://localhost/api/animations/507f1f77bcf86cd799439011/restore', {
      method: 'PUT',
    })

    const response = await Restore(request, { params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.status).toBe('published')
  })

  it('should return 400 when animation ID format is invalid', async () => {
    ;(getAuthenticatedUser as jest.Mock).mockReturnValue({ userId: 'user123' })

    const request = new NextRequest('http://localhost/api/animations/nonexistent/restore', {
      method: 'PUT',
    })

    const response = await Restore(request, { params: Promise.resolve({ id: 'nonexistent' }) })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })

  it('should return 404 when animation not found', async () => {
    ;(getAuthenticatedUser as jest.Mock).mockReturnValue({ userId: 'user123' })
    const error = new Error('Animation introuvable')
    ;(error as any).code = 'NOT_FOUND_3001'
    ;(animationService.restoreAnimation as jest.Mock).mockRejectedValue(error)

    const request = new NextRequest('http://localhost/api/animations/507f1f77bcf86cd799439099/restore', {
      method: 'PUT',
    })

    const response = await Restore(request, { params: Promise.resolve({ id: '507f1f77bcf86cd799439099' }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
  })
})
