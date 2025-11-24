// Database initialization helper for Next.js API Routes
import { connectDatabase } from './database'

/**
 * Initialize database connection for API Routes
 * This function is called at the beginning of each API route
 * to ensure database is connected before handling requests.
 *
 * Uses singleton pattern from database.ts to reuse existing connection
 * in serverless environment (Next.js API Routes).
 *
 * @returns Promise<void>
 */
export async function initDatabase(): Promise<void> {
  try {
    await connectDatabase()
  } catch (error) {
    console.error('[DB Init] Failed to initialize database:', error)
    throw error
  }
}
