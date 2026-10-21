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
    <div className="space-y-6 pt-1 animate-fadeIn pb-28">
      <div className="grid grid-cols-2 gap-2">
        {isAdventureLogSurfaceEmpty(adventureLog) ? (
          <button
            type="button"
            onClick={() => navigate({ type: 'threshold' })}
            className="surface-quiet text-left p-3.5 col-span-2 hover:bg-warm-white/80 transition-all duration-200 group"
          >
            <p className="section-label mb-1.5">Begin</p>
            <p className="text-sm font-medium text-ink">Pause at the threshold</p>
            <p className="text-xs text-warm-muted mt-1 leading-relaxed">
              Weather check &amp; brain dump — or skip if you&apos;re already clear.
            </p>
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => navigate({ type: 'interstitial-journal' })}
          className={`surface-quiet text-left p-3.5 hover:bg-warm-white/80 transition-all duration-200 ${
            isAdventureLogSurfaceEmpty(adventureLog) ? '' : 'col-span-2'
          }`}
        >
          <p className="section-label mb-1.5">Capture</p>
          <p className="text-sm font-medium text-ink">Interstitial Journal</p>
          <p className="text-xs text-warm-muted mt-1">Quick notes, no task type.</p>
        </button>
      </div>

      <div>
        <p className="section-label mb-2">Today&apos;s intention</p>
        <VoiceTextArea
          value={intentionDraft}
          onChange={setIntentionDraft}
          placeholder="What would make today wholesome…"
          className="w-full bg-warm-white/80 rounded-2xl p-4 pr-14 text-warm-text
                     placeholder:text-warm-light resize-none focus:outline-none
                     focus:ring-2 focus:ring-thread/20 border border-warm-border/70
                     min-h-[76px] text-[15px] leading-relaxed"
        />
        <p className="text-[11px] text-warm-light mt-2">
          Mark 2–3 modes on the map you intend to touch.
        </p>
      </div>

      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="font-serif text-xl text-ink tracking-tight">The Map</p>
          <p className="text-[11px] text-warm-light mt-0.5">
            Drag to reorder · tap a tile to work
          </p>
        </div>
        <div className="flex rounded-full bg-warm-white/80 p-0.5 border border-warm-border/80">
          <button
            type="button"
            onClick={() => setMapMode('grid')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              mapMode === 'grid'
                ? 'bg-ink text-cream shadow-sm'
                : 'text-warm-muted'
            }`}
          >
            Tiles
          </button>
          <button
            type="button"
            onClick={() => setMapMode('pyramid')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              mapMode === 'pyramid'
                ? 'bg-ink text-cream shadow-sm'
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
                className="text-[11px] px-2.5 py-1 rounded-full font-medium border border-black/5"
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
        <div className="text-center py-8">
          <div className="mx-auto mb-3 w-10 h-10 rounded-full border border-thread/25 flex items-center justify-center">
            <span className="thread-mark animate-thread-pulse" />
          </div>
          <p className="text-sm text-warm-muted max-w-xs mx-auto leading-relaxed">
            Tap a tile to enter the Territory — timer, journal, and parking lot.
          </p>
        </div>
      )}

      {hasSessions && (
        <div className="space-y-3">
          <h2 className="section-label">Sessions</h2>
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
          className="card w-full text-left group"
        >
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-thread/10 text-thread flex items-center justify-center text-sm font-serif">
              ∿
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium text-ink">Honest mirror</p>
              <p className="text-xs text-warm-muted">
                End-of-day reflection and notes pile.
              </p>
            </div>
            <span className="text-warm-light group-hover:text-thread transition-colors">
              →
            </span>
          </div>
        </button>
      )}

      {eveningReflection && (
        <div className="surface-quiet text-center py-3.5">
          <p className="text-xs text-warm-muted">Day reviewed.</p>
        </div>
      )}
    </div>
  )
}
