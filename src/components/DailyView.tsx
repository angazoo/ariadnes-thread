import { useState, useEffect, useCallback, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, saveDayPlan } from '../lib/db'
import { useNavigation } from '../lib/store'
import {
  getTodayDate,
  getCategoryColors,
  isAdventureLogSurfaceEmpty,
} from '../lib/utils'
import BentoSummary from './BentoSummary'
import PyramidView from './PyramidView'
import SessionCard from './SessionCard'
import MapTileGrid from './MapTileGrid'
import VoiceTextArea from './VoiceTextArea'

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
  const adventureLog = useLiveQuery(() => db.adventureLogs.get(today), [today])

  const [intentionDraft, setIntentionDraft] = useState('')
  const [plannedIds, setPlannedIds] = useState<Set<string>>(new Set())
  const [mapMode, setMapMode] = useState<'grid' | 'pyramid'>('grid')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const planCreatedAtRef = useRef<number>(Date.now())

  const prevTodayRef = useRef(today)
  useEffect(() => {
    if (prevTodayRef.current !== today) {
      prevTodayRef.current = today
      setIntentionDraft('')
      setPlannedIds(new Set())
    }
  }, [today])

  useEffect(() => {
    if (dayPlan && dayPlan.date === today) {
      setIntentionDraft(dayPlan.intention)
      setPlannedIds(new Set(dayPlan.categoryIds))
      planCreatedAtRef.current = dayPlan.createdAt
    }
  }, [today, dayPlan])

  const persistPlan = useCallback(async () => {
    await saveDayPlan({
      date: today,
      intention: intentionDraft,
      categoryIds: [...plannedIds],
      createdAt: planCreatedAtRef.current,
    })
  }, [today, intentionDraft, plannedIds])

  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      void persistPlan()
    }, 650)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [intentionDraft, plannedIds, persistPlan])

  const togglePlanned = useCallback((id: string) => {
    setPlannedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const startSession = useCallback(
    (categoryId: string) => {
      navigate({ type: 'session', categoryId })
    },
    [navigate]
  )

  if (!sessions || !categories) {
    return <div className="pt-8 text-center text-warm-muted">Loading…</div>
  }

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]))
  const hasSessions = sessions.length > 0

  return (
    <div className="space-y-5 pt-2 animate-fadeIn pb-28">
      {isAdventureLogSurfaceEmpty(adventureLog) && (
        <button
          type="button"
          onClick={() => navigate({ type: 'threshold' })}
          className="card w-full text-left border-dashed border-warm-muted/25 hover:border-warm-muted/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚪</span>
            <div>
              <p className="text-sm font-medium text-warm-text">
                Pause at the threshold
              </p>
              <p className="text-xs text-warm-muted mt-0.5">
                Quick weather check &amp; brain dump before you zoom in — or
                skip if you&apos;re already clear.
              </p>
            </div>
          </div>
        </button>
      )}

      <button
        type="button"
        onClick={() => navigate({ type: 'interstitial-journal' })}
        className="card w-full text-left border-stone-300/70 bg-[#F5F1EA] hover:border-stone-400/60 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">📝</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-warm-text">
              Interstitial Journal
            </p>
            <p className="text-xs text-warm-muted mt-0.5">
              Go straight into quick captures without choosing a task type.
            </p>
          </div>
          <span className="text-warm-light">→</span>
        </div>
      </button>

      <div>
        <p className="text-[10px] uppercase tracking-wide text-warm-muted font-medium mb-2">
          Today&apos;s intention
        </p>
        <VoiceTextArea
          value={intentionDraft}
          onChange={setIntentionDraft}
          placeholder="What would make today wholesome…"
          className="w-full bg-warm-white rounded-2xl p-4 pr-14 text-warm-text
                     placeholder:text-warm-light resize-none focus:outline-none
                     focus:ring-2 focus:ring-warm-border min-h-[72px] text-base"
        />
        <p className="text-[11px] text-warm-light mt-1.5">
          Tap the circle on a tile to mark 2–3 modes you intend to touch.
        </p>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="text-xs text-warm-muted block">The Map</span>
          <span className="text-[10px] text-warm-light leading-tight block mt-0.5 max-w-[200px]">
            Tiles: drag <span className="font-mono">⋮⋮</span> to reorder · tap tile to work
          </span>
        </div>
        <div className="flex rounded-full bg-warm-white p-0.5 border border-warm-border">
          <button
            type="button"
            onClick={() => setMapMode('grid')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              mapMode === 'grid'
                ? 'bg-warm-text text-cream'
                : 'text-warm-muted'
            }`}
          >
            Tiles
          </button>
          <button
            type="button"
            onClick={() => setMapMode('pyramid')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              mapMode === 'pyramid'
                ? 'bg-warm-text text-cream'
                : 'text-warm-muted'
            }`}
          >
            Pyramid
          </button>
        </div>
      </div>

      <MapTileGrid
        categories={categories}
        sessionsToday={sessions}
        plannedIds={plannedIds}
        onTogglePlanned={togglePlanned}
        onStartSession={startSession}
        mode={mapMode}
      />

      {plannedIds.size > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {[...plannedIds].map((id) => {
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

      {hasSessions && (
        <>
          <BentoSummary sessions={sessions} categoryMap={categoryMap} />
          <PyramidView sessions={sessions} categoryMap={categoryMap} />
        </>
      )}

      {!hasSessions && (
        <div className="text-center py-6">
          <div className="text-4xl mb-2">🧶</div>
          <p className="text-sm text-warm-muted max-w-xs mx-auto">
            Tap a tile to enter the Territory — timer, journal, and parking
            lot.
          </p>
        </div>
      )}

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

      {hasSessions && !eveningReflection && (
        <button
          type="button"
          onClick={() => navigate({ type: 'evening' })}
          className="card w-full text-left hover:border-warm-muted/30 group"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🪞</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-warm-text">
                Honest mirror
              </p>
              <p className="text-xs text-warm-muted">
                End-of-day reflection and notes pile.
              </p>
            </div>
            <span className="text-warm-light">→</span>
          </div>
        </button>
      )}

      {eveningReflection && (
        <div className="card text-center py-3">
          <span className="text-lg">🪞</span>
          <p className="text-xs text-warm-muted mt-1">Day reviewed.</p>
        </div>
      )}
    </div>
  )
}
