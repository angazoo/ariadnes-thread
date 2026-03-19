import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import { useNavigation } from '../lib/store'
import { getTodayDate } from '../lib/utils'
import BentoSummary from './BentoSummary'
import SessionCard from './SessionCard'

export default function DailyView() {
  const { navigate } = useNavigation()
  const today = getTodayDate()

  const sessions = useLiveQuery(
    () => db.sessions.where('date').equals(today).sortBy('startedAt'),
    [today]
  )

  const categories = useLiveQuery(() => db.categories.toArray())

  if (!sessions || !categories) {
    return <div className="pt-8 text-center text-warm-muted">Loading…</div>
  }

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]))
  const hasSessions = sessions.length > 0

  return (
    <div className="space-y-6 pt-2 animate-fadeIn">
      {hasSessions ? (
        <>
          <BentoSummary sessions={sessions} categoryMap={categoryMap} />

          <div className="space-y-3">
            <h2 className="text-sm font-medium text-warm-muted uppercase tracking-wide">
              Sessions
            </h2>
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                category={categoryMap[session.categoryId]}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="pt-16 text-center space-y-4">
          <div className="text-5xl">🧶</div>
          <div>
            <h2 className="font-serif text-xl text-warm-text">
              Fresh day, fresh thread
            </h2>
            <p className="text-warm-muted mt-1 text-sm max-w-xs mx-auto">
              Start your first session to begin tracing today's path through the
              labyrinth.
            </p>
          </div>
        </div>
      )}

      <div className="fixed bottom-20 left-0 right-0 flex justify-center z-10">
        <button
          onClick={() => navigate({ type: 'session' })}
          className="btn-primary shadow-lg shadow-warm-text/10 flex items-center gap-2 text-base"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polygon
              points="10 8 16 12 10 16 10 8"
              fill="currentColor"
              stroke="none"
            />
          </svg>
          Start Session
        </button>
      </div>
    </div>
  )
}
