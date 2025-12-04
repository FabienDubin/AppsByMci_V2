// Animation model for event animation configurations
import mongoose, { Schema, Document, Model } from 'mongoose'

// Import types from modular files
import type {
  AccessConfigType,
  IAccessConfig,
  IBaseFieldConfig,
  IAiConsent,
  IBaseFields,
  InputElementType,
  IInputElement,
  IInputCollection,
  PipelineBlockType,
  BlockName,
  ImageUsageMode,
  ImageSourceType,
  IPipelineBlockConfig,
  IPipelineBlock,
  IAIModel,
  IEmailConfig,
  IDisplayConfig,
  IPublicDisplayConfig,
  ICustomizationLegacy,
  ITextCard,
  ICustomization
} from './animation'

import { DEFAULT_LOADING_MESSAGES } from './animation'

// Re-export all types for backward compatibility
export type {
  AccessConfigType,
  IAccessConfig,
  IBaseFieldConfig,
  IAiConsent,
  IBaseFields,
  InputElementType,
  IInputElement,
  IInputCollection,
  PipelineBlockType,
  BlockName,
  ImageUsageMode,
  ImageSourceType,
  IPipelineBlockConfig,
  IPipelineBlock,
  IAIModel,
  IEmailConfig,
  IDisplayConfig,
  IPublicDisplayConfig,
  ICustomizationLegacy,
  ITextCard,
  ICustomization
}

export { DEFAULT_LOADING_MESSAGES }

/**
 * Animation status types
 */
