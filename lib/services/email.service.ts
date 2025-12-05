// Email Service
// Handles sending generation results via Mailjet
// Story 4.7: Envoi email des résultats
// Step 5 Enhancement: Email design customization

import Mailjet from 'node-mailjet'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { blobStorageService } from '@/lib/blob-storage'
import type { IGeneration } from '@/models/Generation.model'
import type { IAnimation, IEmailDesign } from '@/models/Animation.model'

/**
 * Default email design values
 */
export const DEFAULT_EMAIL_DESIGN: Required<IEmailDesign> = {
  logoUrl: '',
  backgroundImageUrl: '',
  backgroundColor: '#f5f5f5',
  backgroundColorOpacity: 100,
  contentBackgroundColor: '#ffffff',
  contentBackgroundOpacity: 100,
  primaryColor: '#4F46E5',
  textColor: '#333333',
  borderRadius: 12,
  ctaText: '',
  ctaUrl: '',
}

/**
 * Email template data for variable substitution
 */
export interface EmailTemplateData {
  name?: string
  firstName?: string
  lastName?: string
  email: string
  animationName: string
  imageUrl: string
  viewResultLink: string
  downloadLink: string
}

/**
 * Email send result
 */
export interface EmailSendResult {
  success: boolean
  messageId?: string
  error?: {
    code: string
    message: string
  }
}

/**
 * Email validation schema (AC8)
 */
const emailSchema = z.string().email()

/**
 * Environment variable validation
 */
function getMailjetConfig() {
  const apiKey = process.env.MAILJET_API_KEY
  const apiSecret = process.env.MAILJET_SECRET_KEY
  const senderEmail = process.env.MAILJET_SENDER_EMAIL
  const senderName = process.env.MAILJET_SENDER_NAME || 'AppsByMCI'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  // Return null if Mailjet is not configured (graceful degradation)
  if (!apiKey || !apiSecret || !senderEmail) {
    return null
  }

  return { apiKey, apiSecret, senderEmail, senderName, appUrl }
}

/**
 * Validate email format using Zod (AC8)
 */
export function validateEmail(email: string): boolean {
  try {
    emailSchema.parse(email)
    return true
  } catch {
    return false
  }
}

/**
 * Sanitize HTML content to prevent XSS (AC8)
 * Basic sanitization - removes script tags and event handlers
 */
