import { z } from 'zod'

const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Enter a valid email')

const passwordSchema = z
  .string()
  .min(1, 'Password is required')
  .min(8, 'Must be at least 8 characters')
  .regex(
    /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9\W])/,
    'Password must include at least one uppercase letter, one lowercase letter, and one number or symbol',
  )

const usernameSchema = z
  .string()
  .min(1, 'Username is required')
  .min(3, 'Must be at least 3 characters')

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
})

export type LoginFormValues = z.infer<typeof loginSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>
