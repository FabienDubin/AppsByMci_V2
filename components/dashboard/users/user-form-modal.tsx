'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import type { UserRole } from '@/lib/schemas/user.schema'
import type { UserWithStats } from '@/app/dashboard/users/page'

export interface CreateUserData {
  email: string
  password: string
  name: string
  role: UserRole
}

export interface EditUserData {
  name?: string
  role?: UserRole
}

interface BaseUserFormModalProps {
  isOpen: boolean
  onClose: () => void
  isLoading?: boolean
}

interface CreateModeProps extends BaseUserFormModalProps {
  mode: 'create'
  onSubmit: (data: CreateUserData) => Promise<void>
  initialData?: never
}

interface EditModeProps extends BaseUserFormModalProps {
  mode: 'edit'
  onSubmit: (data: EditUserData) => Promise<void>
  initialData?: UserWithStats
}

type UserFormModalProps = CreateModeProps | EditModeProps

export function UserFormModal({
  mode,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  initialData,
}: UserFormModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<UserRole>('editor')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when modal opens/closes or when switching to edit mode with new data
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        setEmail(initialData.email)
        setName(initialData.name || '')
        setRole(initialData.role)
        setPassword('')
      } else {
        setEmail('')
        setPassword('')
        setName('')
        setRole('editor')
      }
      setErrors({})
    }
  }, [isOpen, mode, initialData])

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (mode === 'create') {
      if (!email.trim()) {
        newErrors.email = 'L\'email est requis'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.email = 'Format email invalide'
      }

      if (!password) {
        newErrors.password = 'Le mot de passe est requis'
      } else if (password.length < 8) {
        newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères'
      }
    }

    if (!name.trim()) {
      newErrors.name = 'Le nom est requis'
    } else if (name.length > 100) {
      newErrors.name = 'Le nom ne peut pas dépasser 100 caractères'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    try {
      if (mode === 'create') {
        await (onSubmit as (data: CreateUserData) => Promise<void>)({
          email: email.trim(),
          password,
          name: name.trim(),
          role,
        })
      } else {
        await (onSubmit as (data: EditUserData) => Promise<void>)({
          name: name.trim(),
          role,
        })
      }
    } catch {
      // Error is handled by parent component
    }
  }

  const title = mode === 'create' ? 'Nouvel utilisateur' : 'Modifier l\'utilisateur'
  const description = mode === 'create'
    ? 'Créer un nouveau compte utilisateur sur la plateforme.'
    : 'Modifier les informations de l\'utilisateur.'
  const submitLabel = mode === 'create' ? 'Créer' : 'Enregistrer'

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email field - only for create mode */}
          {mode === 'create' && (
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                disabled={isLoading}
                autoComplete="off"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>
          )}

          {/* Email display - for edit mode */}
          {mode === 'edit' && (
            <div className="space-y-2">
              <Label>Email</Label>
              <p className="text-sm text-muted-foreground py-2">{email}</p>
            </div>
          )}

          {/* Password field - only for create mode */}
          {mode === 'create' && (
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe *</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 caractères"
                disabled={isLoading}
                autoComplete="new-password"
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>
          )}

          {/* Name field */}
          <div className="space-y-2">
            <Label htmlFor="name">Nom *</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom complet"
              disabled={isLoading}
              autoComplete="off"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Role field */}
          <div className="space-y-2">
            <Label htmlFor="role">Rôle *</Label>
            <Select value={role} onValueChange={(value) => setRole(value as UserRole)} disabled={isLoading}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="editor">Éditeur</SelectItem>
                <SelectItem value="viewer">Lecteur</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {mode === 'create' ? 'Création...' : 'Enregistrement...'}
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
