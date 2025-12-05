import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be defined and at least 32 characters long')
  }
  return secret
}

// Hash a password with bcrypt
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

// Compare a password with its hash
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash)
}

// Generate an access token (JWT) - prepared for story 2.2
// Token expires in 2 hours for better UX during long editing sessions
export const generateAccessToken = (payload: {
  userId: string
  email: string
  role: string
}): string => {
  const secret = getJwtSecret()
  return jwt.sign(payload, secret, { expiresIn: '2h' })
}

// Generate a unique refresh token using UUID v4 - prepared for story 2.2
export const generateRefreshToken = (): string => {
  return crypto.randomUUID()
}

// Verify an access token (JWT) and return its payload
export const verifyAccessToken = (
  token: string
): { userId: string; email: string; role: string } => {
  const secret = getJwtSecret()
  try {
    const payload = jwt.verify(token, secret) as {
      userId: string
      email: string
      role: string
    }
    return payload
  } catch (error) {
    throw new Error('Invalid or expired access token')
  }
}
