// Database connection service with retry logic and singleton pattern
import mongoose from 'mongoose'

// Global variable to cache the connection in serverless environment
interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

let cached: MongooseCache = (global as any).mongoose

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null }
}

/**
 * Connection options for Mongoose
 */
const mongooseOptions: mongoose.ConnectOptions = {
  bufferCommands: false, // Disable buffering
  maxPoolSize: 10, // Connection pool size
}

/**
 * Sleep helper for retry backoff
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Connect to MongoDB (Cosmos DB) with retry logic
 * Implements singleton pattern for serverless environments
 *
 * Retry strategy: 3 attempts with exponential backoff (1s, 2s, 4s)
 *
 * @returns Promise<typeof mongoose>
 * @throws Error if connection fails after 3 attempts
 */
export async function connectDatabase(): Promise<typeof mongoose> {
  // Return existing connection if available
  if (cached.conn) {
    console.log('[Database] Using cached connection')
    return cached.conn
  }

  // Return existing promise if connection is in progress
  if (cached.promise) {
    console.log('[Database] Connection in progress, waiting...')
    return cached.promise
  }

  const connectionString = process.env.MONGODB_CONNECTION_STRING

  if (!connectionString) {
    console.error('[Database] ERROR: MONGODB_CONNECTION_STRING not defined in environment variables')
    process.exit(1)
  }

  // Retry configuration
  const maxRetries = 3
  const backoffDelays = [1000, 2000, 4000] // ms

  // Create new connection promise with retry logic
  cached.promise = (async () => {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Database] Connecting to database... (attempt ${attempt}/${maxRetries})`)
        const startTime = Date.now()

        const conn = await mongoose.connect(connectionString, mongooseOptions)

        const connectionTime = Date.now() - startTime
        console.log(`[Database] Database connected successfully (${connectionTime}ms)`)

        // Cache the connection
        cached.conn = conn
        return conn
      } catch (error) {
        lastError = error as Error
        console.warn(
          `[Database] WARN: Connection attempt ${attempt}/${maxRetries} failed:`,
          lastError.message
        )

        // If not last attempt, wait before retrying
        if (attempt < maxRetries) {
          const delay = backoffDelays[attempt - 1]
          console.log(`[Database] Retrying in ${delay}ms...`)
          await sleep(delay)
        }
      }
    }

    // All retries failed
    console.error(
      `[Database] ERROR: Failed to connect to database after ${maxRetries} attempts`,
      lastError
    )
    process.exit(1)
  })()

  cached.conn = await cached.promise
  return cached.conn
}

/**
 * Disconnect from MongoDB
 * Used for graceful shutdown
 */
export async function disconnectDatabase(): Promise<void> {
  if (!cached.conn) {
    return
  }

  try {
    console.log('[Database] Disconnecting from database...')
    await mongoose.disconnect()
    cached.conn = null
    cached.promise = null
    console.log('[Database] Database disconnected successfully')
  } catch (error) {
    console.error('[Database] ERROR: Failed to disconnect from database:', error)
    throw error
  }
}

/**
 * Check if database is connected
 */
export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1
}

// Note: Global mongoose cache is typed as 'any' to avoid TypeScript conflicts
// The cache structure is enforced by the MongooseCache interface above
