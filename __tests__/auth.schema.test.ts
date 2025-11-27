import { createUserSchema, loginSchema } from '@/lib/schemas/auth.schema'

describe('createUserSchema', () => {
  describe('email validation', () => {
    it('should accept valid email', () => {
      const result = createUserSchema.safeParse({
        email: 'test@example.com',
        password: 'Test123!@#',
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid email format', () => {
      const result = createUserSchema.safeParse({
        email: 'invalid-email',
        password: 'Test123!@#',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('email')
      }
    })

    it('should reject email without domain', () => {
      const result = createUserSchema.safeParse({
        email: 'test@',
        password: 'Test123!@#',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('password validation', () => {
    it('should accept strong password (8+ chars, uppercase, digit, special)', () => {
      const result = createUserSchema.safeParse({
        email: 'test@example.com',
        password: 'Test123!@#',
      })
      expect(result.success).toBe(true)
    })

    it('should reject password shorter than 8 characters', () => {
      const result = createUserSchema.safeParse({
        email: 'test@example.com',
        password: 'Te1!',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('password')
      }
    })

    it('should reject password without uppercase letter', () => {
      const result = createUserSchema.safeParse({
        email: 'test@example.com',
        password: 'test123!@#',
      })
      expect(result.success).toBe(false)
    })

    it('should reject password without digit', () => {
      const result = createUserSchema.safeParse({
        email: 'test@example.com',
        password: 'Testtest!@#',
      })
      expect(result.success).toBe(false)
    })

    it('should reject password without special character', () => {
      const result = createUserSchema.safeParse({
        email: 'test@example.com',
        password: 'Test12345',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('name validation', () => {
    it('should accept optional name', () => {
      const result = createUserSchema.safeParse({
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'John Doe',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('John Doe')
      }
    })

    it('should accept missing name (optional)', () => {
      const result = createUserSchema.safeParse({
        email: 'test@example.com',
        password: 'Test123!@#',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBeUndefined()
      }
    })

    it('should reject name exceeding 100 characters', () => {
      const result = createUserSchema.safeParse({
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'A'.repeat(101),
      })
      expect(result.success).toBe(false)
    })
  })
})

describe('loginSchema', () => {
  it('should accept valid login credentials', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: 'anypassword',
    })
    expect(result.success).toBe(true)
  })

  it('should reject empty password', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: '',
    })
    expect(result.success).toBe(false)
  })

  it('should reject invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'invalid',
      password: 'password',
    })
    expect(result.success).toBe(false)
  })
})
