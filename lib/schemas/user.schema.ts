import { z } from 'zod'

// User roles enum
export const userRoleSchema = z.enum(['admin', 'editor', 'viewer'])
export type UserRole = z.infer<typeof userRoleSchema>

// Password requirements: min 8 chars
// Note: For admin-created users, we use a simpler password policy
// since the password is temporary and user should change it on first login
const temporaryPasswordRegex = /.{8,}/

// Create user validation schema (admin creates user)
export const createUserByAdminSchema = z.object({
  email: z.string().email('Format email invalide'),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(temporaryPasswordRegex, 'Le mot de passe doit contenir au moins 8 caractères'),
  name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  role: userRoleSchema,
})

// Update user validation schema (admin updates user)
export const updateUserByAdminSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom ne peut pas dépasser 100 caractères').optional(),
  role: userRoleSchema.optional(),
})

// Get users query params validation schema
export const getUsersQuerySchema = z.object({
  search: z.string().optional(),
  role: userRoleSchema.optional(),
})

// Inferred types
export type CreateUserByAdmin = z.infer<typeof createUserByAdminSchema>
export type UpdateUserByAdmin = z.infer<typeof updateUserByAdminSchema>
export type GetUsersQuery = z.infer<typeof getUsersQuerySchema>
