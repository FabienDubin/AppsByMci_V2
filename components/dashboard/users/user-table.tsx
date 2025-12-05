'use client'

import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MoreHorizontal, Pencil, Trash2, Search } from 'lucide-react'
import type { UserWithStats } from '@/app/dashboard/users/page'
import type { UserRole } from '@/lib/schemas/user.schema'

type FilterRole = UserRole | 'all'

interface UserTableProps {
  users: UserWithStats[]
  search: string
  onSearchChange: (value: string) => void
  roleFilter: FilterRole
  onRoleFilterChange: (value: FilterRole) => void
  onEdit: (user: UserWithStats) => void
  onDelete: (user: UserWithStats) => void
  currentUserId: string
}

// Role badge component
function RoleBadge({ role }: { role: UserRole }) {
  switch (role) {
    case 'admin':
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Admin</Badge>
    case 'editor':
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Éditeur</Badge>
    case 'viewer':
      return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">Lecteur</Badge>
    default:
      return <Badge variant="outline">{role}</Badge>
  }
}

// Format date for display
function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function UserTable({
  users,
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  onEdit,
  onDelete,
  currentUserId,
}: UserTableProps) {
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Role filter */}
        <Select value={roleFilter} onValueChange={(value) => onRoleFilterChange(value as FilterRole)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrer par rôle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les rôles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="editor">Éditeur</SelectItem>
            <SelectItem value="viewer">Lecteur</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {users.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Aucun utilisateur trouvé.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead className="text-center">Animations</TableHead>
              <TableHead>Créé le</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((userRow) => (
              <TableRow key={userRow.id}>
                <TableCell className="font-medium">
                  {userRow.name || '-'}
                  {userRow.id === currentUserId && (
                    <Badge variant="outline" className="ml-2 text-xs">Vous</Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{userRow.email}</TableCell>
                <TableCell>
                  <RoleBadge role={userRow.role} />
                </TableCell>
                <TableCell className="text-center">{userRow.animationCount}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(userRow.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Menu actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(userRow)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                      {userRow.id !== currentUserId && (
                        <DropdownMenuItem
                          onClick={() => onDelete(userRow)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
