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
 * Question types for Step 3
 */
export type QuestionType = 'text' | 'email' | 'number' | 'choice' | 'slider' | 'selfie'

/**
 * Question configuration
 */
export interface IQuestion {
  id: string
  type: QuestionType
  label: string
  required: boolean
  options?: string[] // For 'choice' type
  validation?: Record<string, any>
}

/**
 * AI Model configuration (Step 4)
 */
export interface IAIModel {
  modelId: string
  prompt: string
  variables: string[]
}

/**
 * Email configuration (Step 5)
 */
export interface IEmailConfig {
  enabled: boolean
  subject: string
  template: string
  sender: string
}

/**
 * Display configuration (Step 6)
 */
export interface IDisplayConfig {
  enabled: boolean
  layout: string
  columns: number
  showNames: boolean
  refreshInterval: number
}

/**
 * Customization configuration (Step 7)
 */
export interface ICustomization {
  colors: Record<string, string>
  logo?: string
  theme: string
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
  questions: IQuestion[]
  aiModel?: IAIModel
  emailConfig?: IEmailConfig
  displayConfig?: IDisplayConfig
  customization?: ICustomization
  qrCodeUrl?: string
  publishedAt?: Date
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
    },
    questions: {
      type: [
        {
          id: {
            type: String,
            required: true
          },
          type: {
            type: String,
            enum: ['text', 'email', 'number', 'choice', 'slider', 'selfie'],
            required: true
          },
          label: {
            type: String,
            required: true
          },
          required: {
            type: Boolean,
            default: false
          },
          options: {
            type: [String],
            default: undefined
          },
          validation: {
            type: Schema.Types.Mixed,
            default: undefined
          }
        }
      ],
      default: []
    },
    aiModel: {
      modelId: {
        type: String,
        default: undefined
      },
      prompt: {
        type: String,
        default: undefined
      },
      variables: {
        type: [String],
        default: undefined
      }
    },
    emailConfig: {
      enabled: {
        type: Boolean,
        default: undefined
      },
      subject: {
        type: String,
        default: undefined
      },
      template: {
        type: String,
        default: undefined
      },
      sender: {
        type: String,
        default: undefined
      }
    },
    displayConfig: {
      enabled: {
        type: Boolean,
        default: undefined
      },
      layout: {
        type: String,
        default: undefined
      },
      columns: {
        type: Number,
        default: undefined
      },
      showNames: {
        type: Boolean,
        default: undefined
      },
      refreshInterval: {
        type: Number,
        default: undefined
      }
    },
    customization: {
      colors: {
        type: Schema.Types.Mixed,
        default: undefined
      },
      logo: {
        type: String,
        default: undefined
      },
      theme: {
        type: String,
        default: undefined
      }
    },
    qrCodeUrl: {
      type: String,
      default: undefined
    },
    publishedAt: {
      type: Date,
      default: undefined
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

// Create index on createdAt for sorting
AnimationSchema.index({ createdAt: -1 })

/**
 * Transform toJSON to clean API responses
 */
AnimationSchema.set('toJSON', {
  transform: function (_doc: any, ret: any) {
    ret.id = ret._id.toString()
    delete ret.__v
    return ret
  }
})

/**
 * Export Animation model
 * Use singleton pattern for Next.js serverless environment
 */
const Animation: Model<IAnimation> =
  mongoose.models.Animation || mongoose.model<IAnimation>('Animation', AnimationSchema)

export default Animation
