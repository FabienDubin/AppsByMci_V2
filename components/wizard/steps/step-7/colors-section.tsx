'use client'

import { Controller, UseFormReturn } from 'react-hook-form'
import { Palette, Sun, Moon, Monitor, ChevronDown } from 'lucide-react'
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ColorPicker } from '@/components/ui/color-picker'

interface ColorsSectionProps {
  form: UseFormReturn<any>
  open: boolean
  onToggle: () => void
}

export function ColorsSection({ form, open, onToggle }: ColorsSectionProps) {
  return (
    <Collapsible open={open} onOpenChange={onToggle}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Couleurs
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
            {/* Primary Color */}
            <Controller
              name="customization.primaryColor"
              control={form.control}
              render={({ field }) => (
                <ColorPicker
                  value={field.value}
                  onChange={field.onChange}
                  label="Couleur principale"
                  helpText="Utilisée pour les boutons et éléments d'action"
                />
              )}
            />

            {/* Secondary Color */}
            <Controller
              name="customization.secondaryColor"
              control={form.control}
              render={({ field }) => (
                <ColorPicker
                  value={field.value}
                  onChange={field.onChange}
                  label="Couleur secondaire"
                  helpText="Utilisée pour les textes secondaires et bordures"
                />
              )}
            />

            {/* Theme */}
            <FormField
              control={form.control}
              name="customization.theme"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Thème</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-3 gap-4"
                    >
                      <FormItem>
                        <FormControl>
                          <label
                            className={cn(
                              'flex flex-col items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-all hover:bg-accent',
                              field.value === 'light' && 'border-primary bg-primary/5'
                            )}
                          >
                            <RadioGroupItem value="light" className="sr-only" />
                            <Sun className="h-5 w-5 mb-1" />
                            <span className="text-sm">Clair</span>
                          </label>
                        </FormControl>
                      </FormItem>
                      <FormItem>
                        <FormControl>
                          <label
                            className={cn(
                              'flex flex-col items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-all hover:bg-accent',
                              field.value === 'dark' && 'border-primary bg-primary/5'
                            )}
                          >
                            <RadioGroupItem value="dark" className="sr-only" />
                            <Moon className="h-5 w-5 mb-1" />
                            <span className="text-sm">Sombre</span>
                          </label>
                        </FormControl>
                      </FormItem>
                      <FormItem>
                        <FormControl>
                          <label
                            className={cn(
                              'flex flex-col items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-all hover:bg-accent',
                              field.value === 'auto' && 'border-primary bg-primary/5'
                            )}
                          >
                            <RadioGroupItem value="auto" className="sr-only" />
                            <Monitor className="h-5 w-5 mb-1" />
                            <span className="text-sm">Auto</span>
                          </label>
                        </FormControl>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
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
