'use client'

import { useEffect, useState, useMemo } from 'react'
import { use } from 'react'
import Link from 'next/link'
import DOMPurify from 'dompurify'
import { ParticipantProvider } from '@/components/participant/ParticipantContext'
import type { AnimationResponse } from '@/lib/services/animation.service'

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

interface ParticipantLayoutProps {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

/**
 * Participant layout with customization
 * Applies animation-specific theming (colors, logo, background)
 * This is a client component that fetches animation data
 */
export default function ParticipantLayout({
  children,
  params,
}: ParticipantLayoutProps) {
  const { slug } = use(params)
  const [animation, setAnimation] = useState<AnimationResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch animation data
  useEffect(() => {
    const fetchAnimation = async () => {
      try {
        const response = await fetch(`/api/animations/by-slug/${slug}`)
        const data = await response.json()

        if (!response.ok || !data.success) {
          setError('Animation introuvable')
          return
        }

        setAnimation(data.data)
      } catch {
        setError('Erreur de chargement')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnimation()
  }, [slug])

  // Extract customization (always call, even if animation is null)
  const customization = animation?.customization || {}
  const {
    primaryColor = '#000000',
    secondaryColor = '#71717a',
    logo,
    backgroundImage,
    backgroundColor,
    backgroundColorOpacity = 50,
    textCard,
    theme = 'auto',
    welcomeMessage,
  } = customization

  // Sanitize welcome message - MUST be called before any conditional returns
  const sanitizedWelcomeMessage = useMemo(() => {
    if (!welcomeMessage) return ''
    return DOMPurify.sanitize(welcomeMessage, {
      ALLOWED_TAGS: ['p', 'strong', 'em', 'a', 'br', 'span', 'h1', 'h2', 'h3'],
      ALLOWED_ATTR: ['href', 'target', 'class'],
    })
  }, [welcomeMessage])

  // Build background styles
  const backgroundStyle = useMemo((): React.CSSProperties => {
    if (backgroundImage) {
      return {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }
    }
    if (backgroundColor) {
      return {
        backgroundColor,
      }
    }
    return {
      backgroundColor: '#f9fafb',
    }
  }, [backgroundImage, backgroundColor])

  // Determine text colors based on theme
  const isDark = theme === 'dark'
  const textColor = isDark ? '#ffffff' : '#1f2937'

  // Text card styles
  const textCardStyle = useMemo((): React.CSSProperties | undefined => {
    if (!textCard?.enabled) return undefined

    const cardColor = textCard.backgroundColor || '#FFFFFF'
    const cardOpacity = textCard.opacity ?? 90
    const cardRadius = textCard.borderRadius ?? 12
    const cardPadding = textCard.padding ?? 16

    return {
      backgroundColor: hexToRgba(cardColor, cardOpacity),
      borderRadius: `${cardRadius}px`,
      padding: `${cardPadding}px`,
      backdropFilter: 'blur(8px)',
    }
  }, [textCard])

  // Handle loading state - AFTER all hooks
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400">Chargement...</div>
      </div>
    )
  }

  // Handle error state (animation not found) - AFTER all hooks
  if (error || !animation) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md">
          {/* 404 Icon */}
          <div className="mb-6">
            <svg
              className="mx-auto h-24 w-24 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Animation introuvable
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-8">
            L&apos;animation demandée n&apos;existe pas ou n&apos;est plus disponible.
          </p>

          {/* Action */}
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    )
  }

  return (
    <ParticipantProvider animation={animation}>
      <div
        className="min-h-screen relative"
        style={{
          ...backgroundStyle,
          // CSS custom properties for components
          ['--primary-color' as string]: primaryColor,
          ['--secondary-color' as string]: secondaryColor,
        }}
      >
        {/* Background overlay for images */}
        {backgroundImage && backgroundColor && (
          <div
            className="fixed inset-0 pointer-events-none"
            style={{ backgroundColor: hexToRgba(backgroundColor, backgroundColorOpacity) }}
          />
        )}

        {/* Main content area */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Logo - fixed at top */}
          {logo && (
            <div className="w-full flex justify-center pt-4 pb-2">
              <img
                src={logo}
                alt="Logo"
                className="h-12 w-auto object-contain"
              />
            </div>
          )}

          {/* Welcome message - appears once at top */}
          {sanitizedWelcomeMessage && (
            <div className="w-full max-w-md mx-auto px-4 py-2 text-center">
              <div
                className="prose prose-sm max-w-none [&_p]:my-1 [&_p]:text-sm [&_h1]:text-xl [&_h1]:font-bold [&_h1]:my-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:my-1.5 [&_h3]:text-base [&_h3]:font-medium [&_h3]:my-1 [&_a]:underline"
                style={{
                  color: backgroundImage ? '#ffffff' : textColor,
                  ['--tw-prose-links' as string]: primaryColor,
                }}
                dangerouslySetInnerHTML={{ __html: sanitizedWelcomeMessage }}
              />
            </div>
          )}

          {/* Content wrapper with text card */}
          <div className="flex-1 flex flex-col items-center px-4 pb-8">
            <div
              className="w-full max-w-md"
              style={textCardStyle}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </ParticipantProvider>
  )
}
