// Session model for JWT refresh tokens
import mongoose, { Schema, Document, Model } from 'mongoose'

/**
 * Session document interface
 */
export interface ISession extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  refreshToken: string
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

/**
 * Session schema definition
 */
const SessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    refreshToken: {
      type: String,
      required: [true, 'Refresh token is required'],
      unique: true
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required']
    }
  },
  {
    timestamps: true, // Auto-generate createdAt and updatedAt
    collection: 'sessions'
  }
)

// Create index on userId for queries by user
SessionSchema.index({ userId: 1 })

// Create TTL index on expiresAt for auto-deletion of expired sessions
// MongoDB will automatically delete documents when expiresAt is reached
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

/**
 * Export Session model
 * Use singleton pattern for Next.js serverless environment
 */
const Session: Model<ISession> =
  mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema)

export default Session
