import { useState, useEffect, useCallback, useRef } from 'react'
import type { Category, QuickCapture } from '../lib/types'
import {
  formatTime,
  formatTimeOfDay,
  getCategoryColors,
  quickCaptureIcon,
  quickCaptureLabel,
  type QuickCaptureKind,
} from '../lib/utils'
import QuickCaptureColumn from './QuickCaptureColumn'

interface Props {
  durationSeconds: number
  category: Category
  intention: string
  journalEntries: QuickCapture[]
  parkingEntries: QuickCapture[]
  onJournalAdd: (text: string, kind?: QuickCaptureKind) => void
  onParkingAdd: (text: string) => void
  onJournalUpdate: (
    id: string,
    patch: Partial<Pick<QuickCapture, 'text' | 'kind' | 'bucket'>>
  ) => void
  onJournalMoveToParking: (id: string) => void
  onParkingMoveToJournal: (
    id: string,
    kind?: QuickCaptureKind,
    bucket?: string
  ) => void
  onComplete: (actualSeconds: number) => void
  onCancel: () => void
}

export default function WorkTimerPanel({
  durationSeconds,
  category,
  intention,
  journalEntries,
  parkingEntries,
  onJournalAdd,
  onParkingAdd,
  onJournalUpdate,
  onJournalMoveToParking,
  onParkingMoveToJournal,
  onComplete,
  onCancel,
}: Props) {
  const colors = getCategoryColors(category.colorKey)

  const startTimestampRef = useRef(Date.now())
  const accumulatedRef = useRef(0)
  const onCompleteRef = useRef(onComplete)
  const completedRef = useRef(false)

  const [status, setStatus] = useState<'running' | 'paused'>('running')
  const [elapsed, setElapsed] = useState(0)
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [threadNudge, setThreadNudge] = useState(false)
  const threadNudgeMinutesRef = useRef<Set<number>>(new Set())

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    if (status !== 'running') return
    const interval = setInterval(() => {
      const now = Date.now()
      const currentElapsed =
        accumulatedRef.current + (now - startTimestampRef.current) / 1000
      setElapsed(currentElapsed)
      const minute = Math.floor(currentElapsed / 60)
      if (
        [20, 40].includes(minute) &&
        !threadNudgeMinutesRef.current.has(minute)
      ) {
        threadNudgeMinutesRef.current.add(minute)
        setThreadNudge(true)
      }
      if (currentElapsed >= durationSeconds && !completedRef.current) {
        completedRef.current = true
        clearInterval(interval)
        onCompleteRef.current(durationSeconds)
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification("Ariadne's Thread", {
            body: 'Session complete.',
          })
        }
      }
    }, 250)
    return () => clearInterval(interval)
  }, [status, durationSeconds])

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const togglePause = useCallback(() => {
    if (status === 'running') {
      accumulatedRef.current +=
        (Date.now() - startTimestampRef.current) / 1000
      setStatus('paused')
    } else {
      startTimestampRef.current = Date.now()
      setStatus('running')
    }
  }, [status])

  const endEarly = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    const actualElapsed =
      status === 'running'
        ? accumulatedRef.current +
          (Date.now() - startTimestampRef.current) / 1000
        : accumulatedRef.current
    onCompleteRef.current(actualElapsed)
  }, [status])

  const handleCancel = useCallback(() => {
    completedRef.current = true
    onCancel()
  }, [onCancel])

  const remaining = Math.max(0, durationSeconds - elapsed)
  const progress = Math.min(1, elapsed / durationSeconds)
  const radius = 72
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)

  const [customBuckets, setCustomBuckets] = useState<string[]>([])

  const wrapJournal = (text: string, kind?: QuickCaptureKind) => onJournalAdd(text, kind)

  const inferBucket = (e: QuickCapture): string => {
    if (e.bucket?.trim()) return e.bucket
    if (e.kind === 'feeling' || e.kind === 'nervous-system') return 'Emotions'
    if (e.kind === 'idea') return 'Ideas'
    return 'Thoughts'
  }

  const allBuckets = ['Emotions', 'Thoughts', 'Ideas', 'Parking lot', ...customBuckets]
  const board: Record<string, QuickCapture[]> = Object.fromEntries(
    allBuckets.map((b) => [b, [] as QuickCapture[]])
  )
  for (const e of journalEntries) board[inferBucket(e)]?.push(e)
  for (const p of parkingEntries) board['Parking lot'].push(p)

  const kindForBucket = (bucket: string): QuickCaptureKind => {
    if (bucket === 'Emotions') return 'feeling'
    if (bucket === 'Ideas') return 'idea'
    return 'thought'
  }

  const handleDrop = (bucket: string, raw: string) => {
    const [source, id] = raw.split(':')
    if (!id) return
    if (source === 'j') {
      if (bucket === 'Parking lot') {
        onJournalMoveToParking(id)
      } else {
        onJournalUpdate(id, {
          kind: kindForBucket(bucket),
          bucket: ['Emotions', 'Thoughts', 'Ideas'].includes(bucket)
            ? undefined
            : bucket,
        })
      }
    }
    if (source === 'p' && bucket !== 'Parking lot') {
      onParkingMoveToJournal(
        id,
        kindForBucket(bucket),
        ['Emotions', 'Thoughts', 'Ideas'].includes(bucket) ? undefined : bucket
      )
    }
  }

  return (
    <div className="min-h-screen bg-cream px-3 py-4 max-w-3xl mx-auto animate-fadeIn flex flex-col">
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium self-center mb-3"
        style={{ backgroundColor: colors.bg, color: colors.text }}
      >
        {category.emoji} {category.name}
      </div>

      {threadNudge && intention.trim() && (
        <div
          role="status"
          className="mb-3 rounded-2xl border border-warm-border bg-warm-white/90 px-3 py-2.5 flex gap-2 items-start shadow-sm"
        >
          <span className="text-lg shrink-0" aria-hidden>
            🧵
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-warm-text">
              Still walking this thread?
            </p>
            <p className="text-xs text-warm-muted mt-1 italic line-clamp-3">
              &ldquo;{intention}&rdquo;
            </p>
          </div>
          <button
            type="button"
            onClick={() => setThreadNudge(false)}
            className="text-xs font-medium text-warm-muted hover:text-warm-text shrink-0 px-2 py-1 rounded-lg hover:bg-warm-border/30"
          >
            OK
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-start gap-3 flex-1 min-h-0">
        <div className="flex flex-col items-center shrink-0 lg:w-[200px]">
          <div className="relative">
            <svg width="180" height="180" className="-rotate-90">
              <circle
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke="#E8E4E0"
                strokeWidth="3"
              />
              <circle
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke={colors.accent}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-light text-warm-text tabular-nums">
                {formatTime(remaining)}
              </span>
              {status === 'paused' && (
                <span className="text-[10px] text-warm-muted animate-pulse">
                  paused
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3">
            <button
              type="button"
              onClick={togglePause}
              className="w-11 h-11 rounded-full bg-warm-white flex items-center justify-center
                         hover:bg-warm-border active:scale-95"
              aria-label={status === 'running' ? 'Pause' : 'Resume'}
            >
              {status === 'running' ? (
                <span className="flex gap-0.5">
                  <span className="w-1 h-3 bg-warm-text rounded-sm" />
                  <span className="w-1 h-3 bg-warm-text rounded-sm" />
                </span>
              ) : (
                <span className="w-0 h-0 border-l-[8px] border-l-warm-text border-y-[6px] border-y-transparent ml-0.5" />
              )}
            </button>
            {!showEndConfirm ? (
              <button
                type="button"
                onClick={() => setShowEndConfirm(true)}
                className="text-xs text-warm-light"
              >
                End early
              </button>
            ) : (
              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  onClick={endEarly}
                  className="text-xs px-2 py-1 rounded-lg bg-warm-white"
                >
                  End
                </button>
                <button
                  type="button"
                  onClick={() => setShowEndConfirm(false)}
                  className="text-xs text-warm-light"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0 min-w-0 flex flex-col items-center">
          <QuickCaptureColumn
            title="Interstitial journal"
            entries={journalEntries}
            onAdd={wrapJournal}
            onAddParking={onParkingAdd}
            variant="journal"
          />
          <div className="w-full max-w-3xl mt-2 flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-wide text-[#8C8278]">
              Drag entries between buckets
            </p>
            <button
              type="button"
              className="text-xs text-warm-muted hover:text-warm-text"
              onClick={() => {
                const name = window.prompt('Name this new bucket')
                if (!name?.trim()) return
                if (allBuckets.includes(name.trim())) return
                setCustomBuckets((list) => [...list, name.trim()])
              }}
            >
              + Add bucket
            </button>
          </div>
          <div className="w-full max-w-3xl mt-1 grid grid-cols-2 lg:grid-cols-4 gap-2">
            {allBuckets.map((bucket) => (
              <section
                key={bucket}
                className="rounded-2xl border border-stone-200 bg-[#F5F2EC] p-2.5"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(bucket, e.dataTransfer.getData('text/plain'))}
              >
                <p className="text-[10px] uppercase tracking-wide text-[#8C8278] mb-1.5">
                  {bucket}
                </p>
                <ul className="space-y-1.5 text-xs text-[#4B453F] max-h-32 overflow-y-auto pr-1">
                  {board[bucket].length === 0 && (
                    <li className="text-[#9A9188]">Nothing yet</li>
                  )}
                  {board[bucket].map((e) => {
                    const parking = bucket === 'Parking lot'
                    return (
                      <li
                        key={e.id}
                        draggable
                        onDragStart={(ev) =>
                          ev.dataTransfer.setData(
                            'text/plain',
                            `${parking ? 'p' : 'j'}:${e.id}`
                          )
                        }
                        className="leading-snug rounded-md px-1 py-0.5 hover:bg-white/60"
                      >
                        <span className="text-[10px] text-[#9A9188] tabular-nums mr-1.5">
                          {formatTimeOfDay(e.at)}
                        </span>
                        <span aria-hidden className="mr-1">
                          {parking ? '🛑' : quickCaptureIcon(e.kind)}
                        </span>
                        {e.text.trim() || (parking ? 'parking lot' : quickCaptureLabel(e.kind))}
                        {!parking && (
                          <span className="ml-1 inline-flex gap-0.5 align-middle">
                            {(
                              [
                                ['feeling', '❤️'],
                                ['thought', '🧠'],
                                ['nervous-system', '🦎'],
                                ['idea', '💡'],
                              ] as const
                            ).map(([k, icon]) => (
                              <button
                                key={k}
                                type="button"
                                className="text-[10px]"
                                onClick={() => onJournalUpdate(e.id, { kind: k })}
                                title={`Set ${k}`}
                              >
                                {icon}
                              </button>
                            ))}
                          </span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </div>

      {intention && (
        <p className="text-xs text-warm-muted text-center mt-3 italic px-2">
          &ldquo;{intention}&rdquo;
        </p>
      )}

      <button
        type="button"
        onClick={handleCancel}
        className="mt-4 text-xs text-warm-light/70 self-center"
      >
        Abandon session
      </button>
    </div>
  )
}
