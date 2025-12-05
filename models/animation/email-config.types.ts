// Email configuration types (Step 5)

/**
 * Email design configuration
 * Controls visual appearance of the email template
 */
export interface IEmailDesign {
  logoUrl?: string // Logo displayed at top of email
  backgroundImageUrl?: string // Background image URL
  backgroundColor?: string // Background color (#hex, default: #f5f5f5)
  backgroundColorOpacity?: number // Opacity 0-100 (default: 100)
  contentBackgroundColor?: string // Content block background (#hex, default: #ffffff)
  contentBackgroundOpacity?: number // Opacity 0-100 (default: 100)
  primaryColor?: string // Button/link color (#hex, default: #4F46E5)
  textColor?: string // Main text color (#hex, default: #333333)
  borderRadius?: number // Border radius in px (default: 12)
  ctaText?: string // CTA button text (max 50 chars)
  ctaUrl?: string // CTA button URL
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
  design?: IEmailDesign // NEW - Email design options
}
