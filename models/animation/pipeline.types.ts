// Pipeline configuration types (Step 4)

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

  // AI Generation
  modelId?: string // 'gpt-image-1', 'gemini-2.5-flash-image'
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
 * AI Model configuration (Step 4)
 */
export interface IAIModel {
  modelId: string
  prompt: string
  variables: string[]
}
