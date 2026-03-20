import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import { useNavigation } from '../lib/store'
import { getTodayDate, getCategoryColors } from '../lib/utils'
import BentoSummary from './BentoSummary'
import PyramidView from './PyramidView'
import SessionCard from './SessionCard'

export default function DailyView() {
  const { navigate } = useNavigation()
  const today = getTodayDate()

  const sessions = useLiveQuery(
    () => db.sessions.where('date').equals(today).sortBy('startedAt'),
    [today]
  )
  const categories = useLiveQuery(() => db.categories.toArray())
  const dayPlan = useLiveQuery(() => db.dayPlans.get(today), [today])
  const eveningReflection = useLiveQuery(
    () => db.eveningReflections.get(today),
    [today]
  )

  if (!sessions || !categories) {
    return <div className="pt-8 text-center text-warm-muted">Loading…</div>
  }

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]))
  const hasSessions = sessions.length > 0

  return (
    <div className="space-y-5 pt-2 animate-fadeIn">
      {/* Morning section */}
      {!dayPlan ? (
        <button
          onClick={() => navigate({ type: 'morning' })}
          className="card w-full text-left hover:border-warm-muted/30 group"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">☀️</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-warm-text">
                Set the table
              </p>
              <p className="text-xs text-warm-muted">
                What would make today wholesome?
              </p>
            </div>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-warm-light group-hover:text-warm-muted transition-colors"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </div>
        </button>
      ) : (
        <div className="card space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">☀️</span>
            <span className="text-xs text-warm-muted uppercase tracking-wide font-medium">
              Today's intention
            </span>
          </div>
          {dayPlan.intention && (
            <p className="text-sm text-warm-text italic">
              &ldquo;{dayPlan.intention}&rdquo;
            </p>
          )}
          {dayPlan.categoryIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {dayPlan.categoryIds.map((id) => {
                const cat = categoryMap[id]
                if (!cat) return null
                const colors = getCategoryColors(cat.colorKey)
                return (
                  <span
                    key={id}
                    className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: colors.bg, color: colors.text }}
                  >
                    {cat.emoji} {cat.name}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Bento + Pyramid */}
      {hasSessions && (
        <>
          <BentoSummary sessions={sessions} categoryMap={categoryMap} />
          <PyramidView sessions={sessions} categoryMap={categoryMap} />
        </>
      )}

      {/* Empty state */}
      {!hasSessions && (
        <div className="pt-8 text-center space-y-4">
          <div className="text-5xl">🧶</div>
          <div>
            <h2 className="font-serif text-xl text-warm-text">
              {dayPlan ? 'Table is set' : 'Fresh day, fresh thread'}
            </h2>
            <p className="text-warm-muted mt-1 text-sm max-w-xs mx-auto">
              {dayPlan
                ? "Start your first session to begin filling today's bento."
                : "Start your first session to begin tracing today's path through the labyrinth."}
            </p>
          </div>
        </div>
      )}

      {/* Sessions list */}
      {hasSessions && (
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
      )}

      {/* Evening review prompt */}
      {hasSessions && !eveningReflection && (
        <button
          onClick={() => navigate({ type: 'evening' })}
          className="card w-full text-left hover:border-warm-muted/30 group"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🪞</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-warm-text">
                Evening review
              </p>
              <p className="text-xs text-warm-muted">
                See today's balance in the honest mirror.
              </p>
            </div>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-warm-light group-hover:text-warm-muted transition-colors"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </div>
        </button>
      )}

      {/* Evening done */}
      {eveningReflection && (
        <div className="card text-center">
          <span className="text-lg">🪞</span>
          <p className="text-xs text-warm-muted mt-1">
            Day reviewed. Rest well.
          </p>
        </div>
      )}

      {/* Start Session FAB */}
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