export function sanitizeHtml(html: string): string {
  if (!html) return ''

  return (
    html
      // Remove script tags and their content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove on* event handlers
      .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '')
      // Remove javascript: URLs
      .replace(/javascript\s*:/gi, '')
      // Remove data: URLs in href/src (potential XSS)
      .replace(/(href|src)\s*=\s*["']?\s*data:/gi, '$1=')
  )
}

/**
 * Render email template by replacing variables (AC3)
 * Supports both {variable} (wizard format) and {{variable}} formats
 */
export function renderTemplate(template: string, data: EmailTemplateData): string {
  if (!template) return ''

  let result = template

  // Variable mapping - supports multiple naming conventions
  const variables: Record<string, string | undefined> = {
    // Standard names
    name: data.name,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    animationName: data.animationName,
    imageUrl: data.imageUrl,
    viewResultLink: data.viewResultLink,
    downloadLink: data.downloadLink,
    // French aliases (used in wizard)
    nom: data.name || data.lastName,
    prenom: data.firstName,
  }

  // First, replace {{variable}} patterns (double braces) - must be done FIRST
  // Otherwise single-brace replacement would partially match double braces
  result = result.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
    return variables[key] ?? ''
  })

  // Special handling for {imageUrl} - if not already in an <img> tag, wrap it
  // This handles cases where users just put {imageUrl} as text instead of <img src="{imageUrl}">
  const imageUrlPattern = /(?<!src=["'])\{imageUrl\}(?!["'])/g
  if (imageUrlPattern.test(result)) {
    result = result.replace(
      imageUrlPattern,
      `<img src="${data.imageUrl}" alt="Image générée" style="max-width: 100%; height: auto; border-radius: 8px;" />`
    )
  }

  // Then replace {variable} patterns (wizard format - single braces)
  result = result.replace(/\{(\w+)\}/g, (_match, key) => {
    return variables[key] ?? ''
  })

  // Sanitize the rendered HTML
  return sanitizeHtml(result)
}

/**
 * Convert hex color to rgba with opacity
 */
function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`
}

/**
 * Build complete HTML email with design options
 * Wraps the body content with a styled email template
 *
 * @param bodyContent - The HTML body content (from bodyTemplate after variable substitution)
 * @param design - Email design options
 * @param data - Template data for additional placeholders
 * @returns Complete HTML email
 */
export function buildEmailHtml(
  bodyContent: string,
  design: IEmailDesign | undefined,
  data: EmailTemplateData
): string {
  // Merge with defaults
  const d: Required<IEmailDesign> = {
    ...DEFAULT_EMAIL_DESIGN,
    ...design,
  }

  // Background style
  const backgroundStyle = d.backgroundImageUrl
    ? `background-image: url('${d.backgroundImageUrl}'); background-size: cover; background-position: center;`
    : `background-color: ${d.backgroundColor};`

  // Background overlay color (when background image is present)
  const backgroundOverlayColor = d.backgroundImageUrl
    ? hexToRgba(d.backgroundColor, d.backgroundColorOpacity)
    : null

  // Content background with opacity
  const contentBgColor = hexToRgba(d.contentBackgroundColor, d.contentBackgroundOpacity)

  // Logo section
  const logoSection = d.logoUrl
    ? `
    <div style="text-align: center; padding: 24px 0;">
      <img src="${d.logoUrl}" alt="Logo" style="max-height: 60px; width: auto;" />
    </div>`
    : ''

  // Substitute {downloadLink} variable in ctaUrl
  const ctaUrl = d.ctaUrl ? d.ctaUrl.replace(/\{downloadLink\}/g, data.downloadLink) : '#'

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.animationName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; ${backgroundStyle} position: relative;">
  ${
    backgroundOverlayColor
      ? `<!-- Background overlay for image + color opacity -->
  <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: ${backgroundOverlayColor}; pointer-events: none;"></div>`
      : ''
  }
  <div style="max-width: 600px; margin: 0 auto; padding: 20px; position: relative;">
    ${logoSection}
    <!-- Content Card -->
    <div style="background-color: ${contentBgColor}; border-radius: ${
    d.borderRadius
  }px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <!-- Body Content (image is included via {imageUrl} variable in template) -->
      <div style="color: ${d.textColor}; font-size: 16px; line-height: 1.6;">
        ${bodyContent}
      </div>

      <!-- CTA Button (only if configured) -->
      ${
        d.ctaText
          ? `
      <div style="text-align: center; margin: 24px 0;">
        <a href="${ctaUrl}" style="display: inline-block; background-color: ${d.primaryColor}; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
          ${d.ctaText}
        </a>
      </div>
      `
          : ''
      }
    </div>

  </div>
