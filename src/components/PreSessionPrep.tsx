import { useState, useCallback, useEffect } from 'react'
import type { Category, TaskUnpacking, UnflattenedCircle } from '../lib/types'
import { getCategoryColors } from '../lib/utils'
import VoiceTextArea from './VoiceTextArea'
import UnflattenedTaskCircle from './UnflattenedTaskCircle'

const WORK_PRESETS = [15, 25, 30, 45, 60, 90] as const

const CUSTOM_MIN = 5
const CUSTOM_MAX = 480

function clampMinutes(n: number): number {
  if (!Number.isFinite(n)) return CUSTOM_MIN
  return Math.min(CUSTOM_MAX, Math.max(CUSTOM_MIN, Math.round(n)))
}

function isPresetMinutes(m: number): boolean {
  return (WORK_PRESETS as readonly number[]).includes(m)
}

interface Props {
  category: Category
  defaultWorkMinutes: number
  onBack: () => void
  onContinue: (data: {
    intention: string
    unpacking: TaskUnpacking
    circleBefore: UnflattenedCircle
    workMinutes: number
  }) => void
}

export default function PreSessionPrep({
  category,
  defaultWorkMinutes,
  onBack,
  onContinue,
}: Props) {
  const [intention, setIntention] = useState('')
  const [unpackOpen, setUnpackOpen] = useState(false)
  const [unpacking, setUnpacking] = useState<TaskUnpacking>({})
  const [circleBefore, setCircleBefore] = useState<UnflattenedCircle>({
    scope: 40,
    atmosphere: 30,
  })
  const [workMinutes, setWorkMinutes] = useState(() =>
    clampMinutes(defaultWorkMinutes)
  )
  const [customMode, setCustomMode] = useState(
    () => !isPresetMinutes(defaultWorkMinutes)
  )
  const [customDraft, setCustomDraft] = useState(() =>
    String(clampMinutes(defaultWorkMinutes))
  )

  useEffect(() => {
    const d = clampMinutes(defaultWorkMinutes)
    setWorkMinutes(d)
    setCustomMode(!isPresetMinutes(d))
    setCustomDraft(String(d))
  }, [defaultWorkMinutes])

  const catColors = getCategoryColors(category.colorKey)

  const submit = useCallback(() => {
    const minutes = customMode
      ? clampMinutes(
          customDraft.trim() === '' || !Number.isFinite(Number(customDraft))
            ? workMinutes
            : Number(customDraft)
        )
      : workMinutes
    onContinue({
      intention,
      unpacking: unpackOpen ? unpacking : {},
      circleBefore,
      workMinutes: minutes,
    })
  }, [
    intention,
    unpackOpen,
    unpacking,
    circleBefore,
    workMinutes,
    customMode,
    customDraft,
    onContinue,
  ])

  return (
    <div className="min-h-screen bg-cream px-4 py-6 max-w-lg mx-auto animate-fadeIn pb-24">
      <div className="flex items-center justify-between mb-6">
        <button type="button" onClick={onBack} className="btn-ghost text-sm">
          ← Map
        </button>
        <span
          className="text-xs px-3 py-1 rounded-full font-medium"
          style={{
            backgroundColor: catColors.bg,
            color: catColors.text,
          }}
        >
          {category.emoji} {category.name}
        </span>
        <div className="w-14" />
      </div>

      <h2 className="font-serif text-xl text-center mb-1">Before you begin</h2>
      <p className="text-center text-warm-muted text-sm mb-6">
        What are you doing and why?
      </p>

      <VoiceTextArea
        value={intention}
        onChange={setIntention}
        placeholder="Describe the task…"
        className="w-full bg-warm-white rounded-2xl p-4 pr-14 text-warm-text
                   placeholder:text-warm-light resize-none focus:outline-none
                   focus:ring-2 focus:ring-warm-border min-h-[88px] text-base"
        autoFocus
      />

      <button
        type="button"
        onClick={() => setUnpackOpen((o) => !o)}
        className="mt-4 w-full text-left card py-3 px-4 flex items-center justify-between"
      >
        <span className="text-sm text-warm-text">
          Unpack this task{' '}
          <span className="text-warm-muted font-normal">(optional)</span>
        </span>
        <span className="text-warm-light">{unpackOpen ? '▾' : '▸'}</span>
      </button>

      {unpackOpen && (
        <div className="mt-3 space-y-3 card">
          {(
            [
              ['involves', 'What does it involve?'],
              ['need', 'What do you need?'],
              ['hard', "What's hard about this?"],
              ['feel', 'How do you feel about it?'],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className="text-xs text-warm-muted block mb-1">{label}</label>
              <textarea
                value={unpacking[key] ?? ''}
                onChange={(e) =>
                  setUnpacking((u) => ({ ...u, [key]: e.target.value }))
                }
                rows={2}
                className="w-full bg-warm-white rounded-xl p-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-warm-border"
              />
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 card">
        <p className="text-xs text-warm-muted uppercase tracking-wide mb-3 text-center">
          Unflattened task
        </p>
        <UnflattenedTaskCircle
          value={circleBefore}
          onChange={setCircleBefore}
          colorKey={category.colorKey}
        />
      </div>

      <div className="mt-6">
        <p className="text-xs text-warm-muted text-center mb-3">Timer</p>
        <div className="flex flex-wrap justify-center gap-2">
          {WORK_PRESETS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setCustomMode(false)
                setWorkMinutes(m)
              }}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all
                ${
                  !customMode && workMinutes === m
                    ? 'bg-warm-text text-cream'
                    : 'bg-warm-white text-warm-muted'
                }`}
            >
              {m}m
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setCustomMode(true)
              setCustomDraft(String(workMinutes))
            }}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all
              ${
                customMode
                  ? 'bg-warm-text text-cream'
                  : 'bg-warm-white text-warm-muted'
              }`}
          >
            Custom
          </button>
        </div>
        {customMode && (
          <div className="mt-3 flex flex-col items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-warm-text">
              <span className="text-warm-muted">Minutes</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={customDraft}
                onChange={(e) => {
                  const v = e.target.value
                  if (v !== '' && !/^\d*$/.test(v)) return
                  setCustomDraft(v)
                  if (v === '') return
                  const n = Number(v)
                  if (Number.isFinite(n)) setWorkMinutes(clampMinutes(n))
                }}
                onBlur={() => {
                  const n = Number(customDraft)
                  const c = clampMinutes(
                    Number.isFinite(n) && customDraft.trim() !== ''
                      ? n
                      : workMinutes
                  )
                  setWorkMinutes(c)
                  setCustomDraft(String(c))
                }}
                className="w-24 bg-warm-white rounded-xl px-3 py-2 text-center text-base font-medium
                  focus:outline-none focus:ring-2 focus:ring-warm-border"
              />
            </label>
            <p className="text-[11px] text-warm-light">
              {CUSTOM_MIN}–{CUSTOM_MAX} minutes
            </p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-cream/95 border-t border-warm-border max-w-lg mx-auto">
        <button type="button" onClick={submit} className="btn-primary w-full">
          Start session
        </button>
      </div>
    </div>
  )
}
