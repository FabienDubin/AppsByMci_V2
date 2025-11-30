import { generateQRCode, buildPublicUrl } from '@/lib/services/qrcode.service'

// Mock Azure Blob Storage
jest.mock('@/lib/blob-storage', () => ({
  blobStorageService: {
    uploadFile: jest.fn().mockResolvedValue({
      url: 'https://storage.blob.core.windows.net/qrcodes/test-1234567890.png',
      blobName: 'test-1234567890.png',
    }),
    generateSasUrl: jest.fn().mockResolvedValue('https://storage.blob.core.windows.net/qrcodes/test.png?sv=...'),
    initialize: jest.fn().mockResolvedValue(undefined),
  },
  CONTAINERS: {
    QRCODES: 'qrcodes',
    GENERATED_IMAGES: 'generated-images',
    UPLOADS: 'uploads',
    LOGOS: 'logos',
    BACKGROUNDS: 'backgrounds',
  },
}))

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}))

describe('QR Code Service', () => {
  describe('generateQRCode', () => {
    it('should generate a valid PNG buffer', async () => {
      const url = 'https://appsbymci.com/a/test-animation'

      const buffer = await generateQRCode(url)

      // Check that buffer is returned
      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBeGreaterThan(0)

      // Check PNG magic bytes (89 50 4E 47)
      expect(buffer[0]).toBe(0x89)
      expect(buffer[1]).toBe(0x50) // P
      expect(buffer[2]).toBe(0x4e) // N
      expect(buffer[3]).toBe(0x47) // G
    })

    it('should generate QR code with custom dimensions', async () => {
      const url = 'https://appsbymci.com/a/test'

      const buffer = await generateQRCode(url, { width: 256 })

      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBeGreaterThan(0)
    })

    it('should generate QR code with custom colors', async () => {
      const url = 'https://appsbymci.com/a/test'

      const buffer = await generateQRCode(url, {
        color: {
          dark: '#FF0000',
          light: '#FFFFFF',
        },
      })

      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBeGreaterThan(0)
    })

    it('should throw error for empty URL', async () => {
      // QRCode library throws error for empty input
      await expect(generateQRCode('')).rejects.toThrow('Failed to generate QR code')
    })
  })

  describe('buildPublicUrl', () => {
    const originalEnv = process.env

    beforeEach(() => {
      jest.resetModules()
      process.env = { ...originalEnv }
    })

    afterAll(() => {
      process.env = originalEnv
    })

    it('should build correct URL with env variable', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://myapp.com'

      const url = buildPublicUrl('my-animation')

      expect(url).toBe('https://myapp.com/a/my-animation')
    })

    it('should use default URL when env variable is not set', () => {
      delete process.env.NEXT_PUBLIC_APP_URL

      const url = buildPublicUrl('my-animation')

      expect(url).toBe('https://appsbymci.com/a/my-animation')
    })

    it('should handle slugs with special characters', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://app.com'

      const url = buildPublicUrl('my-super-animation-2024')

      expect(url).toBe('https://app.com/a/my-super-animation-2024')
    })
  })
})
