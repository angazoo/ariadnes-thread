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
  engage: { bg: '#F5F0E4', text: '#8A7B3C', accent: '#B89B5C' },
  digest: { bg: '#F0E8EC', text: '#7A5C6E', accent: '#9A7C8E' },
  admin: { bg: '#EEECEA', text: '#6A6560', accent: '#8A8580' },
}

export function getCategoryColors(colorKey: string) {
  return CATEGORY_COLORS[colorKey] ?? CATEGORY_COLORS.admin
}

export function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
