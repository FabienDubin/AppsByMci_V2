// Animations filters component
// Contains status tabs, admin scope switch, and search input

'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { FilterType, ScopeType } from '../_hooks/use-animations'

interface AnimationsFiltersProps {
  filter: FilterType
  onFilterChange: (filter: FilterType) => void
  scope: ScopeType
  onScopeChange: (showAll: boolean) => void
  search: string
  onSearchChange: (search: string) => void
  isAdmin: boolean
}

export function AnimationsFilters({
  filter,
  onFilterChange,
  scope,
  onScopeChange,
  search,
  onSearchChange,
  isAdmin,
}: AnimationsFiltersProps) {
  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* Top row: Tabs and admin switch */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Tabs value={filter} onValueChange={(value) => onFilterChange(value as FilterType)}>
          <TabsList>
            <TabsTrigger value="active">Actives</TabsTrigger>
            <TabsTrigger value="archived">Archivées</TabsTrigger>
            <TabsTrigger value="all">Toutes</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Admin scope switch */}
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Switch
              id="scope-switch"
              checked={scope === 'all'}
              onCheckedChange={onScopeChange}
            />
            <Label htmlFor="scope-switch" className="text-sm text-muted-foreground cursor-pointer">
              Voir toutes les animations
            </Label>
          </div>
        )}
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher par nom..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {search && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            onClick={() => onSearchChange('')}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Effacer la recherche</span>
          </Button>
        )}
      </div>
    </div>
  )
}
