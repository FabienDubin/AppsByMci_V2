'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/lib/stores/auth.store'
import { toast } from 'sonner'

interface LogoutButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  showConfirmation?: boolean
  className?: string
}

export function LogoutButton({
  variant = 'outline',
  showConfirmation = false,
  className
}: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const clearAuth = useAuthStore((state) => state.clearAuth)

  const handleLogout = async () => {
    setIsLoading(true)

    try {
      // Call logout API endpoint
      await api.post('/api/auth/logout')

      // Clear auth store (JWT, user, isAuthenticated)
      clearAuth()

      // Show success toast
      toast.success('Déconnexion réussie')

      // Redirect to login page
      router.push('/login')
    } catch (error: any) {
      // Handle error (network, server, etc.)
      const errorMessage = error?.response?.data?.error?.message || 'Erreur lors de la déconnexion'
      toast.error(errorMessage)

      // Even on error, try to clear local state and redirect
      // (user should be able to logout even if API fails)
      clearAuth()
      router.push('/login')
    } finally {
      setIsLoading(false)
    }
  }

  if (showConfirmation) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant={variant} className={className} disabled={isLoading}>
            <LogOut className="mr-2 h-4 w-4" />
            Déconnexion
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la déconnexion</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez vous reconnecter pour accéder à votre compte.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} disabled={isLoading}>
              {isLoading ? 'Déconnexion...' : 'Déconnexion'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return (
    <Button
      variant={variant}
      onClick={handleLogout}
      disabled={isLoading}
      className={className}
    >
      <LogOut className="mr-2 h-4 w-4" />
      {isLoading ? 'Déconnexion...' : 'Déconnexion'}
    </Button>
  )
}
