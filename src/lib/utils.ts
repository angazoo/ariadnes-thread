import type {
  PyramidTier,
  Session,
  Category,
  QuickCapture,
  AdventureLog,
} from './types'

export type QuickCaptureKind = NonNullable<QuickCapture['kind']>

const QUICK_CAPTURE_ICON: Record<QuickCaptureKind, string> = {
  feeling: '❤️',
  thought: '🧠',
  'nervous-system': '🦎',
  idea: '💡',
}

const QUICK_CAPTURE_LABEL: Record<QuickCaptureKind, string> = {
  feeling: 'feeling',
  thought: 'thought',
  'nervous-system': 'nervous system',
  idea: 'idea',
}

export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

/** Local calendar YYYY-MM-DD (matches typical user-facing "today"). */
export function ymdFromDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDaysYmd(ymd: string, delta: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(y, m - 1, d + delta)
  return ymdFromDate(dt)
}

/** Monday–Sunday week (local) containing `ymd`. */
export function weekRangeContaining(ymd: string): {
  start: string
  end: string
  shortLabel: string
} {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  const dow = dt.getDay()
  const mondayOffset = dow === 0 ? -6 : 1 - dow
  const monday = new Date(y, m - 1, d + mondayOffset)
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)
  const start = ymdFromDate(monday)
  const end = ymdFromDate(sunday)
  const a = new Date(start + 'T12:00:00')
  const b = new Date(end + 'T12:00:00')
  const shortLabel = `${a.toLocaleDateString([], { month: 'short', day: 'numeric' })} – ${b.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`
  return { start, end, shortLabel }
}

export function shiftWeek(ymd: string, weekDelta: number): string {
  return addDaysYmd(ymd, weekDelta * 7)
}

export function monthRangeFor(ymd: string): {
  start: string
  end: string
  label: string
  year: number
  month: number
} {
  const [y, m] = ymd.split('-').map(Number)
  const start = `${y}-${String(m).padStart(2, '0')}-01`
  const lastDay = new Date(y, m, 0).getDate()
  const end = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  const label = new Date(y, m - 1, 1).toLocaleDateString([], {
    month: 'long',
    year: 'numeric',
  })
  return { start, end, label, year: y, month: m }
}

export function shiftMonth(ymd: string, monthDelta: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const firstOfTarget = new Date(y, m - 1 + monthDelta, 1)
  const y2 = firstOfTarget.getFullYear()
  const m2 = firstOfTarget.getMonth()
  const lastDay = new Date(y2, m2 + 1, 0).getDate()
  const day = Math.min(d, lastDay)
  return ymdFromDate(new Date(y2, m2, day))
}

export function isYmdInRange(
  ymd: string,
  start: string,
  end: string
): boolean {
  return ymd >= start && ymd <= end
}

/** True if today's Adventure Log has no weather + no quick check-in text yet. */
export function isAdventureLogSurfaceEmpty(log?: AdventureLog | null): boolean {
  if (!log) return true
  const wm = log.weatherMood as string | undefined
  const hasWeather = Boolean(wm && wm.length > 0)
  const hasQuickText = [log.howAreYou, log.onMind].some((s) =>
    (s ?? '').trim()
  )
  return !hasWeather && !hasQuickText
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
  act: { bg: '#EFE6E1', text: '#6B3F32', accent: '#A86B55' },
  forage: { bg: '#E4EDE6', text: '#3F5F48', accent: '#6A8B72' },
  think: { bg: '#E2E8EC', text: '#3D5563', accent: '#5F7D8C' },
  connect: { bg: '#EDE8DC', text: '#6A5F35', accent: '#9A8A55' },
  tidy: { bg: '#EAE8E4', text: '#56524E', accent: '#84807A' },
  digest: { bg: '#EBE4E8', text: '#5E4554', accent: '#8A6B7A' },
  build: { bg: '#EDE5DE', text: '#6B4630', accent: '#A06A4E' },
  write: { bg: '#E5E5EC', text: '#474B66', accent: '#6C7090' },
  tend: { bg: '#E5ECDF', text: '#45603C', accent: '#759868' },
  engage: { bg: '#EDE8DC', text: '#6A5F35', accent: '#9A8A55' },
  process: { bg: '#E2E8EC', text: '#3D5563', accent: '#5F7D8C' },
  admin: { bg: '#E9E7E4', text: '#55514D', accent: '#7A7570' },
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

export function aggregateJournalNotes(sessions: Session[]): QuickCapture[] {
  return sessions
    .flatMap((s) => s.journalEntries ?? [])
    .sort((a, b) => a.at - b.at)
}

export function aggregateParkingNotes(sessions: Session[]): QuickCapture[] {
  return sessions
    .flatMap((s) => s.parkingEntries ?? [])
    .sort((a, b) => a.at - b.at)
}

export function quickCaptureIcon(kind?: QuickCapture['kind']): string {
  return QUICK_CAPTURE_ICON[kind ?? 'thought']
}

export function quickCaptureLabel(kind?: QuickCapture['kind']): string {
  return QUICK_CAPTURE_LABEL[kind ?? 'thought']
}

export interface EmotionalHighlight {
  session: Session
  category?: Category
  label: string
  atmosphere: number
}

/** Sessions with highest pre-session emotional atmosphere (resistance). */
export function highestResistanceSessions(
  sessions: Session[],
  categoryMap: Record<string, Category>,
  take = 2
): EmotionalHighlight[] {
  return sessions
    .filter((s) => s.circleBefore != null)
    .map((s) => ({
      session: s,
      category: categoryMap[s.categoryId],
      atmosphere: s.circleBefore!.atmosphere,
    }))
    .sort((a, b) => b.atmosphere - a.atmosphere)
    .slice(0, take)
    .map((x) => ({
      ...x,
      label: 'Felt heavy going in',
    }))
}

export function lowestResistanceSessions(
  sessions: Session[],
  categoryMap: Record<string, Category>,
  take = 2
): EmotionalHighlight[] {
  return sessions
    .filter((s) => s.circleBefore != null)
    .map((s) => ({
      session: s,
      category: categoryMap[s.categoryId],
      atmosphere: s.circleBefore!.atmosphere,
    }))
    .sort((a, b) => a.atmosphere - b.atmosphere)
    .slice(0, take)
    .map((x) => ({
      ...x,
      label: 'Felt light going in',
    }))
}
