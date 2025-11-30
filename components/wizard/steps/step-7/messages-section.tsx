'use client'

import { UseFormReturn } from 'react-hook-form'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { parseLoadingMessages, getLoadingMessagesCountLabel } from '@/lib/utils/loading-messages'

interface MessagesSectionProps {
  form: UseFormReturn<any>
  open: boolean
  onToggle: () => void
  loadingMessagesText: string
  setLoadingMessagesText: (value: string) => void
  loadingMessagesError: string | null
  setLoadingMessagesError: (value: string | null) => void
  defaultLoadingMessages: string[]
}

export function MessagesSection({
  form,
  open,
  onToggle,
  loadingMessagesText,
  setLoadingMessagesText,
  loadingMessagesError,
  setLoadingMessagesError,
  defaultLoadingMessages,
}: MessagesSectionProps) {
  const handleLoadingMessagesChange = (value: string) => {
    setLoadingMessagesText(value)
    setLoadingMessagesError(null)
  }

  return (
    <Collapsible open={open} onOpenChange={onToggle}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between text-lg">
              <span>Messages personnalisés</span>
              <ChevronDown
                className={cn(
                  'h-5 w-5 transition-transform',
                  open && 'rotate-180'
                )}
              />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Welcome Message */}
            <FormField
              control={form.control}
              name="customization.welcomeMessage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message de bienvenue (optionnel)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ''}
                      placeholder="Bienvenue à notre événement !"
                      maxLength={200}
                    />
                  </FormControl>
                  <FormDescription>
                    Affiché en haut du formulaire. Max 200 caractères.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submission Message */}
            <FormField
              control={form.control}
              name="customization.submissionMessage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message après soumission</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Merci ! Votre résultat arrive..."
                      maxLength={100}
                    />
                  </FormControl>
                  <FormDescription>
                    Affiché juste après l&apos;envoi du formulaire. Max 100 caractères.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Loading Messages */}
            <div className="space-y-2">
              <FormLabel className="flex items-center justify-between">
                <span>Messages de chargement</span>
                <span className="text-sm text-muted-foreground">
                  {getLoadingMessagesCountLabel(parseLoadingMessages(loadingMessagesText))}
                </span>
              </FormLabel>
              <Textarea
                value={loadingMessagesText}
                onChange={(e) => handleLoadingMessagesChange(e.target.value)}
                placeholder={defaultLoadingMessages.join('\n')}
                rows={5}
                className={cn(loadingMessagesError && 'border-destructive')}
              />
              <p className="text-sm text-muted-foreground">
                Un message par ligne. Min 3, max 10 messages. Chaque max 100 caractères.
              </p>
              {loadingMessagesError && (
                <p className="text-sm text-destructive">{loadingMessagesError}</p>
              )}
            </div>

            {/* Thank You Message */}
            <FormField
              control={form.control}
              name="customization.thankYouMessage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message de remerciement</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Merci d'avoir participé !"
                      maxLength={100}
                    />
                  </FormControl>
                  <FormDescription>
                    Affiché après la génération. Max 100 caractères.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
