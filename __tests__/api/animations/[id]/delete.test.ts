/**
 * @jest-environment node
 */
import { DELETE } from '@/app/api/animations/[id]/route'
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

jest.mock('@/lib/services/animation.service', () => ({
  animationService: {
    deleteAnimation: jest.fn(),
    getAnimationById: jest.fn(),
    updateAnimation: jest.fn(),
    toAnimationResponse: jest.fn(),
  },
}))

jest.mock('@/lib/api-helpers', () => ({
  getAuthenticatedUser: jest.fn(),
}))

import { animationService } from '@/lib/services/animation.service'
import { getAuthenticatedUser } from '@/lib/api-helpers'

describe('DELETE /api/animations/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when not authenticated', async () => {
    ;(getAuthenticatedUser as jest.Mock).mockReturnValue(null)

    const request = new NextRequest('http://localhost/api/animations/123', {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: '123' }) })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('AUTH_1001')
  })

  it('should delete animation successfully', async () => {
    ;(getAuthenticatedUser as jest.Mock).mockReturnValue({ userId: 'user123' })
    ;(animationService.deleteAnimation as jest.Mock).mockResolvedValue(undefined)

    const request = new NextRequest('http://localhost/api/animations/507f1f77bcf86cd799439011', {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.deleted).toBe(true)
    expect(animationService.deleteAnimation).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 'user123')
  })

  it('should return 404 when animation not found', async () => {
    ;(getAuthenticatedUser as jest.Mock).mockReturnValue({ userId: 'user123' })
    const error = new Error('Animation introuvable')
    ;(error as any).code = 'NOT_FOUND_3001'
    ;(animationService.deleteAnimation as jest.Mock).mockRejectedValue(error)

    const request = new NextRequest('http://localhost/api/animations/nonexistent', {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: 'nonexistent' }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('NOT_FOUND_3001')
  })

  it('should return 403 when user does not own animation', async () => {
    ;(getAuthenticatedUser as jest.Mock).mockReturnValue({ userId: 'other-user' })
    const error = new Error('Accès refusé')
    ;(error as any).code = 'AUTH_1003'
    ;(animationService.deleteAnimation as jest.Mock).mockRejectedValue(error)

    const request = new NextRequest('http://localhost/api/animations/507f1f77bcf86cd799439011', {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }) })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('AUTH_1003')
  })

  it('should return 500 on unexpected error', async () => {
    ;(getAuthenticatedUser as jest.Mock).mockReturnValue({ userId: 'user123' })
    ;(animationService.deleteAnimation as jest.Mock).mockRejectedValue(new Error('Unexpected error'))

    const request = new NextRequest('http://localhost/api/animations/507f1f77bcf86cd799439011', {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }) })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('INTERNAL_3000')
  })
})
