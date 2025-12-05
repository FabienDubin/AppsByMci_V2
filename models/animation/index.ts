// Barrel exports for Animation types

// Access configuration (Step 2)
export type { AccessConfigType, IAccessConfig } from './access-config.types'

// Base fields configuration (Step 2)
export type { IBaseFieldConfig, IAiConsent, IBaseFields } from './base-fields.types'

// Input collection (Step 3)
export type { InputElementType, IInputElement, IInputCollection } from './input-collection.types'

// Pipeline configuration (Step 4)
export type {
  PipelineBlockType,
  BlockName,
  ImageUsageMode,
  ImageSourceType,
  IPipelineBlockConfig,
  IPipelineBlock,
  IAIModel
} from './pipeline.types'

// Email configuration (Step 5)
export type { IEmailDesign, IEmailConfig } from './email-config.types'

// Public display configuration (Step 6)
export type { IDisplayConfig, IPublicDisplayConfig } from './public-display.types'

// Customization configuration (Step 7)
export type { ICustomizationLegacy, ITextCard, ICustomization } from './customization.types'
export { DEFAULT_LOADING_MESSAGES } from './customization.types'
