import 'dotenv/config'
import { connectDatabase, disconnectDatabase } from '@/lib/database'
import { authService } from '@/lib/services/auth.service'
import { createUserSchema } from '@/lib/schemas/auth.schema'
import { logger } from '@/lib/logger'

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  const name = process.env.ADMIN_NAME || 'Admin'

  // Validate required env vars
  if (!email || !password) {
    logger.error('ADMIN_EMAIL and ADMIN_PASSWORD must be defined in environment variables')
    process.exit(1)
  }

  // Validate password strength
  const validation = createUserSchema.safeParse({ email, password, name })
  if (!validation.success) {
    logger.error({ errors: validation.error.flatten() }, 'Invalid admin credentials')
    process.exit(1)
  }

  // Warn if password is weak (< 12 chars)
  if (password.length < 12) {
    logger.warn('Password is less than 12 characters - consider using a stronger password')
  }

  try {
    // Connect to database
    await connectDatabase()

    // Check if admin already exists
    const existingUser = await authService.findUserByEmail(email)
    if (existingUser) {
      logger.info({ email }, 'Admin already exists')
      await disconnectDatabase()
      process.exit(0)
    }

    // Create admin
    const user = await authService.createUser(email, password, name)
    logger.info({ email, userId: user.id }, 'Admin created successfully')

    await disconnectDatabase()
    process.exit(0)
  } catch (error) {
    logger.error({ error }, 'Failed to seed admin')
    await disconnectDatabase()
    process.exit(1)
  }
}

seedAdmin()
