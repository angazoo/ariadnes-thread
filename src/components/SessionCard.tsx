import type { Session, Category } from '../lib/types'
import { formatDuration, formatTimeOfDay, getCategoryColors } from '../lib/utils'

interface Props {
  session: Session
  category?: Category
}

export default function SessionCard({ session, category }: Props) {
  const colors = getCategoryColors(category?.colorKey ?? 'admin')
  const totalDuration = session.workDurationActual + session.digestDurationActual

  return (
    <div
      className="card flex gap-3"
      style={{ borderLeftColor: colors.accent, borderLeftWidth: 3 }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
        style={{ backgroundColor: colors.bg }}
      >
        {category?.emoji ?? '📌'}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm" style={{ color: colors.text }}>
            {category?.name ?? 'Unknown'}
          </span>
          <span className="text-xs text-warm-muted">
            {formatTimeOfDay(session.startedAt)}
          </span>
        </div>

        {session.intention && (
          <p className="text-sm text-warm-muted mt-0.5 truncate">
            {session.intention}
          </p>
        )}

        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-warm-light">
          <span>{formatDuration(totalDuration)}</span>
          {!session.digestSkipped && session.digestDurationActual > 0 && (
            <span>
              + {formatDuration(session.digestDurationActual)} digest
            </span>
          )}
          {(session.journalEntries?.length ?? 0) > 0 && (
            <span>📝 {session.journalEntries!.length}</span>
          )}
          {(session.parkingEntries?.length ?? 0) > 0 && (
            <span>🅿️ {session.parkingEntries!.length}</span>
          )}
          {session.circleBefore && session.circleBefore.atmosphere > 60 && (
            <span>weight {session.circleBefore.atmosphere}%</span>
          )}
        </div>
      </div>
    </div>
  )
}