</body>
</html>`
}

/**
 * Sleep utility for retry backoff
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Send email with retry logic (AC5)
 * Retries 2 times with exponential backoff (2s, 5s)
 */
async function sendWithRetry(
  mailjet: Mailjet,
  payload: {
    From: { Email: string; Name: string }
    ReplyTo?: { Email: string }
    To: Array<{ Email: string }>
    Subject: string
    HTMLPart: string
    TrackOpens?: 'account_default' | 'disabled' | 'enabled'
    TrackClicks?: 'account_default' | 'disabled' | 'enabled'
  },
  maxRetries: number = 2,
  delays: number[] = [2000, 5000]
): Promise<{ success: boolean; messageId?: string; error?: { code: string; message: string } }> {
  let lastError: any

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await mailjet.post('send', { version: 'v3.1' }).request({
        Messages: [payload],
      })

      // Extract message ID from response
      const body = response.body as { Messages?: Array<{ To?: Array<{ MessageID?: number }> }> }
      const messageId = body.Messages?.[0]?.To?.[0]?.MessageID?.toString()

      return { success: true, messageId }
    } catch (error: any) {
      lastError = error

      // Check if we should retry
      const statusCode = error?.statusCode || error?.response?.status
      const isRetryable =
        statusCode === 429 || // Rate limit
        statusCode === 503 || // Service unavailable
        statusCode === 502 || // Bad gateway
        statusCode === 504 // Gateway timeout

      if (!isRetryable) {
        logger.warn(
          {
            attempt: attempt + 1,
            statusCode,
            error: error.message,
            retryable: false,
          },
          'Email send failed with non-retryable error'
        )
        break
      }

      // Check if we have more retries
      if (attempt >= maxRetries) {
        logger.error(
          {
            attempt: attempt + 1,
            maxRetries: maxRetries + 1,
            error: error.message,
          },
          'All email retry attempts exhausted'
        )
        break
      }

      // Wait before retry
      const delay = delays[attempt] || delays[delays.length - 1]
      logger.warn(
        {
          attempt: attempt + 1,
          maxRetries: maxRetries + 1,
          delayMs: delay,
          statusCode,
        },
        'Retrying email send after delay'
      )
      await sleep(delay)
    }
  }

  // All retries failed
  return {
    success: false,
    error: {
      code: lastError?.statusCode?.toString() || 'EMAIL_SEND_FAILED',
      message: lastError?.message || 'Failed to send email after retries',
    },
  }
}

/**
 * Send generation result email (AC1, AC2, AC3, AC4, AC5, AC8)
 *
 * @param generation - Generation document with participant data and result
 * @param animation - Animation document with email config
 * @returns Email send result
 */
export async function sendGenerationResult(
  generation: IGeneration,
  animation: IAnimation
): Promise<EmailSendResult> {
  const generationId = generation._id.toString()

  // Check if email is enabled (AC6)
  if (!animation.emailConfig?.enabled) {
    logger.debug({ generationId }, 'Email disabled for animation, skipping')
    return { success: true } // Silent skip
  }

  // Get participant email (AC6)
  const participantEmail = generation.participantData?.email
  if (!participantEmail) {
    logger.debug({ generationId }, 'No participant email provided, skipping')
    return { success: true } // Silent skip
  }

  // Validate email format (AC8)
  if (!validateEmail(participantEmail)) {
    logger.warn({ generationId, email: participantEmail }, 'Invalid participant email format')
    return {
      success: false,
      error: {
        code: 'INVALID_EMAIL',
        message: 'Invalid email format',
      },
    }
  }

  // Get Mailjet config
  const config = getMailjetConfig()
  if (!config) {
    logger.warn({ generationId }, 'Mailjet not configured, skipping email send')
    return {
      success: false,
      error: {
        code: 'MAILJET_NOT_CONFIGURED',
        message: 'Mailjet credentials not configured',
      },
    }
  }

  try {
    // Initialize Mailjet client
    const mailjet = new Mailjet({
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
    })

    // Generate SAS URL for image (24h expiry for email - AC8)
    let imageUrl: string
    try {
      imageUrl = await blobStorageService.getResultSasUrl(generationId, 60 * 24) // 24 hours
    } catch (sasError) {
      logger.error({ generationId, error: sasError }, 'Failed to generate SAS URL for email')
      // Fallback to raw URL
      imageUrl = generation.generatedImageUrl || ''
    }

    // Build template data (AC3)
    const appUrl = config.appUrl || 'https://app.appsbymci.com'
    const animationSlug = animation.slug || animation._id.toString()

    const templateData: EmailTemplateData = {
      name: generation.participantData?.nom || generation.participantData?.prenom || '',
      firstName: generation.participantData?.prenom || '',
      lastName: generation.participantData?.nom || '',
      email: participantEmail,
      animationName: animation.name,
      imageUrl,
      viewResultLink: `${appUrl}/a/${animationSlug}/result/${generationId}`,
      downloadLink: `${appUrl}/api/generations/${generationId}/download`,
    }

    // Get email content from animation config
    const emailConfig = animation.emailConfig
    const subject = emailConfig.subject || 'Voici ton résultat !'
    const bodyTemplate = emailConfig.bodyTemplate || getDefaultBodyTemplate()

    // Render template with variables
    const renderedBody = renderTemplate(bodyTemplate, templateData)

    // Build final HTML with design options
    // If design is configured, use buildEmailHtml; otherwise use legacy template
    const htmlContent = emailConfig.design
      ? buildEmailHtml(renderedBody, emailConfig.design, templateData)
      : getDefaultEmailTemplate(renderedBody, templateData)

    // Build Mailjet payload (AC2)
    const payload = {
      From: {
        Email: config.senderEmail, // Fixed - verified domain
        Name: emailConfig.senderName || config.senderName, // Dynamic - admin configured
      },
      // Reply-To set only if admin provided a different email
      ...(emailConfig.senderEmail && emailConfig.senderEmail !== config.senderEmail
        ? { ReplyTo: { Email: emailConfig.senderEmail } }
        : {}),
      To: [{ Email: participantEmail }],
      Subject: subject,
      HTMLPart: htmlContent,
      // Enable tracking for opens and clicks
      TrackOpens: 'enabled' as const,
      TrackClicks: 'enabled' as const,
    }

    // Log email send attempt
    logger.info(
      {
        generationId,
        recipientEmail: participantEmail,
        animationId: animation._id.toString(),
        subject,
      },
      'Sending generation result email'
    )

    // Send with retry (AC5)
    const result = await sendWithRetry(mailjet, payload)

    if (result.success) {
      // Log success (AC4)
      logger.info(
        {
          event: 'email_sent',
          generationId,
          recipientEmail: participantEmail,
          messageId: result.messageId,
        },
        'Email sent successfully'
      )
    } else {
      // Log failure (AC5)
      logger.error(
        {
          event: 'email_failed',
          generationId,
          recipientEmail: participantEmail,
          error: result.error,
        },
        'Email send failed'
      )
    }

    return result
  } catch (error: any) {
    logger.error(
      {
        event: 'email_failed',
        generationId,
        error: error.message,
        stack: error.stack,
      },
      'Unexpected error sending email'
    )

    return {
      success: false,
      error: {
        code: 'EMAIL_UNEXPECTED_ERROR',
        message: error.message || 'Unexpected error sending email',
      },
    }
  }
}

/**
 * Get default body template (just the text content)
 * Used when animation doesn't have a custom body template
 * Uses {variable} format (single braces) to match wizard convention
 */
function getDefaultBodyTemplate(): string {
  return `<p style="font-size: 18px; margin: 0 0 24px 0; text-align: center;">
  Bonjour {prenom} ! 🎉
