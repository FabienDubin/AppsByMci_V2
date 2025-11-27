'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/lib/stores/auth.store'
import { toast } from 'sonner'

// Form validation schema
const loginFormSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

type LoginFormData = z.infer<typeof loginFormSchema>

export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const router = useRouter()
  const setAuth = useAuthStore((state) => state.setAuth)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    mode: 'onChange',
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setServerError(null)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!result.success) {
        // Clear password on error for security
        setValue('password', '')

        // Map error codes to user-friendly messages
        if (result.error?.code === 'AUTH_1001') {
          setServerError('Email ou mot de passe incorrect')
        } else if (result.error?.code === 'AUTH_1004') {
          setServerError('Trop de tentatives. Réessayez dans 1 heure.')
        } else {
          setServerError(result.error?.message || 'Une erreur est survenue')
        }
        return
      }

      // Store auth data and redirect
      setAuth(result.data.user, result.data.accessToken)
      toast.success('Connexion réussie')
      router.push('/dashboard')
    } catch (error) {
      setServerError('Erreur de connexion au serveur')
      setValue('password', '')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Bienvenue</CardTitle>
          <CardDescription>
            Connectez-vous à votre compte administrateur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-6">
              {/* Error display */}
              {serverError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {serverError}
                </div>
              )}

              {/* Email */}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  autoComplete="email"
                  disabled={isLoading}
                  className={errors.email ? 'border-destructive' : ''}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="grid gap-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  disabled={isLoading}
                  className={errors.password ? 'border-destructive' : ''}
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              {/* Submit */}
              <Button type="submit" disabled={isLoading || !isValid} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  'Se connecter'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
