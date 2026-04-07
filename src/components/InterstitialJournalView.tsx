import { useCallback, useEffect, useMemo, useState } from 'react'
import type { QuickCapture } from '../lib/types'
import { useNavigation } from '../lib/store'
import {
  formatTimeOfDay,
  getTodayDate,
  quickCaptureIcon,
  quickCaptureLabel,
  type QuickCaptureKind,
} from '../lib/utils'
import QuickCaptureColumn from './QuickCaptureColumn'

function captureId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const STORAGE_KEY_PREFIX = 'ariadne:interstitial-journal:'

export default function InterstitialJournalView() {
  const { navigate } = useNavigation()
  const date = getTodayDate()
  const storageKey = `${STORAGE_KEY_PREFIX}${date}`
  const [entries, setEntries] = useState<QuickCapture[]>([])
  const [parkingEntries, setParkingEntries] = useState<QuickCapture[]>([])
  const [customBuckets, setCustomBuckets] = useState<string[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return
      const parsed = JSON.parse(raw) as {
        entries?: QuickCapture[]
        parkingEntries?: QuickCapture[]
      }
      setEntries(parsed.entries ?? [])
      setParkingEntries(parsed.parkingEntries ?? [])
    } catch {
      setEntries([])
      setParkingEntries([])
    }
  }, [storageKey])

  useEffect(() => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        entries,
        parkingEntries,
      })
    )
  }, [entries, parkingEntries, storageKey])

  const addJournal = useCallback((text: string, kind?: QuickCaptureKind) => {
    setEntries((list) => [
      ...list,
      { id: captureId(), text, at: Date.now(), kind: kind ?? 'thought' },
    ])
  }, [])

  const addParking = useCallback((text: string) => {
    setParkingEntries((list) => [...list, { id: captureId(), text, at: Date.now() }])
  }, [])
  const updateJournalEntry = useCallback(
    (id: string, patch: Partial<Pick<QuickCapture, 'text' | 'kind' | 'bucket'>>) => {
      setEntries((list) => list.map((item) => (item.id === id ? { ...item, ...patch } : item)))
    },
    []
  )
  const moveJournalToParking = useCallback((id: string) => {
    setEntries((list) => {
      const item = list.find((x) => x.id === id)
      if (!item) return list
      setParkingEntries((parking) => [...parking, { id: item.id, text: item.text, at: item.at }])
      return list.filter((x) => x.id !== id)
    })
  }, [])
  const moveParkingToJournal = useCallback(
    (id: string, kind: QuickCaptureKind = 'thought', bucket?: string) => {
      setParkingEntries((list) => {
        const item = list.find((x) => x.id === id)
        if (!item) return list
        setEntries((journal) => [
          ...journal,
          { id: item.id, text: item.text, at: item.at, kind, bucket },
        ])
        return list.filter((x) => x.id !== id)
      })
    },
    []
  )

  const inferBucket = useCallback((e: QuickCapture): string => {
    if (e.bucket?.trim()) return e.bucket
    if (e.kind === 'feeling' || e.kind === 'nervous-system') return 'Emotions'
    if (e.kind === 'idea') return 'Ideas'
    return 'Thoughts'
  }, [])

  const allBuckets = useMemo(
    () => ['Emotions', 'Thoughts', 'Ideas', 'Parking lot', ...customBuckets],
    [customBuckets]
  )
  const board: Record<string, QuickCapture[]> = Object.fromEntries(
    allBuckets.map((b) => [b, [] as QuickCapture[]])
  )
  for (const e of entries) board[inferBucket(e)]?.push(e)
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
      if (bucket === 'Parking lot') moveJournalToParking(id)
      else {
        updateJournalEntry(id, {
          kind: kindForBucket(bucket),
          bucket: ['Emotions', 'Thoughts', 'Ideas'].includes(bucket) ? undefined : bucket,
        })
      }
    }
    if (source === 'p' && bucket !== 'Parking lot') {
      moveParkingToJournal(
        id,
        kindForBucket(bucket),
        ['Emotions', 'Thoughts', 'Ideas'].includes(bucket) ? undefined : bucket
      )
    }
  }

  return (
    <div className="min-h-screen bg-cream px-4 py-6 max-w-3xl mx-auto animate-fadeIn pb-28">
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={() => navigate({ type: 'home' })} className="btn-ghost">
          ← Back
        </button>
        <span className="text-xs text-warm-light">{date}</span>
      </div>

      <QuickCaptureColumn
        title="Interstitial journal"
        entries={entries}
        onAdd={addJournal}
        onAddParking={addParking}
        variant="journal"
      />

      <div className="mt-2 flex items-center justify-between">
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
      <div className="mt-1 grid grid-cols-2 lg:grid-cols-4 gap-2">
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
            <ul className="space-y-1.5 text-xs text-[#4B453F] max-h-40 overflow-y-auto pr-1">
              {board[bucket].length === 0 && <li className="text-[#9A9188]">Nothing yet</li>}
              {board[bucket].map((e) => {
                const parking = bucket === 'Parking lot'
                return (
                  <li
                    key={e.id}
                    draggable
                    onDragStart={(ev) =>
                      ev.dataTransfer.setData('text/plain', `${parking ? 'p' : 'j'}:${e.id}`)
                    }
                    className="leading-snug rounded-md px-1 py-0.5 hover:bg-white/60"
                  >
                    <span className="text-[10px] text-[#9A9188] tabular-nums mr-1.5">
                      {formatTimeOfDay(e.at)}
                    </span>
                    <span className="mr-1" aria-hidden>
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
                            onClick={() => updateJournalEntry(e.id, { kind: k })}
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
  )
}
