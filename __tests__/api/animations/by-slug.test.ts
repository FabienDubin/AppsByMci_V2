import { NextRequest } from 'next/server'
import { GET } from '@/app/api/animations/by-slug/[slug]/route'
import { animationService } from '@/lib/services/animation.service'
import { connectDatabase } from '@/lib/database'

// Mock dependencies
jest.mock('@/lib/database', () => ({
  connectDatabase: jest.fn(),
}))

jest.mock('@/lib/services/animation.service', () => ({
  animationService: {
    getPublishedAnimationBySlug: jest.fn(),
    toAnimationResponse: jest.fn(),
  },
}))

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

describe('GET /api/animations/by-slug/[slug]', () => {
  const mockAnimation = {
    _id: 'animation123',
    slug: 'test-animation',
    name: 'Test Animation',
    status: 'published',
    userId: 'user123',
    customization: {
      primaryColor: '#000000',
      secondaryColor: '#71717a',
      theme: 'auto',
    },
    baseFields: {
      name: { enabled: true, required: true },
      firstName: { enabled: false, required: false },
      email: { enabled: true, required: true },
    },
    toJSON: function() { return this },
  }

  const mockResponse = {
    id: 'animation123',
    slug: 'test-animation',
    name: 'Test Animation',
    status: 'published',
    userId: 'user123',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return published animation by slug', async () => {
    ;(animationService.getPublishedAnimationBySlug as jest.Mock).mockResolvedValue(mockAnimation)
    ;(animationService.toAnimationResponse as jest.Mock).mockReturnValue(mockResponse)

    const request = new NextRequest('http://localhost/api/animations/by-slug/test-animation')
    const response = await GET(request, { params: Promise.resolve({ slug: 'test-animation' }) })

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.slug).toBe('test-animation')

    expect(animationService.getPublishedAnimationBySlug).toHaveBeenCalledWith('test-animation')
    expect(connectDatabase).toHaveBeenCalled()
  })

  it('should return 404 if animation not found', async () => {
    const notFoundError = new Error('Animation introuvable')
    ;(notFoundError as any).code = 'NOT_FOUND_3001'
    ;(animationService.getPublishedAnimationBySlug as jest.Mock).mockRejectedValue(notFoundError)

    const request = new NextRequest('http://localhost/api/animations/by-slug/non-existent')
    const response = await GET(request, { params: Promise.resolve({ slug: 'non-existent' }) })

    expect(response.status).toBe(404)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('NOT_FOUND_3001')
  })

  it('should return 404 if animation is not published (draft)', async () => {
    const notFoundError = new Error('Animation introuvable')
    ;(notFoundError as any).code = 'NOT_FOUND_3001'
    ;(animationService.getPublishedAnimationBySlug as jest.Mock).mockRejectedValue(notFoundError)

    const request = new NextRequest('http://localhost/api/animations/by-slug/draft-animation')
    const response = await GET(request, { params: Promise.resolve({ slug: 'draft-animation' }) })

    expect(response.status).toBe(404)

    const data = await response.json()
    expect(data.success).toBe(false)
  })

  it('should return 500 on internal error', async () => {
    ;(animationService.getPublishedAnimationBySlug as jest.Mock).mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost/api/animations/by-slug/test')
    const response = await GET(request, { params: Promise.resolve({ slug: 'test' }) })

    expect(response.status).toBe(500)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('INTERNAL_3000')
  })
})
