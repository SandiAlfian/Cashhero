import { describe, it, expect } from 'vitest'
import {
  authVerifySchema,
  backupSaveSchema,
  fcmRegisterSchema,
  fcmRecurringSyncSchema,
  fcmRecurringStateSchema,
  fcmRecurringActionSchema,
} from '@/lib/validation'

describe('authVerifySchema', () => {
  it('accepts valid idToken', () => {
    const r = authVerifySchema.safeParse({ idToken: 'abc123' })
    expect(r.success).toBe(true)
  })

  it('rejects empty idToken', () => {
    const r = authVerifySchema.safeParse({ idToken: '' })
    expect(r.success).toBe(false)
  })

  it('rejects missing idToken', () => {
    const r = authVerifySchema.safeParse({})
    expect(r.success).toBe(false)
  })
})

describe('backupSaveSchema', () => {
  it('accepts empty body with defaults', () => {
    const r = backupSaveSchema.safeParse({})
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.transactions).toEqual([])
      expect(r.data.settings).toBeNull()
    }
  })

  it('accepts full backup data', () => {
    const r = backupSaveSchema.safeParse({
      transactions: [{ id: '1', amount: 100 }],
      settings: { currency: 'IDR' },
      budgets: [{ category: 'food', limit: 500 }],
    })
    expect(r.success).toBe(true)
  })
})

describe('fcmRegisterSchema', () => {
  it('requires token', () => {
    const r = fcmRegisterSchema.safeParse({})
    expect(r.success).toBe(false)
  })

  it('applies defaults for lang and filter', () => {
    const r = fcmRegisterSchema.safeParse({ token: 'tok_123' })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.lang).toBe('id')
      expect(r.data.filter).toBe('monthly')
      expect(r.data.remove).toBe(false)
    }
  })

  it('accepts explicit values', () => {
    const r = fcmRegisterSchema.safeParse({ token: 'tok_123', lang: 'en', filter: 'weekly', remove: true })
    expect(r.success).toBe(true)
  })
})

describe('fcmRecurringSyncSchema', () => {
  it('requires fcmToken', () => {
    const r = fcmRecurringSyncSchema.safeParse({ rules: [] })
    expect(r.success).toBe(false)
  })

  it('requires rules field', () => {
    const r = fcmRecurringSyncSchema.safeParse({ fcmToken: 'tok_123' })
    expect(r.success).toBe(false)
  })

  it('accepts empty rules array', () => {
    const r = fcmRecurringSyncSchema.safeParse({ fcmToken: 'tok_123', rules: [] })
    expect(r.success).toBe(true)
  })
})

describe('fcmRecurringStateSchema', () => {
  it('requires fcmToken', () => {
    const r = fcmRecurringStateSchema.safeParse({})
    expect(r.success).toBe(false)
  })

  it('accepts valid fcmToken', () => {
    const r = fcmRecurringStateSchema.safeParse({ fcmToken: 'tok_123' })
    expect(r.success).toBe(true)
  })
})

describe('fcmRecurringActionSchema', () => {
  it('requires all fields', () => {
    const r = fcmRecurringActionSchema.safeParse({})
    expect(r.success).toBe(false)
  })

  it('rejects invalid action', () => {
    const r = fcmRecurringActionSchema.safeParse({ fcmToken: 'tok_123', pendingId: 'abc-2026-06-25', action: 'invalid' })
    expect(r.success).toBe(false)
  })

  it('accepts valid action', () => {
    const r = fcmRecurringActionSchema.safeParse({ fcmToken: 'tok_123', pendingId: 'abc-2026-06-25', action: 'confirm' })
    expect(r.success).toBe(true)
  })
})
