'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { LogoutButton } from '@/components/auth/logout-button'

// Password requirements: min 8 chars, 1 uppercase, 1 digit, 1 special char
const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/

// Profile update schema
const profileSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom ne peut pas dépasser 100 caractères'),
})

// Password change schema
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Le mot de passe actuel est requis'),
  newPassword: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(passwordRegex, 'Le mot de passe doit contenir au moins une majuscule, un chiffre et un caractère spécial'),
  confirmPassword: z.string().min(1, 'Veuillez confirmer le mot de passe'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

/**
 * Calculate password strength (0-4)
 */
function getPasswordStrength(password: string): number {
  let strength = 0
  if (password.length >= 8) strength++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
  if (/\d/.test(password)) strength++
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) strength++
  return strength
}

/**
 * Get password strength label and color
 */
function getPasswordStrengthInfo(strength: number): { label: string; color: string } {
  switch (strength) {
    case 0:
    case 1:
      return { label: 'Faible', color: 'text-red-600' }
    case 2:
      return { label: 'Moyen', color: 'text-orange-600' }
    case 3:
      return { label: 'Bon', color: 'text-yellow-600' }
    case 4:
      return { label: 'Fort', color: 'text-green-600' }
    default:
      return { label: '', color: '' }
  }
}

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()
  const router = useRouter()
  const [isPasswordSectionOpen, setIsPasswordSectionOpen] = useState(false)
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false)
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)

  // No need to check auth here - AuthProvider handles it

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: errorsProfile },
    reset: resetProfile,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
    },
  })

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: errorsPassword, isValid: isPasswordValid },
    watch: watchPassword,
    reset: resetPassword,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    mode: 'onChange',
  })

  // Watch new password for strength indicator
  const newPassword = watchPassword('newPassword')
  useEffect(() => {
    if (newPassword) {
      setPasswordStrength(getPasswordStrength(newPassword))
    } else {
      setPasswordStrength(0)
    }
  }, [newPassword])

  // Reset profile form when user changes
  useEffect(() => {
    if (user) {
      resetProfile({ name: user.name || '' })
    }
  }, [user, resetProfile])

  // Handle profile update
  const onSubmitProfile = async (data: ProfileFormData) => {
    setIsSubmittingProfile(true)
    try {
      const result = await api.put('/api/users/me', { name: data.name })

      if (result.success && result.data) {
        updateUser({ name: result.data.name })
        toast.success('Profil mis à jour avec succès')
      } else {
        toast.error(result.error?.message || 'Erreur lors de la mise à jour du profil')
      }
    } catch (error) {
      toast.error('Une erreur est survenue')
    } finally {
      setIsSubmittingProfile(false)
    }
  }

  // Handle password change
  const onSubmitPassword = async (data: PasswordFormData) => {
    setIsSubmittingPassword(true)
    try {
      const result = await api.put('/api/users/me/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })

      if (result.success) {
        toast.success('Mot de passe changé avec succès ! Les autres sessions ont été déconnectées.')
        // Reset the password form
        resetPassword()
        // Close the collapsible section
        setIsPasswordSectionOpen(false)
      } else {
        if (result.error?.code === 'AUTH_1005') {
          toast.error('Mot de passe actuel incorrect')
        } else {
          toast.error(result.error?.message || 'Erreur lors du changement de mot de passe')
        }
      }
    } catch (error) {
      toast.error('Une erreur est survenue')
    } finally {
      setIsSubmittingPassword(false)
    }
  }

  // AuthProvider ensures we're authenticated
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const strengthInfo = getPasswordStrengthInfo(passwordStrength)

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Mon Profil</h1>
          <p className="text-muted-foreground mt-2">Gérez vos informations personnelles</p>
        </div>

        {/* Profile Information Card */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Informations du profil</h2>
          <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-4">
            {/* Email (read-only) */}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user.email}
                disabled
                className="bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">
                L'email ne peut pas être modifié
              </p>
            </div>

            {/* Name (editable) */}
            <div>
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                type="text"
                {...registerProfile('name')}
                className={errorsProfile.name ? 'border-red-500' : ''}
              />
              {errorsProfile.name && (
                <p className="text-xs text-red-600 mt-1">{errorsProfile.name.message}</p>
              )}
            </div>

            <Button type="submit" disabled={isSubmittingProfile}>
              {isSubmittingProfile ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </form>
        </Card>

        {/* Change Password Section (Collapsible) */}
        <Card className="p-6">
          <Collapsible open={isPasswordSectionOpen} onOpenChange={setIsPasswordSectionOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <h2 className="text-xl font-semibold">Changer le mot de passe</h2>
              {isPasswordSectionOpen ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-4">
              <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
                {/* Current Password */}
                <div>
                  <Label htmlFor="currentPassword">
                    Mot de passe actuel <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    {...registerPassword('currentPassword')}
                    className={errorsPassword.currentPassword ? 'border-red-500' : ''}
                  />
                  {errorsPassword.currentPassword && (
                    <p className="text-xs text-red-600 mt-1">
                      {errorsPassword.currentPassword.message}
                    </p>
                  )}
                </div>

                {/* New Password */}
                <div>
                  <Label htmlFor="newPassword">
                    Nouveau mot de passe <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    {...registerPassword('newPassword')}
                    className={errorsPassword.newPassword ? 'border-red-500' : ''}
                  />
                  {newPassword && passwordStrength > 0 && (
                    <p className={`text-xs mt-1 ${strengthInfo.color}`}>
                      Force du mot de passe: {strengthInfo.label}
                    </p>
                  )}
                  {errorsPassword.newPassword && (
                    <p className="text-xs text-red-600 mt-1">
                      {errorsPassword.newPassword.message}
                    </p>
                  )}
                  <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                    <li>• Minimum 8 caractères</li>
                    <li>• Au moins 1 majuscule</li>
                    <li>• Au moins 1 chiffre</li>
                    <li>• Au moins 1 caractère spécial (!@#$%^&*...)</li>
                  </ul>
                </div>

                {/* Confirm Password */}
                <div>
                  <Label htmlFor="confirmPassword">
                    Confirmer le nouveau mot de passe <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...registerPassword('confirmPassword')}
                    className={errorsPassword.confirmPassword ? 'border-red-500' : ''}
                  />
                  {errorsPassword.confirmPassword && (
                    <p className="text-xs text-red-600 mt-1">
                      {errorsPassword.confirmPassword.message}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={!isPasswordValid || isSubmittingPassword}>
                    {isSubmittingPassword ? 'Modification...' : 'Changer le mot de passe'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      resetPassword()
                      setIsPasswordSectionOpen(false)
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Logout Section */}
        <Card className="p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">Actions du compte</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Déconnectez-vous de votre compte pour sécuriser votre session.
              </p>
              <LogoutButton variant="destructive" showConfirmation={true} />
            </div>
          </div>
        </Card>

        {/* Back to Dashboard */}
        <div className="mt-6">
          <Button variant="ghost" onClick={() => router.push('/dashboard')}>
            ← Retour au dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
