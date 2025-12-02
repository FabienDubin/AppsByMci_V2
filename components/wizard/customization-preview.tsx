'use client'

import { useMemo } from 'react'
import DOMPurify from 'dompurify'
import { cn } from '@/lib/utils'
import type { Customization } from '@/lib/stores/wizard.store'
import { DEFAULT_TEXT_CARD } from '@/lib/stores/wizard.store'

interface CustomizationPreviewProps {
  /** Current customization values */
  customization: Partial<Customization>
  /** Additional class names */
  className?: string
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
 * Determine if a hex color is dark
 */
function isColorDark(color: string): boolean {
  const hex = color.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance < 0.5
}

/**
 * Live preview of customization settings
 * Shows a mock-up of how the participant experience will look
 */
export function CustomizationPreview({
  customization,
  className,
}: CustomizationPreviewProps) {
  const {
    primaryColor = '#000000',
    secondaryColor = '#71717a',
    logo,
    backgroundImage,
    backgroundColor,
    backgroundColorOpacity = 50,
    textCard = DEFAULT_TEXT_CARD,
    theme = 'auto',
    welcomeMessage,
    submissionMessage = 'Merci ! Votre résultat arrive...',
    loadingMessages = [],
    thankYouMessage = 'Merci d\'avoir participé !',
  } = customization

  // Determine background style
  const getBackgroundStyle = () => {
    if (backgroundImage) {
      // Image with optional color overlay
      return {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    }
    if (backgroundColor) {
      return {
        backgroundColor: backgroundColor,
      }
    }
    // Default gray background
    return {
      backgroundColor: '#f9fafb',
    }
  }

  // Determine text color based on theme and background
  const isDark = theme === 'dark' || (!backgroundImage && backgroundColor && isColorDark(backgroundColor))
  const textColor = isDark ? '#ffffff' : '#1f2937'
  const mutedTextColor = isDark ? '#9ca3af' : '#6b7280'

  // Get text card style
  const getTextCardStyle = (): React.CSSProperties | undefined => {
    if (!textCard?.enabled) return undefined

    const cardColor = textCard.backgroundColor || DEFAULT_TEXT_CARD.backgroundColor
    const cardOpacity = textCard.opacity ?? DEFAULT_TEXT_CARD.opacity
    const cardRadius = textCard.borderRadius ?? DEFAULT_TEXT_CARD.borderRadius
    const cardPadding = textCard.padding ?? DEFAULT_TEXT_CARD.padding

    return {
      backgroundColor: hexToRgba(cardColor, cardOpacity),
      borderRadius: `${cardRadius}px`,
      padding: `${cardPadding}px`,
      backdropFilter: 'blur(8px)',
    }
  }

  // Determine text color inside the card
  const getCardTextColor = () => {
    if (!textCard?.enabled) {
      return backgroundImage ? '#ffffff' : textColor
    }
    const cardColor = textCard.backgroundColor || DEFAULT_TEXT_CARD.backgroundColor
    return isColorDark(cardColor) ? '#ffffff' : '#1f2937'
  }

  const cardTextColor = getCardTextColor()
  const cardMutedTextColor = isColorDark(textCard?.backgroundColor || '#FFFFFF') ? '#d1d5db' : '#6b7280'

  // Sanitize welcome message HTML to prevent XSS (Story 3.13)
  const sanitizedWelcomeMessage = useMemo(() => {
    if (!welcomeMessage) return ''
    return DOMPurify.sanitize(welcomeMessage, {
      ALLOWED_TAGS: ['p', 'strong', 'em', 'a', 'br', 'span', 'h1', 'h2', 'h3'],
      ALLOWED_ATTR: ['href', 'target', 'class'],
    })
  }, [welcomeMessage])

  return (
    <div className={cn('rounded-lg border overflow-hidden', className)}>
      {/* Preview Header */}
      <div className="px-4 py-2 bg-muted border-b">
        <span className="text-sm font-medium">Aperçu en direct</span>
      </div>

      {/* Preview Content */}
      <div
        className="relative p-6 min-h-[450px] flex flex-col"
        style={getBackgroundStyle()}
      >
        {/* Background overlay (only if background image exists) */}
        {backgroundImage && backgroundColor && (
          <div
            className="absolute inset-0"
            style={{ backgroundColor: hexToRgba(backgroundColor, backgroundColorOpacity) }}
          />
        )}

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center space-y-4 w-full">
          {/* Logo (outside the card, always visible on background) */}
          {logo && (
            <img
              src={logo}
              alt="Logo"
              className="h-12 w-auto object-contain"
            />
          )}

          {/* Welcome Message (outside the card) - Renders sanitized HTML from WYSIWYG (Story 3.13) */}
          {sanitizedWelcomeMessage && (
            <div
              className={cn(
                'prose prose-sm max-w-none',
                // Normal paragraph text - matches card text style
                '[&_p]:my-1 [&_p]:text-sm [&_p]:font-normal',
                // Heading hierarchy (Story 3.13)
                '[&_h1]:text-xl [&_h1]:font-bold [&_h1]:my-2',
                '[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:my-1.5',
                '[&_h3]:text-base [&_h3]:font-medium [&_h3]:my-1',
                // Links
                '[&_a]:text-primary [&_a]:underline'
              )}
              style={{ color: backgroundImage || backgroundColor ? (isColorDark(backgroundColor || '#000000') ? '#ffffff' : textColor) : textColor }}
              dangerouslySetInnerHTML={{ __html: sanitizedWelcomeMessage }}
            />
          )}

          {/* Main Content Card - wraps all interactive content */}
          <div
            className="w-full max-w-xs space-y-4"
            style={getTextCardStyle()}
          >
            {/* Mock Form */}
            <div className="space-y-3">
              <p
                className="text-sm font-medium"
                style={{ color: textCard?.enabled ? cardTextColor : (backgroundImage ? '#ffffff' : textColor) }}
              >
                Exemple de formulaire
              </p>

              {/* Mock input */}
              <div className="rounded-md border bg-white/90 px-3 py-2 text-left">
                <span className="text-sm text-gray-400">Ton nom...</span>
              </div>

              {/* Primary button */}
              <button
                className="w-full rounded-md px-4 py-2 font-medium text-white transition-colors"
                style={{ backgroundColor: primaryColor }}
              >
                Commencer
              </button>

              {/* Secondary text */}
              <p
                className="text-xs"
                style={{ color: textCard?.enabled ? cardMutedTextColor : secondaryColor }}
              >
                Texte secondaire d&apos;exemple
              </p>
            </div>

            {/* Divider */}
            <div
              className="border-t"
              style={{ borderColor: textCard?.enabled ? hexToRgba(cardTextColor, 20) : 'rgba(0,0,0,0.1)' }}
            />

            {/* Submission Message Preview */}
            <div className="space-y-1">
              <div
                className="text-xs font-medium opacity-60"
                style={{ color: textCard?.enabled ? cardTextColor : (backgroundImage || backgroundColor ? '#ffffff' : textColor) }}
              >
                Après soumission :
              </div>
              <div
                className="rounded-lg px-3 py-1.5 text-sm"
                style={{
                  backgroundColor: primaryColor + '20',
                  color: primaryColor,
                }}
              >
                {submissionMessage}
              </div>
            </div>

            {/* Loading Messages Preview */}
            {loadingMessages.length > 0 && (
              <div className="space-y-1">
                <div
                  className="text-xs font-medium opacity-60"
                  style={{ color: textCard?.enabled ? cardTextColor : (backgroundImage || backgroundColor ? '#ffffff' : textColor) }}
                >
                  Messages de chargement :
                </div>
                <div className="space-y-0.5">
                  {loadingMessages.slice(0, 2).map((msg, idx) => (
                    <div
                      key={idx}
                      className="text-xs"
                      style={{ color: textCard?.enabled ? cardMutedTextColor : (backgroundImage || backgroundColor ? '#ffffff' : mutedTextColor) }}
                    >
                      {msg}
                    </div>
                  ))}
                  {loadingMessages.length > 2 && (
                    <div
                      className="text-xs opacity-50"
                      style={{ color: textCard?.enabled ? cardMutedTextColor : mutedTextColor }}
                    >
                      +{loadingMessages.length - 2} autres...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Thank You Message Preview */}
            <div>
              <div
                className="text-xs font-medium opacity-60 mb-1"
                style={{ color: textCard?.enabled ? cardTextColor : (backgroundImage || backgroundColor ? '#ffffff' : textColor) }}
              >
                Message final :
              </div>
              <div
                className="text-sm font-semibold"
                style={{ color: primaryColor }}
              >
                {thankYouMessage}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Color Legend */}
      <div className="px-4 py-3 bg-muted border-t flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-full border"
            style={{ backgroundColor: primaryColor }}
          />
          <span>Primaire</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-full border"
            style={{ backgroundColor: secondaryColor }}
          />
          <span>Secondaire</span>
        </div>
        {textCard?.enabled && (
          <div className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded border"
              style={{
                backgroundColor: hexToRgba(textCard.backgroundColor || '#FFFFFF', textCard.opacity ?? 90),
              }}
            />
            <span>Carte</span>
          </div>
        )}
        <span className="capitalize text-muted-foreground">{theme}</span>
      </div>
    </div>
  )
}

export default CustomizationPreview
