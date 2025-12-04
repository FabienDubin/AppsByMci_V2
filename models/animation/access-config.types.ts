// Access configuration types (Step 2)

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
