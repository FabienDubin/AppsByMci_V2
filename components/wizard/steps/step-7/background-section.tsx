'use client'

import { Controller, UseFormReturn } from 'react-hook-form'
import { ImageIcon, ChevronDown, AlertTriangle } from 'lucide-react'
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
import { Slider } from '@/components/ui/slider'
import { ColorPicker } from '@/components/ui/color-picker'
import { ImageUpload } from '@/components/ui/image-upload'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface BackgroundSectionProps {
  form: UseFormReturn<any>
  open: boolean
  onToggle: () => void
  hasNoBackground: boolean
  backgroundImage: string | undefined
  getAuthToken: () => Promise<string | null>
}

export function BackgroundSection({
  form,
  open,
  onToggle,
  hasNoBackground,
  backgroundImage,
  getAuthToken,
}: BackgroundSectionProps) {
  return (
    <Collapsible open={open} onOpenChange={onToggle}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Fond
                {hasNoBackground && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    Non configuré
                  </span>
                )}
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
            {/* Warning if no background */}
            {hasNoBackground && (
              <Alert variant="default" className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  Aucun fond n&apos;est configuré. L&apos;animation utilisera le fond par défaut du thème.
                </AlertDescription>
              </Alert>
            )}

            {/* Logo Upload */}
            <Controller
              name="customization.logo"
              control={form.control}
              render={({ field }) => (
                <ImageUpload
                  value={field.value}
                  onChange={field.onChange}
                  uploadEndpoint="/api/uploads/logo"
                  acceptedTypes={['image/png', 'image/jpeg', 'image/svg+xml']}
                  maxSize={2 * 1024 * 1024}
                  label="Logo"
                  helpText="PNG, JPG ou SVG. Max 2MB."
                  previewHeight={80}
                  getAuthToken={getAuthToken}
                />
              )}
            />

            {/* Background Image Upload */}
            <Controller
              name="customization.backgroundImage"
              control={form.control}
              render={({ field }) => (
                <ImageUpload
                  value={field.value}
                  onChange={field.onChange}
                  uploadEndpoint="/api/uploads/background"
                  acceptedTypes={['image/png', 'image/jpeg']}
                  maxSize={5 * 1024 * 1024}
                  label="Image de fond"
                  helpText="PNG ou JPG. Max 5MB. Sera affichée en arrière-plan."
                  previewWidth={300}
                  previewHeight={180}
                  getAuthToken={getAuthToken}
                />
              )}
            />

            {/* Background Color with Color Picker */}
            <Controller
              name="customization.backgroundColor"
              control={form.control}
              render={({ field }) => (
                <ColorPicker
                  value={field.value || '#1a1a2e'}
                  onChange={field.onChange}
                  label="Couleur de fond (overlay)"
                  helpText={backgroundImage
                    ? "Cette couleur sera superposée à l'image de fond avec l'opacité définie ci-dessous"
                    : "Cette couleur sera utilisée comme fond si aucune image n'est définie"
                  }
                />
              )}
            />

            {/* Background Color Opacity (only if background image exists) */}
            {backgroundImage && (
              <FormField
                control={form.control}
                name="customization.backgroundColorOpacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opacité de l&apos;overlay: {field.value ?? 50}%</FormLabel>
                    <FormControl>
                      <Slider
                        min={0}
                        max={100}
                        step={5}
                        value={[field.value ?? 50]}
                        onValueChange={([value]) => field.onChange(value)}
                        className="w-full"
                      />
                    </FormControl>
                    <FormDescription>
                      Permet de teinter l&apos;image de fond avec la couleur sélectionnée
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
