import { useState, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, saveSession, getSettings } from '../lib/db'
import { useNavigation } from '../lib/store'
import type { Category, Session, SessionPhase } from '../lib/types'
import { getTodayDate } from '../lib/utils'
import CategoryPicker from './CategoryPicker'
import IntentionStep from './IntentionStep'
import DurationPicker from './DurationPicker'
import TimerDisplay from './TimerDisplay'
import DebriefStep from './DebriefStep'

interface SessionState {
  category: Category | null
  intention: string
  workMinutes: number
  digestMinutes: number
  workActualSeconds: number
  digestActualSeconds: number
  digestSkipped: boolean
  startedAt: number
}

export default function SessionFlow() {
  const { navigate } = useNavigation()
  const categories = useLiveQuery(() =>
    db.categories.orderBy('sortOrder').toArray()
  )
  const settings = useLiveQuery(() => getSettings())

  const [phase, setPhase] = useState<SessionPhase>('category')
  const [state, setState] = useState<SessionState>({
    category: null,
    intention: '',
    workMinutes: 45,
    digestMinutes: 10,
    workActualSeconds: 0,
    digestActualSeconds: 0,
    digestSkipped: false,
    startedAt: 0,
  })

  const handleCategorySelect = useCallback((cat: Category) => {
    setState((s) => ({ ...s, category: cat }))
    setPhase('intention')
  }, [])

  const handleIntentionSubmit = useCallback(
    (intention: string) => {
      setState((s) => ({
        ...s,
        intention,
        workMinutes: settings?.defaultWorkMinutes ?? 45,
        digestMinutes: settings?.defaultDigestMinutes ?? 10,
      }))
      setPhase('duration')
    },
    [settings]
  )

  const handleDurationSubmit = useCallback(
    (workMinutes: number, digestMinutes: number) => {
      setState((s) => ({
        ...s,
        workMinutes,
        digestMinutes,
        startedAt: Date.now(),
      }))
      setPhase('timer-work')
    },
    []
  )

  const handleWorkComplete = useCallback((actualSeconds: number) => {
    setState((s) => ({ ...s, workActualSeconds: actualSeconds }))
    setPhase('timer-digest-prompt')
  }, [])

  const handleDigestStart = useCallback(() => {
    setPhase('timer-digest')
  }, [])

  const handleDigestSkip = useCallback(() => {
    setState((s) => ({ ...s, digestSkipped: true, digestActualSeconds: 0 }))
    setPhase('debrief')
  }, [])

  const handleDigestComplete = useCallback((actualSeconds: number) => {
    setState((s) => ({ ...s, digestActualSeconds: actualSeconds }))
    setPhase('debrief')
  }, [])

  const handleDebriefSubmit = useCallback(
    async (reflections: Record<string, string>) => {
      const session: Session = {
        date: getTodayDate(),
        categoryId: state.category!.id,
        intention: state.intention,
        workDurationPlanned: state.workMinutes * 60,
        workDurationActual: state.workActualSeconds,
        digestDurationPlanned: state.digestMinutes * 60,
        digestDurationActual: state.digestActualSeconds,
        digestSkipped: state.digestSkipped,
        reflections,
        startedAt: state.startedAt,
        endedAt: Date.now(),
        status: 'completed',
      }
      await saveSession(session)
      navigate({ type: 'home' })
    },
    [state, navigate]
  )

  const goHome = useCallback(() => navigate({ type: 'home' }), [navigate])

  if (!categories || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center text-warm-muted">
        Loading…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      {phase === 'category' && (
        <CategoryPicker
          categories={categories}
          onSelect={handleCategorySelect}
          onCancel={goHome}
        />
      )}

      {phase === 'intention' && state.category && (
        <IntentionStep
          category={state.category}
          onSubmit={handleIntentionSubmit}
          onBack={() => setPhase('category')}
        />
      )}

      {phase === 'duration' && (
        <DurationPicker
          workMinutes={state.workMinutes}
          digestMinutes={state.digestMinutes}
          onSubmit={handleDurationSubmit}
          onBack={() => setPhase('intention')}
        />
      )}

      {phase === 'timer-work' && state.category && (
        <TimerDisplay
          durationSeconds={state.workMinutes * 60}
          phase="work"
          category={state.category}
          intention={state.intention}
          onComplete={handleWorkComplete}
          onCancel={goHome}
        />
      )}

      {phase === 'timer-digest-prompt' && state.category && (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center animate-fadeIn">
          <div className="text-4xl mb-4">🫖</div>
          <h2 className="font-serif text-2xl text-warm-text mb-2">
            Time to digest
          </h2>
          <p className="text-warm-muted text-sm max-w-xs mb-8">
            Take {state.digestMinutes} minutes to save what matters, close what
            doesn't, and clear your workspace.
          </p>
          <div className="space-y-3 w-full max-w-xs">
            <button onClick={handleDigestStart} className="btn-primary w-full">
              Start digest ({state.digestMinutes}m)
            </button>
            <button onClick={handleDigestSkip} className="btn-ghost w-full">
              Skip, go to debrief
            </button>
          </div>
        </div>
      )}

      {phase === 'timer-digest' && state.category && (
        <TimerDisplay
          durationSeconds={state.digestMinutes * 60}
          phase="digest"
          category={state.category}
          intention="Save what matters. Close what doesn't."
          onComplete={handleDigestComplete}
          onCancel={() => handleDigestComplete(0)}
        />
      )}

      {phase === 'debrief' && state.category && (
        <DebriefStep
          category={state.category}
          onSubmit={handleDebriefSubmit}
        />
      )}
    </div>
  )
}
