import { hashPassword, comparePassword } from '@/lib/auth'

describe('hashPassword', () => {
  it('should hash a password', async () => {
    const password = 'Test123!@#'
    const hash = await hashPassword(password)

    expect(hash).toBeDefined()
    expect(hash).not.toBe(password)
    expect(hash.startsWith('$2')).toBe(true) // bcrypt hash prefix
  })

  it('should generate different hashes for same password', async () => {
    const password = 'Test123!@#'
    const hash1 = await hashPassword(password)
    const hash2 = await hashPassword(password)

    expect(hash1).not.toBe(hash2) // bcrypt uses random salt
  })

  it('should generate hash of expected length', async () => {
    const password = 'Test123!@#'
    const hash = await hashPassword(password)

    // bcrypt hashes are 60 characters long
    expect(hash.length).toBe(60)
  })
})

describe('comparePassword', () => {
  it('should return true for matching password', async () => {
    const password = 'Test123!@#'
    const hash = await hashPassword(password)

    const result = await comparePassword(password, hash)
    expect(result).toBe(true)
  })

  it('should return false for non-matching password', async () => {
    const password = 'Test123!@#'
    const wrongPassword = 'WrongPass1!'
    const hash = await hashPassword(password)

    const result = await comparePassword(wrongPassword, hash)
    expect(result).toBe(false)
  })

  it('should return false for similar but different password', async () => {
    const password = 'Test123!@#'
    const similarPassword = 'Test123!@#!' // one extra char
    const hash = await hashPassword(password)

    const result = await comparePassword(similarPassword, hash)
    expect(result).toBe(false)
  })

  it('should handle empty password comparison', async () => {
    const password = 'Test123!@#'
    const hash = await hashPassword(password)

    const result = await comparePassword('', hash)
    expect(result).toBe(false)
  })
})
