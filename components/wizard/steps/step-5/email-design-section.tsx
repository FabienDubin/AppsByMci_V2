'use client'

import { Controller, UseFormReturn } from 'react-hook-form'
import { Palette, ChevronDown } from 'lucide-react'
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
import { Slider } from '@/components/ui/slider'
import { ColorPicker } from '@/components/ui/color-picker'
import { ImageUpload } from '@/components/ui/image-upload'

interface EmailDesignSectionProps {
  form: UseFormReturn<any>
  open: boolean
  onToggle: () => void
  getAuthToken: () => Promise<string | null>
  backgroundImageUrl?: string
}

export function EmailDesignSection({
  form,
  open,
  onToggle,
  getAuthToken,
  backgroundImageUrl,
}: EmailDesignSectionProps) {

  return (
    <Collapsible open={open} onOpenChange={onToggle}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Design de l&apos;email
              </span>
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
          <CardContent className="space-y-6">
            {/* Logo Upload */}
            <Controller
              name="design.logoUrl"
              control={form.control}
              render={({ field }) => (
                <ImageUpload
                  value={field.value}
                  onChange={field.onChange}
                  uploadEndpoint="/api/uploads/background?compress=true"
                  acceptedTypes={['image/png', 'image/jpeg', 'image/svg+xml']}
                  maxSize={2 * 1024 * 1024}
                  label="Logo"
                  helpText="PNG, JPG ou SVG. Max 2MB. Affiché en haut de l'email."
                  previewHeight={60}
                  getAuthToken={getAuthToken}
                />
              )}
            />

            {/* Background Image Upload */}
            <Controller
              name="design.backgroundImageUrl"
              control={form.control}
              render={({ field }) => (
                <ImageUpload
                  value={field.value}
                  onChange={field.onChange}
                  uploadEndpoint="/api/uploads/background?compress=true"
                  acceptedTypes={['image/png', 'image/jpeg']}
                  maxSize={5 * 1024 * 1024}
                  label="Image de fond"
                  helpText="PNG ou JPG. Max 5MB. Sera affichée en arrière-plan de l'email."
                  previewWidth={300}
                  previewHeight={180}
                  getAuthToken={getAuthToken}
                />
              )}
            />

            {/* Background Color */}
            <Controller
              name="design.backgroundColor"
              control={form.control}
              render={({ field }) => (
                <ColorPicker
                  value={field.value || '#f5f5f5'}
                  onChange={field.onChange}
                  label="Couleur de fond"
                  helpText={backgroundImageUrl
                    ? "Cette couleur sera superposée à l'image de fond avec l'opacité définie ci-dessous"
                    : "Cette couleur sera utilisée comme fond si aucune image n'est définie"
                  }
                />
              )}
            />

            {/* Background Opacity (only if background image exists) */}
            {backgroundImageUrl && (
              <FormField
                control={form.control}
                name="design.backgroundColorOpacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opacité du fond: {field.value ?? 100}%</FormLabel>
                    <FormControl>
                      <Slider
                        min={0}
                        max={100}
                        step={5}
                        value={[field.value ?? 100]}
                        onValueChange={([value]) => field.onChange(value)}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Content Background Color */}
            <Controller
              name="design.contentBackgroundColor"
              control={form.control}
              render={({ field }) => (
                <ColorPicker
                  value={field.value || '#ffffff'}
                  onChange={field.onChange}
                  label="Couleur du bloc contenu"
                  helpText="Couleur de fond du bloc principal contenant le texte et l'image"
                />
              )}
            />

            {/* Content Background Opacity */}
            <FormField
              control={form.control}
              name="design.contentBackgroundOpacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opacité du bloc contenu: {field.value ?? 100}%</FormLabel>
                  <FormControl>
                    <Slider
                      min={0}
                      max={100}
                      step={5}
                      value={[field.value ?? 100]}
                      onValueChange={([value]) => field.onChange(value)}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Primary Color */}
            <Controller
              name="design.primaryColor"
              control={form.control}
              render={({ field }) => (
                <ColorPicker
                  value={field.value || '#4F46E5'}
                  onChange={field.onChange}
                  label="Couleur primaire"
                  helpText="Utilisée pour le bouton de téléchargement et les liens"
                />
              )}
            />

            {/* Text Color */}
            <Controller
              name="design.textColor"
              control={form.control}
              render={({ field }) => (
                <ColorPicker
                  value={field.value || '#333333'}
                  onChange={field.onChange}
                  label="Couleur du texte"
                  helpText="Couleur principale du texte dans l'email"
                />
              )}
            />

            {/* Border Radius */}
            <FormField
              control={form.control}
              name="design.borderRadius"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Arrondi des bords: {field.value ?? 12}px</FormLabel>
                  <FormControl>
                    <Slider
                      min={0}
                      max={32}
                      step={2}
                      value={[field.value ?? 12]}
                      onValueChange={([value]) => field.onChange(value)}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* CTA Section */}
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-4">Bouton d&apos;action (CTA)</p>

              {/* CTA Text */}
              <FormField
                control={form.control}
                name="design.ctaText"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Texte du bouton</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ex: Télécharger mon image"
                        maxLength={50}
                      />
                    </FormControl>
                    <FormDescription>
                      Laisse vide pour masquer le bouton. Max 50 caractères.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* CTA URL */}
              <FormField
                control={form.control}
                name="design.ctaUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lien du bouton</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="https://example.com ou {downloadLink}"
                      />
                    </FormControl>
                    <FormDescription className="flex flex-col gap-2">
                      <span>URL vers laquelle le bouton redirige.</span>
                      <button
                        type="button"
                        onClick={() => field.onChange('{downloadLink}')}
                        className="inline-flex items-center gap-1 self-start px-2 py-1 text-xs font-medium rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                      >
                        {'{downloadLink}'}
                        <span className="text-muted-foreground">← Clic pour insérer</span>
                      </button>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
