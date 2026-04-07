import { useState, useEffect, useCallback, useRef } from 'react'
import type { Category, QuickCapture, UnflattenedCircle } from '../lib/types'
import { DEBRIEF_KEYS } from '../lib/types'
import {
  formatTime,
  formatTimeOfDay,
  getCategoryColors,
  quickCaptureIcon,
  quickCaptureLabel,
} from '../lib/utils'
import UnflattenedTaskCircle from './UnflattenedTaskCircle'
import VoiceTextArea from './VoiceTextArea'

const DIGEST_PRESETS = [5, 10, 15]

interface Props {
  category: Category
  journalEntries: QuickCapture[]
  parkingEntries: QuickCapture[]
  circleBefore?: UnflattenedCircle
  onSave: (data: {
    digestDurationPlanned: number
    digestDurationActual: number
    digestSkipped: boolean
    circleAfter?: UnflattenedCircle
    reflections: Record<string, string>
  }) => void
  onCancel: () => void
}

export default function PostSessionPage({
  category,
  journalEntries,
  parkingEntries,
  circleBefore,
  onSave,
  onCancel,
}: Props) {
  const colors = getCategoryColors(category.colorKey)
  const [digestMins, setDigestMins] = useState<number | null>(null)
  const [digestRunning, setDigestRunning] = useState(false)
  const [digestRemaining, setDigestRemaining] = useState(0)
  const digestTotalRef = useRef(0)
  const digestAccumRef = useRef(0)
  const digestStartRef = useRef(0)
  const digestIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [debriefOpen, setDebriefOpen] = useState(false)
  const [circleAfter, setCircleAfter] = useState<UnflattenedCircle>({
    scope: circleBefore?.scope ?? 40,
    atmosphere: circleBefore?.atmosphere ?? 30,
  })
  const [reflections, setReflections] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!digestRunning || digestMins === null) return
    const total = digestMins * 60
    digestStartRef.current = Date.now()
    digestIntervalRef.current = setInterval(() => {
      const elapsed =
        digestAccumRef.current +
        (Date.now() - digestStartRef.current) / 1000
      const left = Math.max(0, total - elapsed)
      setDigestRemaining(left)
      if (left <= 0 && digestIntervalRef.current) {
        clearInterval(digestIntervalRef.current)
        digestIntervalRef.current = null
        digestAccumRef.current = total
        setDigestRunning(false)
      }
    }, 250)
    return () => {
      if (digestIntervalRef.current) clearInterval(digestIntervalRef.current)
    }
  }, [digestRunning, digestMins])

  const startDigest = (mins: number) => {
    digestAccumRef.current = 0
    digestTotalRef.current = mins * 60
    setDigestMins(mins)
    setDigestRemaining(mins * 60)
    setDigestRunning(true)
  }

  const finishDigestEarly = useCallback(() => {
    if (digestIntervalRef.current) clearInterval(digestIntervalRef.current)
    digestIntervalRef.current = null
    if (digestRunning && digestMins !== null) {
      digestAccumRef.current +=
        (Date.now() - digestStartRef.current) / 1000
    }
    setDigestRunning(false)
  }, [digestRunning, digestMins])

  const handleSave = useCallback(() => {
    let digestActual = 0
    let digestPlanned = 0
    let skipped = true
    if (digestMins !== null) {
      skipped = false
      digestPlanned = digestMins * 60
      let elapsed = digestAccumRef.current
      if (digestRunning) {
        elapsed += (Date.now() - digestStartRef.current) / 1000
      }
      digestActual = Math.min(digestPlanned, Math.round(elapsed))
    }
    const refl: Record<string, string> = {}
    if (debriefOpen) {
      for (const prompt of Object.values(DEBRIEF_KEYS)) {
        refl[prompt] = reflections[prompt] ?? ''
      }
    }
    onSave({
      digestDurationPlanned: digestPlanned,
      digestDurationActual: skipped ? 0 : digestActual,
      digestSkipped: skipped,
      circleAfter: debriefOpen ? circleAfter : undefined,
      reflections: refl,
    })
  }, [
    digestMins,
    digestRunning,
    debriefOpen,
    circleAfter,
    reflections,
    onSave,
  ])

  const setRef = (key: string, val: string) => {
    setReflections((r) => ({ ...r, [key]: val }))
  }

  return (
    <div className="min-h-screen bg-cream px-4 py-6 max-w-lg mx-auto animate-fadeIn pb-28">
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium self-center mb-4 mx-auto w-fit"
        style={{ backgroundColor: colors.bg, color: colors.text }}
      >
        {category.emoji} After the session
      </div>

      <h2 className="font-serif text-xl text-center mb-4">Land gently</h2>

      <div className="grid grid-cols-2 gap-2 mb-6">
        <div className="rounded-2xl border border-amber-100/80 bg-[#FDF9E8] p-3 max-h-48 overflow-y-auto">
          <p className="text-[10px] font-medium text-warm-muted uppercase mb-2">
            Journal
          </p>
          <ul className="text-xs space-y-1.5 text-warm-text">
            {journalEntries.length === 0 && (
              <li className="text-warm-light">Nothing captured</li>
            )}
            {journalEntries.map((e) => (
              <li key={e.id}>
                <span className="text-warm-light tabular-nums mr-1">
                  {formatTimeOfDay(e.at)}
                </span>
                <span aria-hidden className="mr-1">
                  {quickCaptureIcon(e.kind)}
                </span>
                {e.text.trim() || quickCaptureLabel(e.kind)}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-amber-900/10 bg-[#F5EDE4] p-3 max-h-48 overflow-y-auto">
          <p className="text-[10px] font-medium text-warm-muted uppercase mb-2">
            Parking lot
          </p>
          <ul className="text-xs space-y-1.5 text-warm-text">
            {parkingEntries.length === 0 && (
              <li className="text-warm-light">Empty</li>
            )}
            {parkingEntries.map((e) => (
              <li key={e.id}>
                <span className="text-warm-light tabular-nums mr-1">
                  {formatTimeOfDay(e.at)}
                </span>
                <span aria-hidden className="mr-1">
                  🛑
                </span>
                {e.text.trim() || 'parking lot'}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card mb-4">
        <p className="text-sm text-warm-text mb-2">Digest (optional)</p>
        <p className="text-xs text-warm-muted mb-3">
          Tidy tabs, process parking items, clear the deck.
        </p>
        {digestRunning && digestMins !== null ? (
          <div className="text-center py-2">
            <p className="text-2xl font-light tabular-nums text-warm-text">
              {formatTime(Math.ceil(digestRemaining))}
            </p>
            <button
              type="button"
              onClick={finishDigestEarly}
              className="text-xs text-warm-muted mt-2 btn-ghost"
            >
              Finish digest early
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 justify-center">
            {DIGEST_PRESETS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => startDigest(m)}
                className="px-4 py-2 rounded-xl bg-warm-white text-sm font-medium text-warm-text
                           hover:bg-warm-border/40"
              >
                {m} min
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setDebriefOpen((o) => !o)}
        className="w-full card py-3 px-4 flex items-center justify-between mb-3"
      >
        <span className="text-sm">
          Debrief <span className="text-warm-muted font-normal">(optional)</span>
        </span>
        <span className="text-warm-light">{debriefOpen ? '▾' : '▸'}</span>
      </button>

      {debriefOpen && (
        <div className="card space-y-4 mb-4">
          <div>
            <p className="text-xs text-warm-muted text-center mb-2">
              Now — how does it feel?
            </p>
            <UnflattenedTaskCircle
              value={circleAfter}
              onChange={setCircleAfter}
              colorKey={category.colorKey}
              compact
            />
          </div>
          {Object.values(DEBRIEF_KEYS).map((prompt) => (
            <div key={prompt}>
              <label className="text-xs text-warm-muted block mb-1">
                {prompt}
              </label>
              <VoiceTextArea
                value={reflections[prompt] ?? ''}
                onChange={(v) => setRef(prompt, v)}
                className="w-full bg-warm-white rounded-xl p-3 pr-12 text-sm resize-none
                           focus:outline-none focus:ring-2 focus:ring-warm-border min-h-[56px]"
                placeholder="…"
              />
            </div>
          ))}
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-cream/95 border-t border-warm-border max-w-lg mx-auto flex gap-2">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1">
          Abandon
        </button>
        <button type="button" onClick={handleSave} className="btn-primary flex-[2]">
          Save & return to Map
        </button>
      </div>
    </div>
  )
}
