// Email configuration types (Step 5)

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
