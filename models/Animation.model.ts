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
 * Access validation configuration (Legacy - deprecated in favor of accessConfig)
 */
export interface IAccessValidation {
  type: AccessValidationType
  value?: string // Code or email domain
}

/**
 * Access config types for Step 2
 */
export type AccessConfigType = 'none' | 'code' | 'email-domain'

/**
 * Access config configuration (Step 2)
 */
export interface IAccessConfig {
  type: AccessConfigType
  code?: string // Required if type='code'
  emailDomains?: string[] // Required if type='email-domain', parsed from CSV
}

/**
 * Base field configuration (Step 2)
 */
export interface IBaseFieldConfig {
  enabled: boolean
  required: boolean
  label?: string // Customizable label (default: "Nom", "Prénom", "Email")
  placeholder?: string // Customizable placeholder
}

/**
 * Base fields configuration (Step 2)
 */
export interface IBaseFields {
  name: IBaseFieldConfig
  firstName: IBaseFieldConfig
  email: IBaseFieldConfig
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
  accessValidation: IAccessValidation // Legacy - deprecated
  accessConfig?: IAccessConfig // Step 2 - New access configuration
  baseFields?: IBaseFields // Step 2 - Base field configuration
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
    accessConfig: {
      type: {
        type: String,
        enum: {
          values: ['none', 'code', 'email-domain'],
          message: 'Access config type must be none, code, or email-domain'
        },
        default: undefined
      },
      code: {
        type: String,
        default: undefined
      },
      emailDomains: {
        type: [String],
        default: undefined
      }
    },
    baseFields: {
      name: {
        enabled: {
          type: Boolean,
          default: true
        },
        required: {
          type: Boolean,
          default: true
        },
        label: {
          type: String,
          maxlength: 50,
          default: 'Nom'
        },
        placeholder: {
          type: String,
          maxlength: 100,
          default: 'Ex: Jean Dupont'
        }
      },
      firstName: {
        enabled: {
          type: Boolean,
          default: false
        },
        required: {
          type: Boolean,
          default: true
        },
        label: {
          type: String,
          maxlength: 50,
          default: 'Prénom'
        },
        placeholder: {
          type: String,
          maxlength: 100,
          default: 'Ex: Marie'
        }
      },
      email: {
        enabled: {
          type: Boolean,
          default: false
        },
        required: {
          type: Boolean,
          default: true
        },
        label: {
          type: String,
          maxlength: 50,
          default: 'Email'
        },
        placeholder: {
          type: String,
          maxlength: 100,
          default: 'exemple@email.com'
        }
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