</p>
<p style="font-size: 16px; color: #666666; margin: 0 0 24px 0; text-align: center;">
  Voici ton image générée :
</p>`
}

/**
 * Get default email template (legacy - full HTML wrapper)
 * Used when no design is configured for backward compatibility
 *
 * @param bodyContent - Rendered body content
 * @param data - Template data for additional placeholders
 */
function getDefaultEmailTemplate(bodyContent: string, data: EmailTemplateData): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ton résultat - ${data.animationName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <!-- Header -->
      <div style="background-color: #4F46E5; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${data.animationName}</h1>
      </div>

      <!-- Content -->
      <div style="padding: 32px; text-align: center;">
        ${bodyContent}

        <!-- Generated Image -->
        <div style="margin: 24px 0;">
          <img src="${data.imageUrl}" alt="Ton résultat" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
        </div>

        <!-- Download Button -->
        <div style="margin: 24px 0;">
          <a href="${data.downloadLink}" style="display: inline-block; background-color: #4F46E5; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
            📥 Télécharger mon image
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 14px; color: #9ca3af; margin: 0;">
          Créé avec ${data.animationName}
        </p>
      </div>
    </div>
  </div>
</body>
</html>`
}

/**
 * Email service object
 */
export const emailService = {
  sendGenerationResult,
  validateEmail,
  renderTemplate,
  sanitizeHtml,
  buildEmailHtml,
  DEFAULT_EMAIL_DESIGN,
}