export type AnimationStatus = 'draft' | 'published' | 'archived'

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
  accessConfig?: IAccessConfig // Step 2 - New access configuration
  baseFields?: IBaseFields // Step 2 - Base field configuration
  inputCollection?: IInputCollection // Step 3 - Advanced input collection
  pipeline: IPipelineBlock[]
  aiModel?: IAIModel
  emailConfig?: IEmailConfig
  displayConfig?: IDisplayConfig // Legacy - deprecated
  publicDisplayConfig?: IPublicDisplayConfig // Step 6 - New
  customization?: ICustomization // Step 7 - New (replaces legacy)
  qrCodeUrl?: string
  publishedAt?: Date
  archivedAt?: Date // Story 3.11 - Archive timestamp
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
      },
      // Story 3.12: AI Consent toggle
      aiConsent: {
        enabled: {
          type: Boolean,
          default: false
        },
        required: {
          type: Boolean,
          default: false
        },
        label: {
          type: String,
          maxlength: [5000, 'Le label aiConsent ne peut pas dépasser 5000 caractères'],
          default: ''
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
            // Image configuration (for AI generation blocks) - Legacy single image
            imageUsageMode: {
              type: String,
              enum: ['none', 'reference', 'edit'],
              default: undefined
            },
            imageSource: {
              type: String,
              enum: ['selfie', 'url', 'upload', 'ai-block-output'],
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
            // Aspect ratio configuration (Story 4.8)
            aspectRatio: {
              type: String,
              enum: ['1:1', '9:16', '16:9', '2:3', '3:2'],
              default: undefined
            },
            // Multi-reference images configuration (Story 4.8)
            referenceImages: {
              type: [
                {
                  id: { type: String, required: true },
                  name: { type: String, required: true, maxlength: 50 },
                  source: {
                    type: String,
                    enum: ['selfie', 'url', 'upload', 'ai-block-output'],
                    required: true
                  },
                  url: { type: String, default: undefined },
                  sourceBlockId: { type: String, default: undefined },
                  order: { type: Number, required: true, min: 1 }
                }
              ],
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
        maxlength: [10000, "Le corps de l'email ne peut pas dépasser 10000 caractères"],
        default: undefined
      },
      senderName: {
        type: String,
        maxlength: [100, "Le nom de l'expéditeur ne peut pas dépasser 100 caractères"],
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
          message: "Format d'email invalide"
        }
      }
    },
    // Step 6: Legacy displayConfig (deprecated, kept for backward compatibility)
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
    // Step 6: Public Display Config (new)
    publicDisplayConfig: {
      enabled: {
        type: Boolean,
        default: true
      },
      layout: {
        type: String,
        enum: ['masonry', 'grid', 'carousel'],
        default: 'masonry'
      },
      columns: {
        type: Number,
        min: [2, 'Minimum 2 colonnes'],
        max: [5, 'Maximum 5 colonnes'],
        default: 3
      },
      autoScroll: {
        type: Boolean,
        default: true
      },
      autoScrollSpeed: {
        type: String,
        enum: ['slow', 'medium', 'fast'],
        default: 'medium'
      },
      showParticipantName: {
        type: Boolean,
        default: true
      },
      refreshInterval: {
        type: Number,
        min: [5, 'Minimum 5 secondes'],
        max: [60, 'Maximum 60 secondes'],
        default: 10
      }
    },
    // Step 7: Customization (new complete schema)
    customization: {
      primaryColor: {
        type: String,
        match: [/^#[0-9A-Fa-f]{6}$/, 'Format de couleur invalide (ex: #000000)'],
        default: '#000000'
      },
      secondaryColor: {
        type: String,
        match: [/^#[0-9A-Fa-f]{6}$/, 'Format de couleur invalide (ex: #71717a)'],
        default: '#71717a'
      },
      logo: {
        type: String,
        default: undefined
      },
      backgroundImage: {
        type: String,
        default: undefined
      },
      backgroundColor: {
        type: String,
        match: [/^#[0-9A-Fa-f]{6}$/, 'Format de couleur invalide'],
        default: undefined
      },
      backgroundColorOpacity: {
        type: Number,
        min: [0, 'Opacité minimum 0%'],
        max: [100, 'Opacité maximum 100%'],
        default: 50
      },
      textCard: {
        enabled: {
          type: Boolean,
          default: true
        },
        backgroundColor: {
          type: String,
          match: [/^#[0-9A-Fa-f]{6}$/, 'Format de couleur invalide (ex: #FFFFFF)'],
          default: '#FFFFFF'
        },
        opacity: {
          type: Number,
          min: [0, 'Opacité minimum 0%'],
          max: [100, 'Opacité maximum 100%'],
          default: 90
        },
        borderRadius: {
          type: Number,
          min: [0, 'Arrondi minimum 0px'],
          max: [24, 'Arrondi maximum 24px'],
          default: 12
        },
        padding: {
          type: Number,
          min: [8, 'Padding minimum 8px'],
          max: [32, 'Padding maximum 32px'],
          default: 16
        }
      },
      theme: {
        type: String,
        enum: ['light', 'dark', 'auto'],
        default: 'auto'
      },
      // Story 3.13: No character limit - welcomeMessage is now HTML from WYSIWYG editor
      welcomeMessage: {
        type: String,
        default: undefined
      },
      submissionMessage: {
        type: String,
        maxlength: [100, 'Le message après soumission ne peut pas dépasser 100 caractères'],
        default: 'Merci ! Votre résultat arrive...'
      },
      loadingMessages: {
        type: [String],
        validate: {
          validator: function (messages: string[]) {
            if (!messages || messages.length === 0) return true // Will use defaults
            return messages.length >= 3 && messages.length <= 10
          },
          message: 'loadingMessages doit contenir entre 3 et 10 messages'
        },
        default: DEFAULT_LOADING_MESSAGES
      },
      thankYouMessage: {
        type: String,
        maxlength: [100, 'Le message de remerciement ne peut pas dépasser 100 caractères'],
        default: "Merci d'avoir participé !"
      },
      // Legacy field for backward compatibility
      colors: {
        type: Schema.Types.Mixed,
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
    },
    archivedAt: {
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
      throw new Error("Le sujet de l'email est requis quand l'envoi est activé")
    }
    if (!emailConfig.bodyTemplate || emailConfig.bodyTemplate.trim() === '') {
      throw new Error("Le corps de l'email est requis quand l'envoi est activé")
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
