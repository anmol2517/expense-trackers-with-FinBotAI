import { z } from 'zod'

// Categories defined here to avoid importing mongoose on client
export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Personal Care',
  'Other',
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

// Auth validation schemas
export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .trim(),
  email: z
    .string({ required_error: 'Email is required' })
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password cannot exceed 100 characters'),
})

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
})

// Expense validation schemas
export const expenseSchema = z.object({
  amount: z
    .number({ required_error: 'Amount is required', invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be greater than 0')
    .max(1000000, 'Amount cannot exceed 1,000,000'),
  category: z.enum(EXPENSE_CATEGORIES, {
    errorMap: () => ({ message: 'Please select a valid category' }),
  }),
  description: z
    .string({ required_error: 'Description is required' })
    .min(1, 'Description is required')
    .max(200, 'Description cannot exceed 200 characters')
    .trim(),
  date: z
    .string({ required_error: 'Date is required' })
    .or(z.date())
    .refine((val) => !isNaN(new Date(val).getTime()), 'Invalid date')
    .transform((val) => new Date(val)),
})

export const expenseUpdateSchema = expenseSchema.partial()

export const expenseQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  category: z.enum(EXPENSE_CATEGORIES).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.enum(['date', 'amount', 'category']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ExpenseInput = z.infer<typeof expenseSchema>
export type ExpenseQueryInput = z.infer<typeof expenseQuerySchema>