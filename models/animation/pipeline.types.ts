// Pipeline configuration types (Step 4)

/**
 * Pipeline block types (Step 4)
 */
export type PipelineBlockType = 'preprocessing' | 'ai-generation' | 'postprocessing' | 'processing'
export type BlockName = 'crop-resize' | 'ai-generation' | 'filters' | 'quiz-scoring'

/**
 * Image usage mode for AI generation
 */
export type ImageUsageMode = 'none' | 'reference' | 'edit'

/**
 * Image source type for AI generation
 */
export type ImageSourceType = 'selfie' | 'url' | 'upload' | 'ai-block-output'

/**
 * Aspect ratio type for AI generation (Story 4.8)
 */
export type AspectRatio = '1:1' | '9:16' | '16:9' | '2:3' | '3:2'

/**
 * Reference image configuration for AI generation blocks (Story 4.8)
 */
export interface IReferenceImage {
  id: string              // UUID
  name: string            // User-defined name (e.g., "selfie", "logo", "fond")
  source: ImageSourceType // Source type
  url?: string            // URL if source = 'url' or 'upload'
  sourceBlockId?: string  // Block ID if source = 'ai-block-output'
  order: number           // Position (1, 2, 3...)
}

/**
 * Quiz Scoring - Option to profile mapping
 */
export interface IOptionMapping {
  optionText: string      // The text of the option (for matching with participant answer)
  profileKey: string      // The profile key (A, B, C, D, E...)
}

/**
 * Quiz Scoring - Question mapping configuration
 */
export interface IQuestionMapping {
  elementId: string               // ID of the choice question
  optionMappings: IOptionMapping[] // Mapping for each option
}

/**
 * Quiz Scoring - Profile definition
 */
export interface IScoringProfile {
  key: string           // Profile key (A, B, C, D, E...)
  name: string          // Profile name (e.g., "HEINEKEN – L'ICONIQUE")
  description: string   // Profile description
  imageStyle: string    // Visual style for AI prompt
}

/**
 * Quiz Scoring block configuration
 */
export interface IQuizScoringConfig {
  name: string                        // Unique name for this scoring block (used as variable prefix)
  selectedQuestionIds: string[]       // IDs of questions included in scoring
  questionMappings: IQuestionMapping[] // Mapping for each selected question
  profiles: IScoringProfile[]          // Profile definitions (min 2)
}

/**
 * Pipeline block configuration (Step 4)
 */
export interface IPipelineBlockConfig {
  // Crop & Resize
  format?: 'square' | '16:9' | '4:3' | 'original'
  dimensions?: number // 256-2048

  // AI Generation
  modelId?: string // 'gpt-image-1', 'gemini-2.5-flash-image'
  promptTemplate?: string // max 2000 chars
  aspectRatio?: AspectRatio // '1:1', '9:16', '16:9', '2:3', '3:2' (Story 4.8)
  referenceImages?: IReferenceImage[] // Multi-image references (Story 4.8)

  // Legacy image configuration (deprecated - use referenceImages instead)
  imageUsageMode?: ImageUsageMode
  imageSource?: ImageSourceType
  imageUrl?: string
  sourceBlockId?: string

  // Filters (future)
  filters?: string[]

  // Quiz Scoring
  quizScoring?: IQuizScoringConfig
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
 * AI Model configuration (Step 4)
 */
export interface IAIModel {
  modelId: string
  prompt: string
  variables: string[]
}
