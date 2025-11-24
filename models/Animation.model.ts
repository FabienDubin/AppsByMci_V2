// Animation model for event animation configurations
import mongoose, { Schema, Document, Model } from 'mongoose'

/**
 * Animation status types
 */
export type AnimationStatus = 'draft' | 'published' | 'archived'

/**
 * Access validation types
 */
export type AccessValidationType = 'open' | 'code' | 'email'

/**
 * Access validation configuration
 */
export interface IAccessValidation {
  type: AccessValidationType
  value?: string // Code or email domain
}

/**
 * Pipeline block configuration
 */
export interface IPipelineBlock {
  blockType: string
  config: Record<string, any>
}

/**
 * Animation document interface
 */
export interface IAnimation extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  name: string
  slug: string
  description: string
  status: AnimationStatus
  accessValidation: IAccessValidation
  pipeline: IPipelineBlock[]
  createdAt: Date
  updatedAt: Date
}

/**
 * Animation schema definition
 */
const AnimationSchema = new Schema<IAnimation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    name: {
      type: String,
      required: [true, 'Animation name is required'],
      trim: true,
      maxlength: [200, 'Animation name cannot exceed 200 characters']
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Slug must be URL-friendly (lowercase, alphanumeric, hyphens only)'
      ]
    },
    description: {
      type: String,
      default: '',
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    status: {
      type: String,
      enum: {
        values: ['draft', 'published', 'archived'],
        message: 'Status must be draft, published, or archived'
      },
      default: 'draft',
      required: true
    },
    accessValidation: {
      type: {
        type: String,
        enum: {
          values: ['open', 'code', 'email'],
          message: 'Access validation type must be open, code, or email'
        },
        default: 'open',
        required: true
      },
      value: {
        type: String,
        default: undefined
      }
    },
    pipeline: {
      type: [
        {
          blockType: {
            type: String,
            required: true
          },
          config: {
            type: Schema.Types.Mixed,
            default: {}
          }
        }
      ],
      default: []
    }
  },
  {
    timestamps: true, // Auto-generate createdAt and updatedAt
    collection: 'animations'
  }
)

// Create unique index on slug
AnimationSchema.index({ slug: 1 }, { unique: true })

// Create compound index on userId + status for dashboard filtering
AnimationSchema.index({ userId: 1, status: 1 })

/**
 * Export Animation model
 * Use singleton pattern for Next.js serverless environment
 */
const Animation: Model<IAnimation> =
  mongoose.models.Animation || mongoose.model<IAnimation>('Animation', AnimationSchema)

export default Animation
