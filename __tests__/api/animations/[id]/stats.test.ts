/**
 * @jest-environment node
 */

// Tests for GET /api/animations/[id]/stats endpoint (Story 5.2 AC3)

import { NextRequest } from 'next/server'

// Mock database connection
jest.mock('@/lib/database', () => ({
  connectDatabase: jest.fn().mockResolvedValue(undefined),
}))

// Mock animation service
const mockGetAnimationById = jest.fn()

jest.mock('@/lib/services/animation.service', () => ({
  animationService: {
    getAnimationById: mockGetAnimationById,
  },
}))

// Mock generation service
const mockGetAnimationDetailStats = jest.fn()

jest.mock('@/lib/services/generation.service', () => ({
  generationService: {
    getAnimationDetailStats: mockGetAnimationDetailStats,
  },
}))

// Mock auth helper
const mockGetAuthenticatedUser = jest.fn()

jest.mock('@/lib/api-helpers', () => ({
  getAuthenticatedUser: mockGetAuthenticatedUser,
}))

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}))

import { GET } from '@/app/api/animations/[id]/stats/route'

describe('GET /api/animations/[id]/stats', () => {
  const animationId = '507f1f77bcf86cd799439011'
  const userId = '507f1f77bcf86cd799439022'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when not authenticated', async () => {
    mockGetAuthenticatedUser.mockReturnValue(null)

    const request = new NextRequest(`http://localhost/api/animations/${animationId}/stats`)
    const response = await GET(request, { params: Promise.resolve({ id: animationId }) })
    const result = await response.json()

    expect(response.status).toBe(401)
    expect(result.success).toBe(false)
    expect(result.error.code).toBe('AUTH_1001')
  })

  it('should return 404 when animation not found', async () => {
    mockGetAuthenticatedUser.mockReturnValue({ userId, role: 'admin' })

    const error = new Error('Animation not found')
    ;(error as any).code = 'NOT_FOUND_3001'
    mockGetAnimationById.mockRejectedValue(error)

    const request = new NextRequest(`http://localhost/api/animations/${animationId}/stats`)
    const response = await GET(request, { params: Promise.resolve({ id: animationId }) })
    const result = await response.json()

    expect(response.status).toBe(404)
    expect(result.success).toBe(false)
    expect(result.error.code).toBe('NOT_FOUND_3001')
  })

  it('should return 403 when user does not own animation', async () => {
    mockGetAuthenticatedUser.mockReturnValue({ userId, role: 'editor' })

    const error = new Error('Access denied')
    ;(error as any).code = 'AUTH_1003'
    mockGetAnimationById.mockRejectedValue(error)

    const request = new NextRequest(`http://localhost/api/animations/${animationId}/stats`)
    const response = await GET(request, { params: Promise.resolve({ id: animationId }) })
    const result = await response.json()

    expect(response.status).toBe(403)
    expect(result.success).toBe(false)
    expect(result.error.code).toBe('AUTH_1003')
  })

  it('should return stats when animation exists and user has access', async () => {
    mockGetAuthenticatedUser.mockReturnValue({ userId, role: 'admin' })
    mockGetAnimationById.mockResolvedValue({ _id: animationId, userId })

    const mockStats = {
      totalParticipations: 100,
      successfulGenerations: 85,
      failedGenerations: 10,
      successRate: 85,
      averageGenerationTime: 15,
      emailsSent: 75,
    }
    mockGetAnimationDetailStats.mockResolvedValue(mockStats)

    const request = new NextRequest(`http://localhost/api/animations/${animationId}/stats`)
    const response = await GET(request, { params: Promise.resolve({ id: animationId }) })
    const result = await response.json()

    expect(response.status).toBe(200)
    expect(result.success).toBe(true)
    expect(result.data).toEqual(mockStats)
    expect(mockGetAnimationDetailStats).toHaveBeenCalledWith(animationId)
  })

  it('should return zero stats for animation without generations', async () => {
    mockGetAuthenticatedUser.mockReturnValue({ userId, role: 'admin' })
    mockGetAnimationById.mockResolvedValue({ _id: animationId, userId })

    const emptyStats = {
      totalParticipations: 0,
      successfulGenerations: 0,
      failedGenerations: 0,
      successRate: 0,
      averageGenerationTime: 0,
      emailsSent: 0,
    }
    mockGetAnimationDetailStats.mockResolvedValue(emptyStats)

    const request = new NextRequest(`http://localhost/api/animations/${animationId}/stats`)
    const response = await GET(request, { params: Promise.resolve({ id: animationId }) })
    const result = await response.json()

    expect(response.status).toBe(200)
    expect(result.success).toBe(true)
    expect(result.data.totalParticipations).toBe(0)
  })
})
