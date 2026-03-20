import type { PyramidTier, Session, Category } from './types'

export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

export function formatTimeOfDay(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  const today = getTodayDate()
  if (dateStr === today) return 'Today'

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday'

  return date.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

const CATEGORY_COLORS: Record<
  string,
  { bg: string; text: string; accent: string }
> = {
  forage: { bg: '#E8F0EA', text: '#5A7A62', accent: '#7C9A82' },
  build: { bg: '#F5EBE4', text: '#8A5E3C', accent: '#B8785C' },
  write: { bg: '#EAEAF0', text: '#5A5E7E', accent: '#7A7E9E' },
  tend: { bg: '#EAF0E4', text: '#5A7A4E', accent: '#8AAA70' },
  engage: { bg: '#F5F0E4', text: '#8A7B3C', accent: '#B89B5C' },
  digest: { bg: '#F0E8EC', text: '#7A5C6E', accent: '#9A7C8E' },
  process: { bg: '#E4ECF0', text: '#4E6A7A', accent: '#6A8A9A' },
  admin: { bg: '#EEECEA', text: '#6A6560', accent: '#8A8580' },
}

export function getCategoryColors(colorKey: string) {
  return CATEGORY_COLORS[colorKey] ?? CATEGORY_COLORS.admin
}

const TIER_COLORS: Record<PyramidTier, { bg: string; text: string; accent: string }> = {
  foundation: { bg: '#F5EBE4', text: '#8A5E3C', accent: '#B8785C' },
  building: { bg: '#EAEAF0', text: '#5A5E7E', accent: '#7A7E9E' },
  treat: { bg: '#E8F0EA', text: '#5A7A62', accent: '#7C9A82' },
}

export function getTierColors(tier: PyramidTier) {
  return TIER_COLORS[tier]
}

export function getTierLabel(tier: PyramidTier): string {
  const labels: Record<PyramidTier, string> = {
    foundation: 'Foundation',
    building: 'Building',
    treat: 'Treat',
  }
  return labels[tier]
}

export function getTierEmoji(tier: PyramidTier): string {
  const emojis: Record<PyramidTier, string> = {
    foundation: '🧱',
    building: '🏗️',
    treat: '🍬',
  }
  return emojis[tier]
}

export interface PyramidBalance {
  foundation: number
  building: number
  treat: number
  total: number
  label: string
  isBalanced: boolean
}

export function computePyramidBalance(
  sessions: Session[],
  categoryMap: Record<string, Category>
): PyramidBalance {
  const totals = { foundation: 0, building: 0, treat: 0 }
  let total = 0

  for (const s of sessions) {
    const cat = categoryMap[s.categoryId]
    const duration = s.workDurationActual + s.digestDurationActual
    if (cat) {
      totals[cat.tier] += duration
    }
    total += duration
  }

  if (total === 0) {
    return { ...totals, total: 0, label: 'No sessions yet', isBalanced: true }
  }

  const fPct = totals.foundation / total
  const tPct = totals.treat / total

  let label: string
  let isBalanced: boolean

  if (fPct >= 0.3 && tPct <= 0.35) {
    label = 'Balanced day — nourishing mix'
    isBalanced = true
  } else if (tPct > 0.6) {
    label = 'Top-heavy — mostly treats today'
    isBalanced = false
  } else if (tPct > 0.35 && fPct < 0.2) {
    label = 'Leaning sweet — light on foundation'
    isBalanced = false
  } else if (fPct > 0.7) {
    label = 'All foundation — sturdy but maybe too rigid?'
    isBalanced = false
  } else {
    label = 'Getting there — keep going'
    isBalanced = true
  }

  return { ...totals, total, label, isBalanced }
}

export function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
