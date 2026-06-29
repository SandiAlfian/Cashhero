import { z } from 'zod'

export const authVerifySchema = z.object({
  idToken: z.string().min(1, 'idToken required'),
})

export const backupSaveSchema = z.object({
  transactions: z.array(z.any()).optional().default([]),
  settings: z.any().optional().default(null),
  budgets: z.array(z.any()).optional().default([]),
  goals: z.array(z.any()).optional().default([]),
  autoLogRules: z.array(z.any()).optional().default([]),
  trackedOutflows: z.array(z.any()).optional().default([]),
  portfolioAssets: z.array(z.any()).optional().default([]),
})

export const fcmRegisterSchema = z.object({
  token: z.string().min(1, 'token required'),
  lang: z.string().optional().default('id'),
  filter: z.string().optional().default('monthly'),
  remove: z.boolean().optional().default(false),
})

export const fcmRecurringSyncSchema = z.object({
  fcmToken: z.string().min(1, 'fcmToken required'),
  rules: z.array(z.any()),
})

export const fcmRecurringStateSchema = z.object({
  fcmToken: z.string().min(1, 'fcmToken required'),
})

export const fcmRecurringActionSchema = z.object({
  fcmToken: z.string().min(1, 'fcmToken required'),
  pendingId: z.string().min(1, 'pendingId required'),
  action: z.enum(['confirm', 'skip', 'reject'] as const),
})
