'use client'

import { useMemo, useState } from 'react'
import DOMPurify from 'dompurify'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Monitor, Smartphone } from 'lucide-react'
import { Toggle } from '@/components/ui/toggle'
import { replaceVariablesWithPlaceholders, replaceSubjectVariables } from '@/lib/utils/email-variables'
import { cn } from '@/lib/utils'
import { DEFAULT_EMAIL_DESIGN } from '@/lib/constants/wizard-defaults'

interface EmailDesign {
  logoUrl?: string
  backgroundImageUrl?: string
  backgroundColor?: string
  backgroundColorOpacity?: number
  contentBackgroundColor?: string
  contentBackgroundOpacity?: number
  primaryColor?: string
  textColor?: string
  borderRadius?: number
  ctaText?: string
  ctaUrl?: string
}

interface EmailPreviewProps {
  subject: string
  bodyTemplate: string
  availableVariables: string[]
  senderName?: string
  senderEmail?: string
  design?: EmailDesign
}

/**
 * Convert hex color to rgba with opacity
 */
function hexToRgba(hex: string, opacity: number): string {
  const cleanHex = hex.replace('#', '')
  const r = parseInt(cleanHex.substring(0, 2), 16)
  const g = parseInt(cleanHex.substring(2, 4), 16)
  const b = parseInt(cleanHex.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`
}

/**
 * Email Preview Component
 * Displays a preview of the email with variables replaced by styled placeholders
 */
export function EmailPreview({
  subject,
  bodyTemplate,
  availableVariables,
  senderName = 'AppsByMCI',
  senderEmail = 'noreply@appsbymci.com',
  design = {},
}: EmailPreviewProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop')

  // Destructure design with defaults - EXACTLY like customization-preview does
  const {
    logoUrl = DEFAULT_EMAIL_DESIGN.logoUrl,
    backgroundImageUrl = DEFAULT_EMAIL_DESIGN.backgroundImageUrl,
    backgroundColor = DEFAULT_EMAIL_DESIGN.backgroundColor,
    backgroundColorOpacity = DEFAULT_EMAIL_DESIGN.backgroundColorOpacity,
    contentBackgroundColor = DEFAULT_EMAIL_DESIGN.contentBackgroundColor,
    contentBackgroundOpacity = DEFAULT_EMAIL_DESIGN.contentBackgroundOpacity,
    primaryColor = DEFAULT_EMAIL_DESIGN.primaryColor,
    textColor = DEFAULT_EMAIL_DESIGN.textColor,
    borderRadius = DEFAULT_EMAIL_DESIGN.borderRadius,
    ctaText = DEFAULT_EMAIL_DESIGN.ctaText,
    ctaUrl = DEFAULT_EMAIL_DESIGN.ctaUrl,
  } = design

  // Process subject with variable replacement
  const processedSubject = useMemo(() => {
    const result = replaceSubjectVariables(subject, availableVariables)
    return result.text
  }, [subject, availableVariables])

  // Process body with variable replacement and sanitization
  const processedBody = useMemo(() => {
    if (!bodyTemplate) return ''

    // Replace variables with placeholders
    const withPlaceholders = replaceVariablesWithPlaceholders(bodyTemplate, availableVariables)

    // Sanitize HTML to prevent XSS
    const sanitized = DOMPurify.sanitize(withPlaceholders, {
      ALLOWED_TAGS: ['p', 'strong', 'em', 'a', 'img', 'br', 'span', 'div'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'style', 'class', 'target'],
      ALLOW_DATA_ATTR: false,
    })

    return sanitized
  }, [bodyTemplate, availableVariables])

  // Determine background style - EXACTLY like customization-preview
  const getBackgroundStyle = () => {
    if (backgroundImageUrl) {
      return {
        backgroundImage: `url(${backgroundImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    }
    if (backgroundColor) {
      return {
        backgroundColor: backgroundColor,
      }
    }
    return {
      backgroundColor: '#f5f5f5',
    }
  }

  // Content background with opacity
  const contentBgColor = hexToRgba(contentBackgroundColor, contentBackgroundOpacity)

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4" />
            Aperçu de l&apos;email
          </CardTitle>
          <div className="flex items-center gap-1">
            <Toggle
              size="sm"
              pressed={viewMode === 'desktop'}
              onPressedChange={() => setViewMode('desktop')}
              aria-label="Vue desktop"
            >
              <Monitor className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={viewMode === 'mobile'}
              onPressedChange={() => setViewMode('mobile')}
              aria-label="Vue mobile"
            >
              <Smartphone className="h-4 w-4" />
            </Toggle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Email frame - EXACTLY like customization-preview structure */}
        <div
          className={cn(
            'rounded-lg border overflow-hidden',
            viewMode === 'desktop' ? 'max-w-full' : 'max-w-[320px] mx-auto'
          )}
        >
          {/* Email header (sender info) */}
          <div className="px-4 py-3 border-b bg-white">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <Mail className="h-5 w-5" style={{ color: primaryColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{senderName}</p>
                <p className="text-xs text-muted-foreground truncate">{senderEmail}</p>
              </div>
            </div>
          </div>

          {/* Subject line */}
          <div className="px-4 py-3 border-b bg-white">
            <p className="font-semibold text-sm">
              {processedSubject || (
                <span className="text-muted-foreground italic">Pas de sujet</span>
              )}
            </p>
          </div>

          {/* Email body area with background - EXACTLY like customization-preview */}
          <div
            className="relative p-4 min-h-[300px] flex flex-col"
            style={getBackgroundStyle()}
          >
            {/* Background overlay (only if background image exists) */}
            {backgroundImageUrl && backgroundColor && (
              <div
                className="absolute inset-0"
                style={{ backgroundColor: hexToRgba(backgroundColor, backgroundColorOpacity) }}
              />
            )}

            {/* Content - relative z-10 to be above overlay */}
            <div className="relative z-10 flex flex-col items-center w-full">
              {/* Logo */}
              {logoUrl && (
                <div className="text-center mb-4">
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="max-h-[60px] w-auto mx-auto"
                  />
                </div>
              )}

              {/* Content card */}
              <div
                className="w-full p-6"
                style={{
                  backgroundColor: contentBgColor,
                  borderRadius: `${borderRadius}px`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                {/* Email body */}
                <div
                  className={cn(
                    'prose prose-sm max-w-none',
                    '[&_p]:my-2 [&_a]:underline',
                    '[&_.text-primary]:text-primary [&_.font-semibold]:font-semibold',
                    '[&_.text-destructive]:text-destructive',
                    viewMode === 'mobile' && 'text-sm'
                  )}
                  style={{ color: textColor }}
                  dangerouslySetInnerHTML={{
                    __html: processedBody || '<p class="text-muted-foreground italic">Pas de contenu</p>',
                  }}
                />

                {/* Sample generated image placeholder */}
                <div className="mt-4 text-center">
                  <div
                    className="inline-block p-4 border-2 border-dashed border-muted-foreground/30 text-muted-foreground text-sm"
                    style={{ borderRadius: `${Math.min(borderRadius, 16)}px` }}
                  >
                    📷 Image générée ici
                  </div>
                </div>

                {/* CTA Button */}
                {ctaText && (
                  <div className="mt-4 text-center">
                    <a
                      href={ctaUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold no-underline"
                      style={{
                        backgroundColor: primaryColor,
                        borderRadius: `${Math.min(borderRadius, 12)}px`,
                      }}
                    >
                      {ctaText}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-primary">[VARIABLE]</span>
            <span>= Variable valide</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-destructive">[VARIABLE]</span>
            <span>= Variable inconnue</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
