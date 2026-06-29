import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { parseNum, formatInputVal, formatRelativeDate } from '@/lib/format'

describe('parseNum', () => {
  it('extracts number from formatted string', () => {
    expect(parseNum('1.000')).toBe(1000)
  })

  it('returns 0 for empty string', () => {
    expect(parseNum('')).toBe(0)
  })

  it('handles mixed formatting', () => {
    expect(parseNum('Rp 5,000')).toBe(5000)
  })
})

describe('formatInputVal', () => {
  it('formats numeric string with IDR separators', () => {
    expect(formatInputVal('1000')).toBe('1.000')
  })

  it('returns empty for empty input', () => {
    expect(formatInputVal('')).toBe('')
  })

  it('handles large numbers', () => {
    expect(formatInputVal('1000000')).toBe('1.000.000')
  })

  it('strips non-digit characters', () => {
    expect(formatInputVal('abc')).toBe('')
  })
})

describe('formatRelativeDate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-29T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "Hari ini" for today (id)', () => {
    expect(formatRelativeDate('2026-06-29T08:00:00', 'id')).toBe('Hari ini')
  })

  it('returns "Today" for today (en)', () => {
    expect(formatRelativeDate('2026-06-29T08:00:00', 'en')).toBe('Today')
  })

  it('returns "Kemarin" for yesterday (id)', () => {
    expect(formatRelativeDate('2026-06-28T08:00:00', 'id')).toBe('Kemarin')
  })

  it('returns "2 Hari lalu" for 2 days ago (id)', () => {
    expect(formatRelativeDate('2026-06-27T08:00:00', 'id')).toBe('2 Hari lalu')
  })

  it('returns "3 days ago" for 3 days ago (en)', () => {
    expect(formatRelativeDate('2026-06-26T08:00:00', 'en')).toBe('3 days ago')
  })
})
