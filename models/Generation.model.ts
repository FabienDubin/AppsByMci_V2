// Generation model for AI-generated results
import mongoose, { Schema, Document, Model } from 'mongoose'

/**
 * Generation status types
 */
export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed'

/**
 * Generation document interface
 */
export interface IGeneration extends Document {
  _id: mongoose.Types.ObjectId
  animationId: mongoose.Types.ObjectId
  participantData: Record<string, any>
  selfieUrl?: string // Original image uploaded by participant (Azure Blob URL)
  status: GenerationStatus
  generatedImageUrl?: string // AI-generated image (Azure Blob URL)
  finalPrompt?: string // Final prompt sent to AI after variable substitution
  error?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Generation schema definition
 */
const GenerationSchema = new Schema<IGeneration>(
  {
    animationId: {
      type: Schema.Types.ObjectId,
      ref: 'Animation',
      required: [true, 'Animation ID is required']
    },
    participantData: {
      type: Schema.Types.Mixed,
      default: {},
      required: true
    },
    selfieUrl: {
      type: String,
      default: undefined
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'processing', 'completed', 'failed'],
        message: 'Status must be pending, processing, completed, or failed'
      },
      default: 'pending',
      required: true
    },
    generatedImageUrl: {
      type: String,
      default: undefined
    },
    finalPrompt: {
      type: String,
      default: undefined
    },
    error: {
      type: String,
      default: undefined
    }
  },
  {
    timestamps: true, // Auto-generate createdAt and updatedAt
    collection: 'generations'
  }
)

// Create index on animationId for frequent queries by animation
GenerationSchema.index({ animationId: 1 })

// Create compound index on animationId + status for filtering
GenerationSchema.index({ animationId: 1, status: 1 })

/**
 * Export Generation model
 * Use singleton pattern for Next.js serverless environment
 */
const Generation: Model<IGeneration> =
  mongoose.models.Generation || mongoose.model<IGeneration>('Generation', GenerationSchema)

export default Generation
