import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import type { Session, Category, AdventureLog } from '../lib/types'
import {
  formatDate,
  formatDuration,
  formatTimeOfDay,
  getCategoryColors,
  quickCaptureIcon,
  quickCaptureLabel,
  getTodayDate,
  weekRangeContaining,
  shiftWeek,
  monthRangeFor,
  shiftMonth,
  isYmdInRange,
} from '../lib/utils'
import {
  downloadJsonExport,
  downloadMarkdownExport,
  EXPORT_VERSION,
  type AriadneExportPayload,
} from '../lib/archiveExport'

type ArchiveTab = 'timeline' | 'week' | 'month'

function collectSortedDates(
  sessions: Session[],
  logs: AdventureLog[],
  dayDates: string[],
  eveningDates: string[]
): string[] {
  const set = new Set<string>()
  for (const s of sessions) set.add(s.date)
  for (const l of logs) set.add(l.date)
  for (const d of dayDates) set.add(d)
  for (const d of eveningDates) set.add(d)
  return [...set].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))
}

function sessionsInRange(
  sessions: Session[],
  start: string,
  end: string
): Session[] {
  return sessions.filter((s) => isYmdInRange(s.date, start, end))
}

function computePeriodStats(
  sessions: Session[],
  categoryMap: Record<string, Category>
) {
  let work = 0
  let digest = 0
  const byCat: Record<string, number> = {}
  const days = new Set<string>()

  for (const s of sessions) {
    work += s.workDurationActual
    if (!s.digestSkipped) digest += s.digestDurationActual
    days.add(s.date)
    const dur = s.workDurationActual + s.digestDurationActual
    byCat[s.categoryId] = (byCat[s.categoryId] ?? 0) + dur
  }

  const totalDur = work + digest
  const catRows = Object.entries(byCat)
    .map(([id, sec]) => ({
      id,
      sec,
      pct: totalDur > 0 ? Math.round((sec / totalDur) * 100) : 0,
      cat: categoryMap[id],
    }))
    .sort((a, b) => b.sec - a.sec)

  return {
    sessionCount: sessions.length,
    work,
    digest,
    activeDays: days.size,
    catRows,
    totalDur,
  }
}

