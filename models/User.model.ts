// User model for authentication and authorization
import mongoose, { Schema, Document, Model } from 'mongoose'

/**
 * User role types
 */
export type UserRole = 'admin' | 'editor' | 'viewer'

/**
 * User document interface
 */
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId
  email: string
  passwordHash: string
  name?: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

/**
 * User schema definition
 */
const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address'
      ]
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required']
    },
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'editor', 'viewer'],
        message: 'Role must be admin, editor, or viewer'
      },
      default: 'viewer',
      required: true
    }
  },
  {
    timestamps: true, // Auto-generate createdAt and updatedAt
    collection: 'users'
  }
)

// Note: unique index on email is already created via `unique: true` in schema definition

/**
 * Export User model
 * Use singleton pattern for Next.js serverless environment
 */
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)

export default User
