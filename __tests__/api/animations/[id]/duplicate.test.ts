/**
 * @jest-environment node
 */
import { POST } from '@/app/api/animations/[id]/duplicate/route'
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

const mockAnimation = {
  _id: { toString: () => '507f1f77bcf86cd799439011' },
  userId: { toString: () => 'user123' },
  name: 'Test Animation',
  slug: 'test-animation',
  description: 'Test description',
  status: 'draft',
  pipeline: [],
  accessConfig: { type: 'none' },
  toJSON: () => ({
    id: '507f1f77bcf86cd799439011',
    userId: 'user123',
    name: 'Test Animation',
    slug: 'test-animation',
    description: 'Test description',
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
    pipeline: [],
  }),
}

const mockDuplicatedAnimation = {
  ...mockAnimation,
  _id: { toString: () => '507f1f77bcf86cd799439012' },
  name: 'Test Animation (copie)',
  slug: `test-animation-copy-${Date.now()}`,
  toJSON: () => ({
    id: '507f1f77bcf86cd799439012',
    userId: 'user123',
    name: 'Test Animation (copie)',
    slug: `test-animation-copy-${Date.now()}`,
    description: 'Test description',
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
    pipeline: [],
  }),
}

jest.mock('@/lib/services/animation.service', () => ({
  animationService: {
    duplicateAnimation: jest.fn(),
    toAnimationResponse: jest.fn((anim) => anim.toJSON()),
  },
}))

jest.mock('@/lib/api-helpers', () => ({
  getAuthenticatedUser: jest.fn(),
}))

import { animationService } from '@/lib/services/animation.service'
import { getAuthenticatedUser } from '@/lib/api-helpers'

describe('POST /api/animations/[id]/duplicate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when not authenticated', async () => {
    ;(getAuthenticatedUser as jest.Mock).mockReturnValue(null)

    const request = new NextRequest('http://localhost/api/animations/123/duplicate', {
      method: 'POST',
    })

    const response = await POST(request, { params: Promise.resolve({ id: '123' }) })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('AUTH_1001')
  })

  it('should duplicate animation successfully', async () => {
    ;(getAuthenticatedUser as jest.Mock).mockReturnValue({ userId: 'user123' })
    ;(animationService.duplicateAnimation as jest.Mock).mockResolvedValue(mockDuplicatedAnimation)

    const request = new NextRequest('http://localhost/api/animations/507f1f77bcf86cd799439011/duplicate', {
      method: 'POST',
    })

    const response = await POST(request, { params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.name).toContain('(copie)')
    expect(data.data.status).toBe('draft')
    expect(animationService.duplicateAnimation).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 'user123')
  })

  it('should return 400 when animation ID format is invalid', async () => {
    ;(getAuthenticatedUser as jest.Mock).mockReturnValue({ userId: 'user123' })

    const request = new NextRequest('http://localhost/api/animations/nonexistent/duplicate', {
      method: 'POST',
    })

    const response = await POST(request, { params: Promise.resolve({ id: 'nonexistent' }) })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })

  it('should return 404 when animation not found', async () => {
    ;(getAuthenticatedUser as jest.Mock).mockReturnValue({ userId: 'user123' })
    const error = new Error('Animation introuvable')
    ;(error as any).code = 'NOT_FOUND_3001'
    ;(animationService.duplicateAnimation as jest.Mock).mockRejectedValue(error)

    const request = new NextRequest('http://localhost/api/animations/507f1f77bcf86cd799439099/duplicate', {
      method: 'POST',
    })

    const response = await POST(request, { params: Promise.resolve({ id: '507f1f77bcf86cd799439099' }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('NOT_FOUND_3001')
  })

  it('should return 403 when user does not own animation', async () => {
    ;(getAuthenticatedUser as jest.Mock).mockReturnValue({ userId: 'other-user' })
    const error = new Error('Accès refusé')
    ;(error as any).code = 'AUTH_1003'
    ;(animationService.duplicateAnimation as jest.Mock).mockRejectedValue(error)

    const request = new NextRequest('http://localhost/api/animations/507f1f77bcf86cd799439011/duplicate', {
      method: 'POST',
    })

    const response = await POST(request, { params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }) })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('AUTH_1003')
  })
})
