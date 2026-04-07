import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, saveAdventureLog } from '../lib/db'
import { useNavigation } from '../lib/store'
import type {
  AdventureLog,
  WeatherMood,
  EnergyArrow,
  LifePhaseSelf,
} from '../lib/types'
import { getTodayDate } from '../lib/utils'
import VoiceTextArea from './VoiceTextArea'

const WEATHER: { id: Exclude<WeatherMood, ''>; emoji: string; label: string }[] =
  [
    { id: 'clear', emoji: '☀️', label: 'Clear' },
    { id: 'bright', emoji: '🌤', label: 'Bright' },
    { id: 'cloudy', emoji: '☁️', label: 'Cloudy' },
    { id: 'rain', emoji: '🌧', label: 'Rain' },
    { id: 'fog', emoji: '🌫', label: 'Fog' },
    { id: 'fire', emoji: '🔥', label: 'Spiky' },
  ]

const PHASES: {
  id: Exclude<LifePhaseSelf, ''>
  emoji: string
  label: string
}[] = [
  { id: 'gathering', emoji: '🌾', label: 'Gathering' },
  { id: 'building', emoji: '🏗', label: 'Building' },
  { id: 'digesting', emoji: '🫖', label: 'Digesting' },
]

function emptyDraft(date: string): Partial<AdventureLog> {
  return {
    date,
    weatherMood: '',
    energyArrow: '',
    lifePhase: '',
  }
}

