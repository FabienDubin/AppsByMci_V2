'use client'

import { useMemo } from 'react'
import DOMPurify from 'dompurify'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Monitor, Smartphone } from 'lucide-react'
import { Toggle } from '@/components/ui/toggle'
import { useState } from 'react'
import { replaceVariablesWithPlaceholders, replaceSubjectVariables } from '@/lib/utils/email-variables'
import { cn } from '@/lib/utils'

interface EmailPreviewProps {
  subject: string
  bodyTemplate: string
  availableVariables: string[]
  senderName?: string
  senderEmail?: string
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
}: EmailPreviewProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop')

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
        {/* Email frame */}
        <div
          className={cn(
            'border rounded-lg bg-white overflow-hidden transition-all duration-200',
            viewMode === 'desktop' ? 'max-w-full' : 'max-w-[320px] mx-auto'
          )}
        >
          {/* Email header (sender info) */}
          <div className="px-4 py-3 border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{senderName}</p>
                <p className="text-xs text-muted-foreground truncate">{senderEmail}</p>
              </div>
            </div>
          </div>

          {/* Subject line */}
          <div className="px-4 py-3 border-b">
            <p className="font-semibold text-sm">
              {processedSubject || (
                <span className="text-muted-foreground italic">Pas de sujet</span>
              )}
            </p>
          </div>

          {/* Email body */}
          <div
            className={cn(
              'p-4 prose prose-sm max-w-none',
              '[&_p]:my-2 [&_a]:text-primary [&_a]:underline',
              '[&_.text-primary]:text-primary [&_.font-semibold]:font-semibold',
              '[&_.text-destructive]:text-destructive',
              viewMode === 'mobile' && 'text-sm'
            )}
            dangerouslySetInnerHTML={{
              __html: processedBody || '<p class="text-muted-foreground italic">Pas de contenu</p>',
            }}
          />
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
