import { NextRequest } from 'next/server'
import { POST } from '@/app/api/animations/by-slug/[slug]/validate-access/route'
import { animationService } from '@/lib/services/animation.service'
import { connectDatabase } from '@/lib/database'

// Mock dependencies
jest.mock('@/lib/database', () => ({
  connectDatabase: jest.fn(),
}))

jest.mock('@/lib/services/animation.service', () => ({
  animationService: {
    validateAccessCode: jest.fn(),
  },
}))

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

describe('POST /api/animations/by-slug/[slug]/validate-access', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 200 OK when access code is valid', async () => {
    ;(animationService.validateAccessCode as jest.Mock).mockResolvedValue(true)

    const request = new NextRequest('http://localhost/api/animations/by-slug/test-animation/validate-access', {
      method: 'POST',
      body: JSON.stringify({ accessCode: 'VALID123' }),
    })

    const response = await POST(request, { params: Promise.resolve({ slug: 'test-animation' }) })

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.valid).toBe(true)

    expect(animationService.validateAccessCode).toHaveBeenCalledWith('test-animation', 'VALID123')
    expect(connectDatabase).toHaveBeenCalled()
  })

  it('should return 403 Forbidden when access code is invalid', async () => {
    const accessDeniedError = new Error("Code d'accès incorrect")
    ;(accessDeniedError as any).code = 'AUTH_1003'
    ;(animationService.validateAccessCode as jest.Mock).mockRejectedValue(accessDeniedError)

    const request = new NextRequest('http://localhost/api/animations/by-slug/test-animation/validate-access', {
      method: 'POST',
      body: JSON.stringify({ accessCode: 'WRONG_CODE' }),
    })

    const response = await POST(request, { params: Promise.resolve({ slug: 'test-animation' }) })

    expect(response.status).toBe(403)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('ACCESS_DENIED')
  })

  it('should return 404 if animation not found', async () => {
    const notFoundError = new Error('Animation introuvable')
    ;(notFoundError as any).code = 'NOT_FOUND_3001'
    ;(animationService.validateAccessCode as jest.Mock).mockRejectedValue(notFoundError)

    const request = new NextRequest('http://localhost/api/animations/by-slug/non-existent/validate-access', {
      method: 'POST',
      body: JSON.stringify({ accessCode: 'CODE123' }),
    })

    const response = await POST(request, { params: Promise.resolve({ slug: 'non-existent' }) })

    expect(response.status).toBe(404)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('NOT_FOUND_3001')
  })

  it('should return 400 if access code is missing', async () => {
    const request = new NextRequest('http://localhost/api/animations/by-slug/test-animation/validate-access', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(request, { params: Promise.resolve({ slug: 'test-animation' }) })

    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })

  it('should return 400 if access code is empty string', async () => {
    const request = new NextRequest('http://localhost/api/animations/by-slug/test-animation/validate-access', {
      method: 'POST',
      body: JSON.stringify({ accessCode: '' }),
    })

    const response = await POST(request, { params: Promise.resolve({ slug: 'test-animation' }) })

    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
  })

  it('should return 500 on internal error', async () => {
    ;(animationService.validateAccessCode as jest.Mock).mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost/api/animations/by-slug/test/validate-access', {
      method: 'POST',
      body: JSON.stringify({ accessCode: 'CODE123' }),
    })

    const response = await POST(request, { params: Promise.resolve({ slug: 'test' }) })

    expect(response.status).toBe(500)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('INTERNAL_3000')
  })
})
