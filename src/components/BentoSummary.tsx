import type { Session, Category } from '../lib/types'
import { formatDuration, getCategoryColors } from '../lib/utils'

interface Props {
  sessions: Session[]
  categoryMap: Record<string, Category>
}

export default function BentoSummary({ sessions, categoryMap }: Props) {
  const byCategory: Record<string, number> = {}
  let totalSeconds = 0

  for (const s of sessions) {
    const total = s.workDurationActual + s.digestDurationActual
    byCategory[s.categoryId] = (byCategory[s.categoryId] ?? 0) + total
    totalSeconds += total
  }

  const entries = Object.entries(byCategory)
    .map(([id, seconds]) => ({ id, seconds, category: categoryMap[id] }))
    .sort((a, b) => b.seconds - a.seconds)

  if (totalSeconds === 0) return null

  return (
    <div className="card space-y-3">
      <div className="flex rounded-full overflow-hidden h-3 bg-warm-white">
        {entries.map(({ id, seconds, category }) => {
          const colors = getCategoryColors(category?.colorKey ?? 'admin')
          const pct = (seconds / totalSeconds) * 100
          return (
            <div
              key={id}
              style={{ width: `${pct}%`, backgroundColor: colors.accent }}
              className="transition-all duration-500"
              title={`${category?.name}: ${formatDuration(seconds)}`}
            />
          )
        })}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {entries.map(({ id, seconds, category }) => {
          const colors = getCategoryColors(category?.colorKey ?? 'admin')
          return (
            <div key={id} className="flex items-center gap-1.5 text-xs">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: colors.accent }}
              />
              <span className="text-warm-muted">
                {category?.emoji} {category?.name}
              </span>
              <span className="text-warm-light">{formatDuration(seconds)}</span>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-warm-border">
        <span className="text-xs text-warm-muted">
          {sessions.length} session{sessions.length !== 1 ? 's' : ''}
        </span>
        <span className="text-xs font-medium text-warm-text">
          {formatDuration(totalSeconds)} total
        </span>
      </div>
    </div>
  )
}
