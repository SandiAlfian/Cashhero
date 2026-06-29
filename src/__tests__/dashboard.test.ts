import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { buildPeriodSubLabel, filterTransactions, buildCashFlowData } from '@/lib/dashboard'
import type { Transaction } from '@/store/useTransactionStore'

const mockTx: Transaction = {
  id: '1',
  title: 'Test',
  amount: 10000,
  type: 'out',
  category: 'food',
  date: '2026-06-29T10:00:00',
  createdAt: '',
}

function makeTx(overrides: Partial<Transaction>): Transaction {
  return { ...mockTx, ...overrides }
}

describe('buildPeriodSubLabel', () => {
  it('returns Indonesian labels', () => {
    expect(buildPeriodSubLabel('daily', 'id')).toBe('Hari ini')
    expect(buildPeriodSubLabel('weekly', 'id')).toBe('Minggu ini')
    expect(buildPeriodSubLabel('monthly', 'id')).toBe('Bulan ini')
    expect(buildPeriodSubLabel('quarterly', 'id')).toBe('Kuartal ini')
    expect(buildPeriodSubLabel('customPeriod', 'id')).toBe('Periode Terpilih')
  })

  it('returns English labels', () => {
    expect(buildPeriodSubLabel('daily', 'en')).toBe('Today')
    expect(buildPeriodSubLabel('weekly', 'en')).toBe('This week')
  })
})

describe('filterTransactions', () => {
  const transactions = [
    makeTx({ id: '1', date: '2026-06-29T10:00:00' }),
    makeTx({ id: '2', date: '2026-06-28T10:00:00' }),
    makeTx({ id: '3', date: '2026-06-01T10:00:00' }),
    makeTx({ id: '4', date: '2026-05-15T10:00:00' }),
  ]

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-29T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('filters daily transactions', () => {
    const result = filterTransactions(transactions, 'daily', '', '')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('filters monthly transactions', () => {
    const result = filterTransactions(transactions, 'monthly', '', '')
    expect(result).toHaveLength(3)
  })

  it('filters by custom period', () => {
    const result = filterTransactions(transactions, 'customPeriod', '2026-06-01', '2026-06-15')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('3')
  })
})

describe('buildCashFlowData', () => {
  const transactions = [
    makeTx({ id: '1', amount: 50000, type: 'in', date: '2026-06-29T10:00:00' }),
    makeTx({ id: '2', amount: 25000, type: 'out', date: '2026-06-29T15:00:00' }),
  ]

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-29T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns 24 hourly data points for daily filter', () => {
    const data = buildCashFlowData(transactions, 'daily', 'id')
    expect(data).toHaveLength(24)
    expect(data[10].income).toBe(50000)
    expect(data[15].expense).toBe(25000)
  })

  it('returns 7 data points for weekly filter', () => {
    const data = buildCashFlowData(transactions, 'weekly', 'id')
    expect(data).toHaveLength(7)
  })

  it('correctly maps day indices for weekly view', () => {
    const data = buildCashFlowData(transactions, 'weekly', 'id')
    const mondayIdx = 0
    expect(data[mondayIdx]).toBeDefined()
  })
})