function SessionNotesBlock({
  session,
  category,
}: {
  session: Session
  category?: Category
}) {
  const colors = getCategoryColors(category?.colorKey ?? 'admin')
  const refl = session.reflections ?? {}
  const journal = [...(session.journalEntries ?? [])].sort(
    (a, b) => a.at - b.at
  )
  const parking = [...(session.parkingEntries ?? [])].sort(
    (a, b) => a.at - b.at
  )
  const hasNotes =
    Object.values(refl).some((v) => v?.trim()) ||
    journal.length > 0 ||
    parking.length > 0 ||
    session.unpacking ||
    session.circleBefore ||
    session.circleAfter

  if (!hasNotes) return null

  return (
    <div
      className="mt-3 pl-3 border-l-2 space-y-2 text-sm"
      style={{ borderColor: colors.accent }}
    >
      {session.unpacking && (
        <div className="text-warm-muted space-y-1 text-xs">
          {session.unpacking.involves?.trim() && (
            <p>
              <span className="text-warm-light">Involves · </span>
              {session.unpacking.involves}
            </p>
          )}
          {session.unpacking.need?.trim() && (
            <p>
              <span className="text-warm-light">Need · </span>
              {session.unpacking.need}
            </p>
          )}
          {session.unpacking.hard?.trim() && (
            <p>
              <span className="text-warm-light">Hard · </span>
              {session.unpacking.hard}
            </p>
          )}
          {session.unpacking.feel?.trim() && (
            <p>
              <span className="text-warm-light">Feel · </span>
              {session.unpacking.feel}
            </p>
          )}
        </div>
      )}
      {(session.circleBefore || session.circleAfter) && (
        <p className="text-xs text-warm-light">
          {session.circleBefore && (
            <>
              Before · scope {session.circleBefore.scope}% · atmosphere{' '}
              {session.circleBefore.atmosphere}%
            </>
          )}
          {session.circleBefore && session.circleAfter && ' → '}
          {session.circleAfter && (
            <>
              After · scope {session.circleAfter.scope}% · atmosphere{' '}
              {session.circleAfter.atmosphere}%
            </>
          )}
        </p>
      )}
      {Object.entries(refl).map(
        ([k, v]) =>
          v?.trim() && (
            <div key={k}>
              <p className="text-[10px] uppercase tracking-wide text-warm-light">
                {k === '_alignment' ? 'Alignment' : k}
              </p>
              <p className="text-warm-text whitespace-pre-wrap">{v}</p>
            </div>
          )
      )}
      {journal.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wide text-warm-light mb-1">
            Journal
          </p>
          <ul className="space-y-1 text-warm-muted">
            {journal.map((j) => (
              <li key={j.id}>
                · {quickCaptureIcon(j.kind)} {j.text.trim() || quickCaptureLabel(j.kind)}
              </li>
            ))}
          </ul>
        </div>
      )}
      {parking.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wide text-warm-light mb-1">
            Parking lot
          </p>
          <ul className="space-y-1 text-warm-muted">
            {parking.map((p) => (
              <li key={p.id}>· 🛑 {p.text.trim() || 'parking lot'}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

const ADVENTURE_SNIPPETS: { key: keyof AdventureLog; label: string }[] = [
  { key: 'howAreYou', label: 'How are you' },
  { key: 'onMind', label: 'On mind' },
  { key: 'intentionToday', label: 'Intention' },
  { key: 'eveningClosing', label: 'Evening' },
]

export default function ArchiveView() {
  const [tab, setTab] = useState<ArchiveTab>('timeline')
  const [weekAnchor, setWeekAnchor] = useState(() => getTodayDate())
  const [monthAnchor, setMonthAnchor] = useState(() => getTodayDate())

  const sessions = useLiveQuery(() =>
    db.sessions.orderBy('startedAt').reverse().toArray()
  )
  const categories = useLiveQuery(() => db.categories.toArray())
  const adventureLogs = useLiveQuery(() => db.adventureLogs.toArray())
  const dayPlans = useLiveQuery(() => db.dayPlans.toArray())
  const eveningReflections = useLiveQuery(() =>
    db.eveningReflections.toArray()
  )

  const categoryMap = useMemo(() => {
    if (!categories) return {}
    return Object.fromEntries(categories.map((c) => [c.id, c]))
  }, [categories])

  const sortedDates = useMemo(() => {
    if (
      !sessions ||
      !adventureLogs ||
      !dayPlans ||
      !eveningReflections
    )
      return []
    return collectSortedDates(
      sessions,
      adventureLogs,
      dayPlans.map((p) => p.date),
      eveningReflections.map((e) => e.date)
    )
  }, [sessions, adventureLogs, dayPlans, eveningReflections])

  const exportPayload = useMemo((): AriadneExportPayload | null => {
    if (
      !sessions ||
      !categories ||
      !adventureLogs ||
      !dayPlans ||
      !eveningReflections
    )
      return null
    return {
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      categories,
      sessions,
      adventureLogs,
      dayPlans,
      eveningReflections,
    }
  }, [sessions, categories, adventureLogs, dayPlans, eveningReflections])

  const weekRange = useMemo(() => weekRangeContaining(weekAnchor), [weekAnchor])
  const monthRange = useMemo(() => monthRangeFor(monthAnchor), [monthAnchor])

  const weekSessions = useMemo(() => {
    if (!sessions) return []
    return sessionsInRange(sessions, weekRange.start, weekRange.end)
  }, [sessions, weekRange.start, weekRange.end])

  const monthSessions = useMemo(() => {
    if (!sessions) return []
    return sessionsInRange(sessions, monthRange.start, monthRange.end)
  }, [sessions, monthRange.start, monthRange.end])

  const weekStats = useMemo(
    () => computePeriodStats(weekSessions, categoryMap),
    [weekSessions, categoryMap]
  )
  const monthStats = useMemo(
    () => computePeriodStats(monthSessions, categoryMap),
    [monthSessions, categoryMap]
  )

  const handleDownloadJson = () => {
    if (!exportPayload) return
    downloadJsonExport({
      ...exportPayload,
      exportedAt: new Date().toISOString(),
    })
  }

  const handleDownloadMd = () => {
    if (!exportPayload) return
    const payload = {
      ...exportPayload,
      exportedAt: new Date().toISOString(),
    }
    downloadMarkdownExport(payload, sortedDates)
  }

  if (
    !sessions ||
    !categories ||
    !adventureLogs ||
    !dayPlans ||
    !eveningReflections
  ) {
    return <div className="pt-8 text-center text-warm-muted">Loading…</div>
  }

  const logByDate = Object.fromEntries(adventureLogs.map((l) => [l.date, l]))
  const planByDate = Object.fromEntries(dayPlans.map((p) => [p.date, p]))
  const eveningByDate = Object.fromEntries(
    eveningReflections.map((e) => [e.date, e])
  )

  const sessionsByDate = new Map<string, Session[]>()
  for (const s of sessions) {
    const list = sessionsByDate.get(s.date) ?? []
    list.push(s)
    sessionsByDate.set(s.date, list)
  }
  for (const list of sessionsByDate.values()) {
    list.sort((a, b) => a.startedAt - b.startedAt)
  }

  const empty =
    sessions.length === 0 &&
    adventureLogs.length === 0 &&
    dayPlans.length === 0 &&
    eveningReflections.length === 0

  return (
    <div className="space-y-5 pt-2 pb-28 animate-fadeIn">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleDownloadJson}
          disabled={empty}
          className="btn-ghost text-xs py-2 px-3 border border-warm-border rounded-xl disabled:opacity-40"
        >
          Download JSON
        </button>
        <button
          type="button"
          onClick={handleDownloadMd}
          disabled={empty}
          className="btn-ghost text-xs py-2 px-3 border border-warm-border rounded-xl disabled:opacity-40"
        >
          Download Markdown
        </button>
      </div>
      <p className="text-xs text-warm-light leading-relaxed -mt-2">
        JSON is a full backup (sessions, threshold logs, plans, evening notes).
        Markdown is a readable journal for you or another tool.
      </p>

      <div className="flex rounded-full bg-warm-white p-0.5 border border-warm-border">
        {(
          [
            ['timeline', 'Timeline'],
            ['week', 'Week'],
            ['month', 'Month'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-colors ${
              tab === id ? 'bg-warm-text text-cream' : 'text-warm-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {empty && (
        <div className="card text-center py-8">
          <p className="text-2xl mb-2">📜</p>
          <p className="text-sm text-warm-muted">
            Nothing archived yet. Sessions, threshold entries, and evening
            notes will show up here.
          </p>
        </div>
      )}

      {tab === 'timeline' && !empty && (
        <div className="space-y-8">
          {sortedDates.map((date) => {
            const daySessions = sessionsByDate.get(date) ?? []
            const log = logByDate[date]
            const plan = planByDate[date]
            const eve = eveningByDate[date]
            const hasDay =
              daySessions.length > 0 || log || plan || eve
            if (!hasDay) return null

            const weather = log?.weatherMood as string | undefined
            const metaBits = [
              weather && `Weather: ${weather}`,
              log?.energyArrow && `Energy: ${log.energyArrow}`,
              log?.lifePhase && `Phase: ${log.lifePhase}`,
            ].filter(Boolean)

            return (
              <section key={date} className="space-y-3">
                <h2 className="font-serif text-lg text-warm-text border-b border-warm-border pb-2">
                  {formatDate(date)}
                  <span className="text-xs font-sans text-warm-light ml-2 font-normal">
                    {date}
                  </span>
                </h2>

                {plan && (plan.intention?.trim() || plan.categoryIds?.length) && (
                  <div className="card space-y-2">
                    <p className="text-[10px] uppercase tracking-wide text-warm-muted">
                      Day intention
                    </p>
                    {plan.intention?.trim() && (
                      <p className="text-sm text-warm-text whitespace-pre-wrap">
                        {plan.intention}
                      </p>
                    )}
                    {(plan.categoryIds?.length ?? 0) > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {plan.categoryIds!.map((id) => {
                          const c = categoryMap[id]
                          if (!c) return null
                          const col = getCategoryColors(c.colorKey)
                          return (
                            <span
                              key={id}
                              className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                              style={{
                                backgroundColor: col.bg,
                                color: col.text,
                              }}
                            >
                              {c.emoji} {c.name}
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {log && (
                  <div className="card space-y-2">
                    <p className="text-[10px] uppercase tracking-wide text-warm-muted">
                      Threshold / adventure log
                    </p>
                    {metaBits.length > 0 && (
                      <p className="text-xs text-warm-light">{metaBits.join(' · ')}</p>
                    )}
                    <div className="space-y-2 text-sm text-warm-muted">
                      {ADVENTURE_SNIPPETS.map(({ key, label }) => {
                        const v = log[key]
                        if (typeof v !== 'string' || !v.trim()) return null
                        return (
                          <div key={key}>
                            <span className="text-warm-light text-xs">{label}</span>
                            <p className="text-warm-text whitespace-pre-wrap">
                              {v}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                    {/* Longer threshold fields not in snippets */}
                    {(
                      [
                        ['whatsPulling', "What's pulling"],
                        ['carrying', 'Carrying'],
                        ['shiftedSinceYesterday', 'Shifted since yesterday'],
                        ['oneThingWorthwhile', 'One thing worthwhile'],
                        ['avoidingFacing', 'Avoiding / facing'],
                        ['projectsSituate', 'Projects'],
                        ['creativeVsReactive', 'Creative vs reactive'],
                        ['needRightNow', 'Need right now'],
                        ['voiceCritic', 'Critic voice'],
                        ['voiceDreamer', 'Dreamer voice'],
                        ['voiceScared', 'Scared voice'],
                        ['voiceExhausted', 'Exhausted voice'],
                      ] as const
                    ).map(([key, label]) => {
                      const v = log[key as keyof AdventureLog]
                      if (typeof v !== 'string' || !v.trim()) return null
                      if (ADVENTURE_SNIPPETS.some((s) => s.key === key))
                        return null
                      return (
                        <div key={key} className="text-sm">
                          <span className="text-warm-light text-xs">{label}</span>
                          <p className="text-warm-text whitespace-pre-wrap">{v}</p>
                        </div>
                      )
                    })}
                  </div>
                )}

                {daySessions.map((session) => {
                  const c = categoryMap[session.categoryId]
                  const colors = getCategoryColors(c?.colorKey ?? 'admin')
                  const total =
                    session.workDurationActual + session.digestDurationActual
                  return (
                    <div
                      key={session.id ?? `${session.date}-${session.startedAt}`}
                      className="card border-l-[3px]"
                      style={{ borderLeftColor: colors.accent }}
                    >
                      <div className="flex gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                          style={{ backgroundColor: colors.bg }}
                        >
                          {c?.emoji ?? '📌'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className="font-medium text-sm"
                              style={{ color: colors.text }}
                            >
                              {c?.name ?? 'Session'}
                            </span>
                            <span className="text-xs text-warm-muted shrink-0">
                              {formatTimeOfDay(session.startedAt)}
                            </span>
                          </div>
                          {session.intention?.trim() && (
                            <p className="text-sm text-warm-muted mt-0.5">
                              {session.intention}
                            </p>
                          )}
                          <p className="text-xs text-warm-light mt-1">
                            {formatDuration(total)}
                            {!session.digestSkipped &&
                              session.digestDurationActual > 0 && (
                                <>
                                  {' '}
                                  · digest{' '}
                                  {formatDuration(session.digestDurationActual)}
                                </>
                              )}
                            {session.digestSkipped && ' · digest skipped'}
                          </p>
                          <SessionNotesBlock session={session} category={c} />
                        </div>
                      </div>
                    </div>
                  )
                })}

                {eve && Object.keys(eve.reflections ?? {}).length > 0 && (
                  <div className="card space-y-2">
                    <p className="text-[10px] uppercase tracking-wide text-warm-muted">
                      Evening mirror
                    </p>
                    {Object.entries(eve.reflections).map(
                      ([k, v]) =>
                        v?.trim() && (
                          <div key={k}>
                            <p className="text-[10px] text-warm-light uppercase tracking-wide">
                              {k === '_alignment' ? 'Alignment' : k}
                            </p>
                            <p className="text-sm text-warm-text whitespace-pre-wrap">
                              {v}
                            </p>
                          </div>
                        )
                    )}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}

      {tab === 'week' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              className="btn-ghost text-sm px-2"
              onClick={() => setWeekAnchor((a) => shiftWeek(a, -1))}
            >
              ←
            </button>
            <p className="text-sm font-medium text-warm-text text-center flex-1">
              {weekRange.shortLabel}
            </p>
            <button
              type="button"
              className="btn-ghost text-sm px-2"
              onClick={() => setWeekAnchor((a) => shiftWeek(a, 1))}
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="card py-3 text-center">
              <p className="text-2xl font-serif text-warm-text">
                {weekStats.sessionCount}
              </p>
              <p className="text-[10px] text-warm-muted uppercase tracking-wide">
                Sessions
              </p>
            </div>
            <div className="card py-3 text-center">
              <p className="text-2xl font-serif text-warm-text">
                {weekStats.activeDays}
              </p>
              <p className="text-[10px] text-warm-muted uppercase tracking-wide">
                Active days
              </p>
            </div>
            <div className="card py-3 text-center col-span-2">
              <p className="text-lg font-medium text-warm-text">
                {formatDuration(weekStats.work)} work
              </p>
              <p className="text-xs text-warm-light mt-0.5">
                + {formatDuration(weekStats.digest)} digest ·{' '}
                {formatDuration(weekStats.totalDur)} total focused time
              </p>
            </div>
          </div>

          {weekStats.catRows.length === 0 ? (
            <p className="text-sm text-warm-muted text-center py-4">
              No sessions this week.
            </p>
          ) : (
            <div className="card space-y-3">
              <p className="text-[10px] uppercase tracking-wide text-warm-muted">
                Time by territory
              </p>
              {weekStats.catRows.map(({ id, sec, pct, cat }) => {
                const col = getCategoryColors(cat?.colorKey ?? 'admin')
                return (
                  <div key={id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span>
                        {cat?.emoji ?? '📌'} {cat?.name ?? 'Unknown'}
                      </span>
                      <span className="text-warm-light">
                        {formatDuration(sec)} ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-warm-white overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: col.accent,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'month' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              className="btn-ghost text-sm px-2"
              onClick={() => setMonthAnchor((a) => shiftMonth(a, -1))}
            >
              ←
            </button>
            <p className="text-sm font-medium text-warm-text text-center flex-1">
              {monthRange.label}
            </p>
            <button
              type="button"
              className="btn-ghost text-sm px-2"
              onClick={() => setMonthAnchor((a) => shiftMonth(a, 1))}
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="card py-3 text-center">
              <p className="text-2xl font-serif text-warm-text">
                {monthStats.sessionCount}
              </p>
              <p className="text-[10px] text-warm-muted uppercase tracking-wide">
                Sessions
              </p>
            </div>
            <div className="card py-3 text-center">
              <p className="text-2xl font-serif text-warm-text">
                {monthStats.activeDays}
              </p>
              <p className="text-[10px] text-warm-muted uppercase tracking-wide">
                Active days
              </p>
            </div>
            <div className="card py-3 text-center col-span-2">
              <p className="text-lg font-medium text-warm-text">
                {formatDuration(monthStats.work)} work
              </p>
              <p className="text-xs text-warm-light mt-0.5">
                + {formatDuration(monthStats.digest)} digest ·{' '}
                {formatDuration(monthStats.totalDur)} total focused time
              </p>
            </div>
          </div>

          {monthStats.catRows.length === 0 ? (
            <p className="text-sm text-warm-muted text-center py-4">
              No sessions this month.
            </p>
          ) : (
            <div className="card space-y-3">
              <p className="text-[10px] uppercase tracking-wide text-warm-muted">
                Time by territory
              </p>
              {monthStats.catRows.map(({ id, sec, pct, cat }) => {
                const col = getCategoryColors(cat?.colorKey ?? 'admin')
                return (
                  <div key={id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span>
                        {cat?.emoji ?? '📌'} {cat?.name ?? 'Unknown'}
                      </span>
                      <span className="text-warm-light">
                        {formatDuration(sec)} ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-warm-white overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: col.accent,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
