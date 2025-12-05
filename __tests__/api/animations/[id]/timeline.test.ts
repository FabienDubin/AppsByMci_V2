/**
 * @jest-environment node
 */

// Tests for GET /api/animations/[id]/timeline endpoint (Story 5.2 AC4)

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
const mockGetAnimationTimeline = jest.fn()

jest.mock('@/lib/services/generation.service', () => ({
  generationService: {
    getAnimationTimeline: mockGetAnimationTimeline,
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

import { GET } from '@/app/api/animations/[id]/timeline/route'

describe('GET /api/animations/[id]/timeline', () => {
  const animationId = '507f1f77bcf86cd799439011'
  const userId = '507f1f77bcf86cd799439022'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when not authenticated', async () => {
    mockGetAuthenticatedUser.mockReturnValue(null)

    const request = new NextRequest(`http://localhost/api/animations/${animationId}/timeline`)
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

    const request = new NextRequest(`http://localhost/api/animations/${animationId}/timeline`)
    const response = await GET(request, { params: Promise.resolve({ id: animationId }) })
    const result = await response.json()

    expect(response.status).toBe(404)
    expect(result.success).toBe(false)
  })

  it('should return timeline with default 30d period', async () => {
    mockGetAuthenticatedUser.mockReturnValue({ userId, role: 'admin' })
    mockGetAnimationById.mockResolvedValue({ _id: animationId, userId })

    const mockTimeline = {
      period: '30d',
      data: [
        { date: '2025-12-03', count: 10 },
        { date: '2025-12-04', count: 15 },
        { date: '2025-12-05', count: 8 },
      ],
    }
    mockGetAnimationTimeline.mockResolvedValue(mockTimeline)

    const request = new NextRequest(`http://localhost/api/animations/${animationId}/timeline`)
    const response = await GET(request, { params: Promise.resolve({ id: animationId }) })
    const result = await response.json()

    expect(response.status).toBe(200)
    expect(result.success).toBe(true)
    expect(result.data.period).toBe('30d')
    expect(result.data.data).toHaveLength(3)
    expect(mockGetAnimationTimeline).toHaveBeenCalledWith(animationId, '30d')
  })

  it('should return timeline with 7d period', async () => {
    mockGetAuthenticatedUser.mockReturnValue({ userId, role: 'admin' })
    mockGetAnimationById.mockResolvedValue({ _id: animationId, userId })

    const mockTimeline = {
      period: '7d',
      data: [{ date: '2025-12-05', count: 5 }],
    }
    mockGetAnimationTimeline.mockResolvedValue(mockTimeline)

    const request = new NextRequest(`http://localhost/api/animations/${animationId}/timeline?period=7d`)
    const response = await GET(request, { params: Promise.resolve({ id: animationId }) })
    const result = await response.json()

    expect(response.status).toBe(200)
    expect(result.data.period).toBe('7d')
    expect(mockGetAnimationTimeline).toHaveBeenCalledWith(animationId, '7d')
  })

  it('should return timeline with all period', async () => {
    mockGetAuthenticatedUser.mockReturnValue({ userId, role: 'admin' })
    mockGetAnimationById.mockResolvedValue({ _id: animationId, userId })

    const mockTimeline = {
      period: 'all',
      data: [
        { date: '2025-11-01', count: 5 },
        { date: '2025-12-05', count: 20 },
      ],
    }
    mockGetAnimationTimeline.mockResolvedValue(mockTimeline)

    const request = new NextRequest(`http://localhost/api/animations/${animationId}/timeline?period=all`)
    const response = await GET(request, { params: Promise.resolve({ id: animationId }) })
    const result = await response.json()

    expect(response.status).toBe(200)
    expect(result.data.period).toBe('all')
    expect(mockGetAnimationTimeline).toHaveBeenCalledWith(animationId, 'all')
  })

  it('should return 400 for invalid period', async () => {
    mockGetAuthenticatedUser.mockReturnValue({ userId, role: 'admin' })

    const request = new NextRequest(`http://localhost/api/animations/${animationId}/timeline?period=invalid`)
    const response = await GET(request, { params: Promise.resolve({ id: animationId }) })
    const result = await response.json()

    expect(response.status).toBe(400)
    expect(result.success).toBe(false)
    expect(result.error.code).toBe('VALIDATION_ERROR')
  })

  it('should return empty data for animation without generations', async () => {
    mockGetAuthenticatedUser.mockReturnValue({ userId, role: 'admin' })
    mockGetAnimationById.mockResolvedValue({ _id: animationId, userId })

    const emptyTimeline = {
      period: '30d',
      data: [],
    }
    mockGetAnimationTimeline.mockResolvedValue(emptyTimeline)

    const request = new NextRequest(`http://localhost/api/animations/${animationId}/timeline`)
    const response = await GET(request, { params: Promise.resolve({ id: animationId }) })
    const result = await response.json()

    expect(response.status).toBe(200)
    expect(result.data.data).toEqual([])
  })
})
