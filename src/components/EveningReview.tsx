import { useState, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, saveEveningReflection } from '../lib/db'
import { useNavigation } from '../lib/store'
import { getTodayDate } from '../lib/utils'
import { EVENING_PROMPTS } from '../lib/defaults'
import BentoSummary from './BentoSummary'
import PyramidView from './PyramidView'
import VoiceTextArea from './VoiceTextArea'

type Step = 'summary' | 'alignment' | 'reflect' | 'done'

export default function EveningReview() {
  const { navigate } = useNavigation()
  const today = getTodayDate()

  const sessions = useLiveQuery(
    () => db.sessions.where('date').equals(today).sortBy('startedAt'),
    [today]
  )
  const categories = useLiveQuery(() => db.categories.toArray())
  const dayPlan = useLiveQuery(() => db.dayPlans.get(today), [today])

  const [step, setStep] = useState<Step>('summary')
  const [alignmentNote, setAlignmentNote] = useState('')
  const [reflections, setReflections] = useState<Record<string, string>>({})

  const updateReflection = useCallback(
    (prompt: string, value: string) => {
      setReflections((prev) => ({ ...prev, [prompt]: value }))
    },
    []
  )

  const handleSave = useCallback(async () => {
    const allReflections = { ...reflections }
    if (alignmentNote.trim()) {
      allReflections['_alignment'] = alignmentNote
    }
    await saveEveningReflection({
      date: today,
      reflections: allReflections,
      createdAt: Date.now(),
    })
    navigate({ type: 'home' })
  }, [reflections, alignmentNote, today, navigate])

  if (!sessions || !categories) {
    return (
      <div className="min-h-screen flex items-center justify-center text-warm-muted">
        Loading…
      </div>
    )
  }

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]))

  return (
    <div className="min-h-screen bg-cream">
      {step === 'summary' && (
        <div className="min-h-screen flex flex-col px-4 py-6 max-w-lg mx-auto animate-fadeIn">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate({ type: 'home' })}
              className="btn-ghost text-sm"
            >
              ← Back
            </button>
            <span className="text-xs text-warm-light uppercase tracking-wide">
              Evening
            </span>
            <div className="w-16" />
          </div>

          <div className="text-3xl text-center mb-3">🪞</div>
          <h2 className="font-serif text-2xl text-center mb-6">
            The honest mirror
          </h2>

          <div className="space-y-4 mb-8">
            <BentoSummary sessions={sessions} categoryMap={categoryMap} />
            <PyramidView sessions={sessions} categoryMap={categoryMap} />
          </div>

          <button
            onClick={() =>
              setStep(dayPlan?.intention ? 'alignment' : 'reflect')
            }
            className="btn-primary w-full"
          >
            Continue
          </button>
        </div>
      )}

      {step === 'alignment' && dayPlan?.intention && (
        <div className="min-h-screen flex flex-col px-4 py-6 max-w-lg mx-auto animate-fadeIn">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setStep('summary')}
              className="btn-ghost text-sm"
            >
              ← Back
            </button>
            <span className="text-xs text-warm-light uppercase tracking-wide">
              Alignment
            </span>
            <div className="w-16" />
          </div>

          <div className="flex-1 flex flex-col justify-center pb-16">
            <h2 className="font-serif text-xl text-center mb-2">
              This morning you said:
            </h2>
            <div className="card text-center mb-6">
              <p className="text-sm text-warm-text italic">
                &ldquo;{dayPlan.intention}&rdquo;
              </p>
            </div>
            <p className="text-center text-warm-muted text-sm mb-6">
              How did it go?
            </p>

            <VoiceTextArea
              value={alignmentNote}
              onChange={setAlignmentNote}
              placeholder="Honestly…"
              className="w-full bg-warm-white rounded-2xl p-4 pr-14 text-warm-text
                         placeholder:text-warm-light resize-none focus:outline-none
                         focus:ring-2 focus:ring-warm-border min-h-[100px] text-base leading-relaxed"
              autoFocus
            />

            <div className="mt-6">
              <button
                onClick={() => setStep('reflect')}
                className="btn-primary w-full"
              >
                {alignmentNote.trim() ? 'Continue' : 'Skip'}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'reflect' && (
        <div className="min-h-screen flex flex-col px-4 py-6 max-w-lg mx-auto animate-fadeIn">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() =>
                setStep(dayPlan?.intention ? 'alignment' : 'summary')
              }
              className="btn-ghost text-sm"
            >
              ← Back
            </button>
            <span className="text-xs text-warm-light uppercase tracking-wide">
              Reflect
            </span>
            <div className="w-16" />
          </div>

          <h2 className="font-serif text-xl text-center mb-2">
            A few gentle questions
          </h2>
          <p className="text-center text-warm-muted text-sm mb-6">
            Answer any, all, or none.
          </p>

          <div className="flex-1 space-y-4">
            {EVENING_PROMPTS.map((prompt) => (
              <div key={prompt}>
                <label className="text-sm text-warm-muted block mb-1.5">
                  {prompt}
                </label>
                <VoiceTextArea
                  value={reflections[prompt] ?? ''}
                  onChange={(val) => updateReflection(prompt, val)}
                  className="w-full bg-warm-white rounded-xl p-3 pr-12 text-sm text-warm-text
                             placeholder:text-warm-light resize-none focus:outline-none
                             focus:ring-2 focus:ring-warm-border min-h-[72px]"
                  placeholder="…"
                />
              </div>
            ))}
          </div>

          <div className="pt-6 pb-2">
            <button onClick={handleSave} className="btn-primary w-full">
              Close the day
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
