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
 * Input Element types (Step 3)
 */
export type InputElementType = 'selfie' | 'choice' | 'slider' | 'free-text'

/**
 * Input Element configuration (Step 3)
 */
export interface IInputElement {
  id: string // UUID
  type: InputElementType
  order: number // 0-indexed

  // Common fields (except selfie)
  question?: string // max 500 chars
  required?: boolean // default true

  // Choice fields
  options?: string[] // min 2, max 6, each max 100 chars

  // Slider fields
  min?: number
  max?: number
  minLabel?: string // max 50 chars
  maxLabel?: string // max 50 chars

  // Free-text fields
  maxLength?: number // 50-2000
  placeholder?: string // max 100 chars
}

/**
 * Input Collection configuration (Step 3)
 */
export interface IInputCollection {
  elements: IInputElement[]
}

/**
 * Pipeline block types (Step 4)
 */
export type PipelineBlockType = 'preprocessing' | 'ai-generation' | 'postprocessing'
export type BlockName = 'crop-resize' | 'ai-generation' | 'filters'

/**
 * Image usage mode for AI generation
 */
export type ImageUsageMode = 'none' | 'reference' | 'edit'

/**
 * Image source type for AI generation
 */
export type ImageSourceType = 'selfie' | 'url' | 'ai-block-output'

/**
 * Pipeline block configuration (Step 4)
 */
export interface IPipelineBlockConfig {
  // Crop & Resize
  format?: 'square' | '16:9' | '4:3' | 'original'
  dimensions?: number // 256-2048

  // IA Generation
  modelId?: string // 'dall-e-3', 'gpt-image-1', 'imagen-4.0-generate-001'
  promptTemplate?: string // max 2000 chars

  // Image configuration (for AI generation blocks)
  imageUsageMode?: ImageUsageMode
  imageSource?: ImageSourceType
  imageUrl?: string
  sourceBlockId?: string

  // Filters (future)
  filters?: string[]
}

/**
 * Pipeline block (Step 4)
 */