export default function ThresholdView() {
  const { navigate } = useNavigation()
  const today = getTodayDate()
  const log = useLiveQuery(() => db.adventureLogs.get(today), [today])

  const [draft, setDraft] = useState<Partial<AdventureLog>>(() =>
    emptyDraft(today)
  )
  const dirtyRef = useRef(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [openVoices, setOpenVoices] = useState(false)
  const [openShift, setOpenShift] = useState(false)
  const [openMirror, setOpenMirror] = useState(false)
  const [openEvening, setOpenEvening] = useState(false)
  const [openMind, setOpenMind] = useState(true)
  const [openDirection, setOpenDirection] = useState(true)

  const prevToday = useRef(today)
  useEffect(() => {
    if (prevToday.current !== today) {
      prevToday.current = today
      dirtyRef.current = false
      setDraft(emptyDraft(today))
    }
  }, [today])

  useEffect(() => {
    if (dirtyRef.current) return
    if (log && log.date === today) {
      setDraft({
        ...log,
        weatherMood: log.weatherMood ?? '',
        energyArrow: log.energyArrow ?? '',
        lifePhase: log.lifePhase ?? '',
      })
    }
  }, [today, log])

  const patch = useCallback((p: Partial<AdventureLog>) => {
    dirtyRef.current = true
    setDraft((d) => ({ ...d, ...p }))
  }, [])

  const flushSave = useCallback(async () => {
    await saveAdventureLog({
      ...draft,
      date: today,
    } as AdventureLog)
    dirtyRef.current = false
  }, [draft, today])

  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      void flushSave()
    }, 700)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [draft, flushSave])

  const toggleWeather = (id: Exclude<WeatherMood, ''>) => {
    patch({
      weatherMood: draft.weatherMood === id ? '' : id,
    })
  }

  return (
    <div className="space-y-5 pt-2 pb-32 animate-fadeIn max-w-lg mx-auto">
      <div className="text-center space-y-1">
        <p className="text-2xl">🚪</p>
        <h2 className="font-serif text-xl text-warm-text">The Threshold</h2>
        <p className="text-sm text-warm-muted px-2">
          A pause before the labyrinth — as quick or as deep as you need.
        </p>
      </div>

      <section className="card space-y-3">
        <p className="text-[10px] uppercase tracking-wide text-warm-muted font-medium">
          Internal weather
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {WEATHER.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => toggleWeather(w.id)}
              className={`flex flex-col items-center px-3 py-2 rounded-xl border transition-all text-xs
                ${
                  draft.weatherMood === w.id
                    ? 'border-warm-text bg-warm-white shadow-sm'
                    : 'border-transparent bg-warm-white/60 hover:border-warm-border'
                }`}
            >
              <span className="text-xl">{w.emoji}</span>
              <span className="text-warm-muted mt-0.5">{w.label}</span>
            </button>
          ))}
        </div>
        <VoiceTextArea
          value={draft.howAreYou ?? ''}
          onChange={(v) => patch({ howAreYou: v })}
          placeholder="How are you today? One sentence is enough."
          className="w-full bg-warm-white rounded-xl p-3 pr-12 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-warm-border min-h-[64px]"
        />
      </section>

      <Expandable
        title="What&apos;s on your mind"
        open={openMind}
        onToggle={() => setOpenMind((o) => !o)}
      >
        <div className="space-y-3 pt-1">
          <VoiceTextArea
            value={draft.onMind ?? ''}
            onChange={(v) => patch({ onMind: v })}
            placeholder="Brain dump — everything pulling at your attention…"
            className="w-full bg-warm-white rounded-xl p-3 pr-12 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-warm-border min-h-[80px]"
          />
          <VoiceTextArea
            value={draft.whatsPulling ?? ''}
            onChange={(v) => patch({ whatsPulling: v })}
            placeholder="What&apos;s especially pulling you?"
            className="w-full bg-warm-white rounded-xl p-3 pr-12 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-warm-border min-h-[56px]"
          />
          <VoiceTextArea
            value={draft.carrying ?? ''}
            onChange={(v) => patch({ carrying: v })}
            placeholder="What are you carrying into today?"
            className="w-full bg-warm-white rounded-xl p-3 pr-12 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-warm-border min-h-[56px]"
          />
        </div>
      </Expandable>

      <Expandable
        title="Direction for today"
        open={openDirection}
        onToggle={() => setOpenDirection((o) => !o)}
      >
        <div className="space-y-3 pt-1">
          <VoiceTextArea
            value={draft.intentionToday ?? ''}
            onChange={(v) => patch({ intentionToday: v })}
            placeholder="What do you want from today? (Not a rigid plan — a direction.)"
            className="w-full bg-warm-white rounded-xl p-3 pr-12 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-warm-border min-h-[72px]"
          />
          <VoiceTextArea
            value={draft.oneThingWorthwhile ?? ''}
            onChange={(v) => patch({ oneThingWorthwhile: v })}
            placeholder="The one thing that would make today feel worthwhile…"
            className="w-full bg-warm-white rounded-xl p-3 pr-12 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-warm-border min-h-[56px]"
          />
          <VoiceTextArea
            value={draft.avoidingFacing ?? ''}
            onChange={(v) => patch({ avoidingFacing: v })}
            placeholder="Anything you&apos;re avoiding that might need facing?"
            className="w-full bg-warm-white rounded-xl p-3 pr-12 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-warm-border min-h-[56px]"
          />
          <VoiceTextArea
            value={draft.projectsSituate ?? ''}
            onChange={(v) => patch({ projectsSituate: v })}
            placeholder="Where are you on current projects / adventures? Quick situating."
            className="w-full bg-warm-white rounded-xl p-3 pr-12 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-warm-border min-h-[56px]"
          />
        </div>
      </Expandable>

      <Expandable
        title="Inner voices (optional)"
        open={openVoices}
        onToggle={() => setOpenVoices((o) => !o)}
      >
        <div className="space-y-3 pt-1">
          {(
            [
              ['voiceCritic', 'The critic'],
              ['voiceDreamer', 'The dreamer'],
              ['voiceScared', 'The scared one'],
              ['voiceExhausted', 'The exhausted one'],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className="text-xs text-warm-muted block mb-1">{label}</label>
              <VoiceTextArea
                value={
                  typeof draft[key] === 'string' ? (draft[key] as string) : ''
                }
                onChange={(v) =>
                  patch({ [key]: v } as Partial<AdventureLog>)
                }
                className="w-full bg-warm-white rounded-xl p-2.5 pr-10 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-warm-border min-h-[48px]"
                placeholder="…"
              />
            </div>
          ))}
        </div>
      </Expandable>

      <Expandable
        title="Since yesterday (optional)"
        open={openShift}
        onToggle={() => setOpenShift((o) => !o)}
      >
        <div className="space-y-3 pt-1">
          <p className="text-xs text-warm-muted">Energy / clarity — rough arrow</p>
          <div className="flex gap-2 justify-center">
            {(
              [
                ['up', '↑ Lighter'],
                ['steady', '→ Steady'],
                ['down', '↓ Heavier'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() =>
                  patch({
                    energyArrow:
                      draft.energyArrow === id ? '' : (id as EnergyArrow),
                  })
                }
                className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all
                  ${
                    draft.energyArrow === id
                      ? 'border-warm-text bg-warm-text text-cream'
                      : 'border-warm-border bg-warm-white text-warm-muted'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
          <VoiceTextArea
            value={draft.shiftedSinceYesterday ?? ''}
            onChange={(v) => patch({ shiftedSinceYesterday: v })}
            placeholder="What shifted? Hope, stuckness, clarity…"
            className="w-full bg-warm-white rounded-xl p-3 pr-12 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-warm-border min-h-[64px]"
          />
        </div>
      </Expandable>

      <Expandable
        title="Honest mirror (optional)"
        open={openMirror}
        onToggle={() => setOpenMirror((o) => !o)}
      >
        <div className="space-y-3 pt-1">
          <VoiceTextArea
            value={draft.creativeVsReactive ?? ''}
            onChange={(v) => patch({ creativeVsReactive: v })}
            placeholder="Creative & responsive, or reactive & impulsive?"
            className="w-full bg-warm-white rounded-xl p-3 pr-12 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-warm-border min-h-[56px]"
          />
          <p className="text-xs text-warm-muted">Phase right now (no wrong answer)</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {PHASES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() =>
                  patch({
                    lifePhase: draft.lifePhase === p.id ? '' : p.id,
                  })
                }
                className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all flex items-center gap-1
                  ${
                    draft.lifePhase === p.id
                      ? 'border-warm-text bg-warm-text text-cream'
                      : 'border-warm-border bg-warm-white text-warm-muted'
                  }`}
              >
                <span>{p.emoji}</span> {p.label}
              </button>
            ))}
          </div>
          <VoiceTextArea
            value={draft.needRightNow ?? ''}
            onChange={(v) => patch({ needRightNow: v })}
            placeholder="What do you need right now? (Start / sit / talk / rest…)"
            className="w-full bg-warm-white rounded-xl p-3 pr-12 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-warm-border min-h-[56px]"
          />
        </div>
      </Expandable>

      <Expandable
        title="Evening at the threshold (optional)"
        open={openEvening}
        onToggle={() => setOpenEvening((o) => !o)}
      >
        <VoiceTextArea
          value={draft.eveningClosing ?? ''}
          onChange={(v) => patch({ eveningClosing: v })}
          placeholder="How did today go? A line or a paragraph — report from the edge."
          className="w-full bg-warm-white rounded-xl p-3 pr-12 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-warm-border min-h-[88px]"
        />
      </Expandable>

      <div className="fixed bottom-20 left-0 right-0 px-4 max-w-lg mx-auto flex gap-2 z-10">
        <button
          type="button"
          onClick={() => navigate({ type: 'home' })}
          className="btn-ghost flex-1 border border-warm-border bg-cream/95 backdrop-blur"
        >
          Map
        </button>
        <button
          type="button"
          onClick={() => navigate({ type: 'home' })}
          className="btn-primary flex-[1.4]"
        >
          Into the Territory
        </button>
      </div>
    </div>
  )
}

function Expandable({
  title,
  open,
  onToggle,
  children,
}: {
  title: string
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <div className="card">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between text-left text-sm font-medium text-warm-text"
      >
        {title}
        <span className="text-warm-light">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="mt-3 border-t border-warm-border pt-3">{children}</div>}
    </div>
  )
}
