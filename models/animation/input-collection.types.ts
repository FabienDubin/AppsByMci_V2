// Input collection configuration types (Step 3)

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