export interface IPipelineBlock {
  id: string // UUID
  type: PipelineBlockType
  blockName: BlockName
  order: number // 0-indexed
  config: IPipelineBlockConfig
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
  subject?: string // max 200 chars
  bodyTemplate?: string // max 10000 chars, HTML
  senderName: string // default 'AppsByMCI'
  senderEmail: string // default 'noreply@appsbymci.com'
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
  inputCollection?: IInputCollection // Step 3 - Advanced input collection
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
    // Step 3: Input Collection (advanced inputs - selfie + questions)
    inputCollection: {
      type: {
        elements: {
          type: [
            {
              id: {
                type: String,
                required: true // UUID
              },
              type: {
                type: String,
                enum: {
                  values: ['selfie', 'choice', 'slider', 'free-text'],
                  message: 'Input element type must be selfie, choice, slider, or free-text'
                },
                required: true
              },
              order: {
                type: Number,
                required: true,
                min: [0, 'Order must be >= 0']
              },
              // Common fields (except selfie)
              question: {
                type: String,
                maxlength: [500, 'Question cannot exceed 500 characters'],
                default: undefined
              },
              required: {
                type: Boolean,
                default: true
              },
              // Choice fields
              options: {
                type: [String],
                validate: {
                  validator: function (v: string[]) {
                    if (!v) return true // Optional field
                    return v.length >= 2 && v.length <= 6 && v.every((opt) => opt.length <= 100)
                  },
                  message: 'Options must have 2-6 items, each max 100 characters'
                },
                default: undefined
              },
              // Slider fields
              min: {
                type: Number,
                default: undefined
              },
              max: {
                type: Number,
                default: undefined
              },
              minLabel: {
                type: String,
                maxlength: [50, 'Min label cannot exceed 50 characters'],
                default: undefined
              },
              maxLabel: {
                type: String,
                maxlength: [50, 'Max label cannot exceed 50 characters'],
                default: undefined
              },
              // Free-text fields
              maxLength: {
                type: Number,
                min: [50, 'Max length minimum is 50 characters'],
                max: [2000, 'Max length maximum is 2000 characters'],
                default: undefined
              },
              placeholder: {
                type: String,
                maxlength: [100, 'Placeholder cannot exceed 100 characters'],
                default: undefined
              }
            }
          ],
          default: []
        }
      },
      required: false,
      default: undefined
    },
    // Step 4: Pipeline Configuration
    pipeline: {
      type: [
        {
          id: {
            type: String,
            required: true
          },
          type: {
            type: String,
            enum: {
              values: ['preprocessing', 'ai-generation', 'postprocessing'],
              message: 'Pipeline block type must be preprocessing, ai-generation, or postprocessing'
            },
            required: true
          },
          blockName: {
            type: String,
            enum: {
              values: ['crop-resize', 'ai-generation', 'filters'],
              message: 'Block name must be crop-resize, ai-generation, or filters'
            },
            required: true
          },
          order: {
            type: Number,
            required: true,
            min: 0
          },
          config: {
            // Crop & Resize
            format: {
              type: String,
              enum: ['square', '16:9', '4:3', 'original'],
              default: undefined
            },
            dimensions: {
              type: Number,
              min: 256,
              max: 2048,
              default: undefined
            },
            // IA Generation
            modelId: {
              type: String,
              default: undefined
            },
            promptTemplate: {
              type: String,
              maxlength: [2000, 'Prompt template cannot exceed 2000 characters'],
              default: undefined
            },
            // Image configuration (for AI generation blocks)
            imageUsageMode: {
              type: String,
              enum: ['none', 'reference', 'edit'],
              default: undefined
            },
            imageSource: {
              type: String,
              enum: ['selfie', 'url', 'ai-block-output'],
              default: undefined
            },
            imageUrl: {
              type: String,
              default: undefined
            },
            sourceBlockId: {
              type: String,
              default: undefined
            },
            // Filters (future)
            filters: {
              type: [String],
              default: undefined
            }
          }
        }
      ],
      default: [],
      validate: {
        validator: function (pipeline: IPipelineBlock[]) {
          if (!pipeline || pipeline.length === 0) return true // Empty pipeline is valid

          // Validation 1: Max 4 AI generation blocks
          const aiBlocksCount = pipeline.filter((b) => b.type === 'ai-generation').length
          if (aiBlocksCount > 4) {
            return false
          }

          // Validation 2: Max 20 blocks total
          if (pipeline.length > 20) {
            return false
          }

          return true
        },
        message: 'Pipeline must have max 4 AI blocks and max 20 blocks total'
      }
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
        default: false
      },
      subject: {
        type: String,
        maxlength: [200, 'Le sujet ne peut pas dépasser 200 caractères'],
        default: undefined
      },
      bodyTemplate: {
        type: String,
        maxlength: [10000, 'Le corps de l\'email ne peut pas dépasser 10000 caractères'],
        default: undefined
      },
      senderName: {
        type: String,
        maxlength: [100, 'Le nom de l\'expéditeur ne peut pas dépasser 100 caractères'],
        default: 'AppsByMCI'
      },
      senderEmail: {
        type: String,
        default: 'noreply@appsbymci.com',
        validate: {
          validator: function (email: string) {
            if (!email) return true // Optional field
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
          },
          message: 'Format d\'email invalide'
        }
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
 * Pre-save validation hook for inputCollection
 * Validates business rules:
 * - Max 1 selfie per animation
 * - Conditional validation per element type
 */
AnimationSchema.pre('save', function () {
  // Only validate if inputCollection exists and has been modified
  if (!this.inputCollection || !this.isModified('inputCollection')) {
    return
  }

  const elements = this.inputCollection.elements || []

  // Validate max 1 selfie
  const selfieCount = elements.filter((el) => el.type === 'selfie').length
  if (selfieCount > 1) {
    throw new Error('Maximum 1 selfie autorisé par animation')
  }

  // Conditional validation per type
  for (const element of elements) {
    if (element.type === 'choice') {
      if (!element.question || element.question.trim() === '') {
        throw new Error(`Question requise pour élément choice (id: ${element.id})`)
      }
      if (!element.options || element.options.length < 2) {
        throw new Error(`Minimum 2 options requises pour élément choice (id: ${element.id})`)
      }
    }

    if (element.type === 'slider') {
      if (!element.question || element.question.trim() === '') {
        throw new Error(`Question requise pour élément slider (id: ${element.id})`)
      }
      if (element.min === undefined || element.max === undefined) {
        throw new Error(`Min et max requis pour élément slider (id: ${element.id})`)
      }
      if (element.min >= element.max) {
        throw new Error(`Max doit être > min pour élément slider (id: ${element.id})`)
      }
    }

    if (element.type === 'free-text') {
      if (!element.question || element.question.trim() === '') {
        throw new Error(`Question requise pour élément free-text (id: ${element.id})`)
      }
      if (!element.maxLength) {
        throw new Error(`maxLength requis pour élément free-text (id: ${element.id})`)
      }
    }
  }
})

/**
 * Pre-save validation hook for emailConfig
 * Validates business rules:
 * - If enabled=true, subject and bodyTemplate are required
 */
AnimationSchema.pre('save', function () {
  // Only validate if emailConfig exists and has been modified
  if (!this.emailConfig || !this.isModified('emailConfig')) {
    return
  }

  const emailConfig = this.emailConfig

  // Conditional validation: if enabled=true, subject and bodyTemplate required
  if (emailConfig.enabled) {
    if (!emailConfig.subject || emailConfig.subject.trim() === '') {
      throw new Error('Le sujet de l\'email est requis quand l\'envoi est activé')
    }
    if (!emailConfig.bodyTemplate || emailConfig.bodyTemplate.trim() === '') {
      throw new Error('Le corps de l\'email est requis quand l\'envoi est activé')
    }
  }
})

/**
 * Export Animation model
 * Use singleton pattern for Next.js serverless environment
 */
const Animation: Model<IAnimation> =
  mongoose.models.Animation || mongoose.model<IAnimation>('Animation', AnimationSchema)

export default Animation
