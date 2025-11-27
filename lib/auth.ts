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
// Token expires in 15 minutes
export const generateAccessToken = (payload: {
  userId: string
  email: string
  role: string
}): string => {
  const secret = getJwtSecret()
  return jwt.sign(payload, secret, { expiresIn: '15m' })
}

// Generate a unique refresh token using UUID v4 - prepared for story 2.2
export const generateRefreshToken = (): string => {
  return crypto.randomUUID()
}
