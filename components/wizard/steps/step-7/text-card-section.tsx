'use client'

import { Controller, UseFormReturn } from 'react-hook-form'
import { Type, ChevronDown } from 'lucide-react'
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
import { Switch } from '@/components/ui/switch'
import { ColorPicker } from '@/components/ui/color-picker'

interface TextCardSectionProps {
  form: UseFormReturn<any>
  open: boolean
  onToggle: () => void
  textCardEnabled: boolean
}

export function TextCardSection({ form, open, onToggle, textCardEnabled }: TextCardSectionProps) {
  return (
    <Collapsible open={open} onOpenChange={onToggle}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                Carte de contenu
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
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              La carte de contenu garantit la lisibilité du texte sur n&apos;importe quel fond.
              Elle sera utilisée pour les questions, le selfie et les résultats.
            </p>

            {/* Enable Toggle */}
            <FormField
              control={form.control}
              name="customization.textCard.enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Activer la carte</FormLabel>
                    <FormDescription>
                      Affiche le contenu dans une carte semi-transparente
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Card Configuration (only if enabled) */}
            {textCardEnabled && (
              <div className="space-y-4 pt-2">
                {/* Card Background Color */}
                <Controller
                  name="customization.textCard.backgroundColor"
                  control={form.control}
                  render={({ field }) => (
                    <ColorPicker
                      value={field.value || '#FFFFFF'}
                      onChange={field.onChange}
                      label="Couleur de la carte"
                      helpText="Couleur de fond de la carte de contenu"
                    />
                  )}
                />

                {/* Card Opacity */}
                <FormField
                  control={form.control}
                  name="customization.textCard.opacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opacité: {field.value ?? 90}%</FormLabel>
                      <FormControl>
                        <Slider
                          min={0}
                          max={100}
                          step={5}
                          value={[field.value ?? 90]}
                          onValueChange={([value]) => field.onChange(value)}
                          className="w-full"
                        />
                      </FormControl>
                      <FormDescription>
                        0% = transparent, 100% = opaque
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Card Border Radius */}
                <FormField
                  control={form.control}
                  name="customization.textCard.borderRadius"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Arrondi des coins: {field.value ?? 12}px</FormLabel>
                      <FormControl>
                        <Slider
                          min={0}
                          max={24}
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

                {/* Card Padding */}
                <FormField
                  control={form.control}
                  name="customization.textCard.padding"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Espacement interne: {field.value ?? 16}px</FormLabel>
                      <FormControl>
                        <Slider
                          min={8}
                          max={32}
                          step={4}
                          value={[field.value ?? 16]}
                          onValueChange={([value]) => field.onChange(value)}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
