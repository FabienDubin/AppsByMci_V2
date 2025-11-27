import { z } from 'zod'

// Password requirements: min 8 chars, 1 uppercase, 1 digit, 1 special char
const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/

// Registration validation schema
export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(
      passwordRegex,
      'Password must contain at least one uppercase letter, one digit and one special character'
    ),
  name: z.string().max(100).optional(),
})

// Login validation schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

// Inferred types
export type CreateUser = z.infer<typeof createUserSchema>
export type Login = z.infer<typeof loginSchema>
