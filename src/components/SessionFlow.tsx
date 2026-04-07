import { useState, useCallback, useMemo, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, saveSession, getSettings } from '../lib/db'
import { useNavigation } from '../lib/store'
import type {
  Category,
  Session,
  SessionPhase,
  QuickCapture,
  TaskUnpacking,
  UnflattenedCircle,
} from '../lib/types'
import { getTodayDate, type QuickCaptureKind } from '../lib/utils'
import CategoryPicker from './CategoryPicker'
import PreSessionPrep from './PreSessionPrep'
import WorkTimerPanel from './WorkTimerPanel'
import PostSessionPage from './PostSessionPage'

function captureId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export default function SessionFlow() {
  const { view, navigate } = useNavigation()
  const categories = useLiveQuery(() =>
    db.categories.orderBy('sortOrder').toArray()
  )
  const settings = useLiveQuery(() => getSettings())

  const sessionCategoryId = view.type === 'session' ? view.categoryId : undefined
  const [pickedCategory, setPickedCategory] = useState<Category | null>(null)

  const category = useMemo(() => {
    if (!categories?.length) return null
    if (sessionCategoryId) {
      const c = categories.find(
        (x) => x.id === sessionCategoryId && !x.archived
      )
      return c ?? null
    }
    return pickedCategory
  }, [categories, sessionCategoryId, pickedCategory])

  useEffect(() => {
    if (sessionCategoryId) setPickedCategory(null)
  }, [sessionCategoryId])

  const [phase, setPhase] = useState<SessionPhase>('prep')
  const [intention, setIntention] = useState('')
  const [unpacking, setUnpacking] = useState<TaskUnpacking>({})
  const [circleBefore, setCircleBefore] = useState<
    UnflattenedCircle | undefined
  >()
  const [workMinutes, setWorkMinutes] = useState(45)
  const [workActualSeconds, setWorkActualSeconds] = useState(0)
  const [startedAt, setStartedAt] = useState(0)
  const [journalEntries, setJournalEntries] = useState<QuickCapture[]>([])
  const [parkingEntries, setParkingEntries] = useState<QuickCapture[]>([])

  const resetFlow = useCallback(() => {
    setPhase('prep')
    setIntention('')
    setUnpacking({})
    setCircleBefore(undefined)
    setWorkMinutes(settings?.defaultWorkMinutes ?? 45)
    setWorkActualSeconds(0)
    setStartedAt(0)
    setJournalEntries([])
    setParkingEntries([])
    setPickedCategory(null)
  }, [settings?.defaultWorkMinutes])

  const goHome = useCallback(() => {
    resetFlow()
    navigate({ type: 'home' })
  }, [navigate, resetFlow])

  const handlePrepContinue = useCallback(
    (data: {
      intention: string
      unpacking: TaskUnpacking
      circleBefore: UnflattenedCircle
      workMinutes: number
    }) => {
      setIntention(data.intention)
      setUnpacking(data.unpacking)
      setCircleBefore(data.circleBefore)
      setWorkMinutes(data.workMinutes)
      setStartedAt(Date.now())
      setPhase('timer-work')
    },
    []
  )

  const addJournal = useCallback((text: string, kind?: QuickCaptureKind) => {
    setJournalEntries((list) => [
      ...list,
      { id: captureId(), text, at: Date.now(), kind: kind ?? 'thought' },
    ])
  }, [])

  const addParking = useCallback((text: string) => {
    setParkingEntries((list) => [
      ...list,
      { id: captureId(), text, at: Date.now() },
    ])
  }, [])

  const updateJournalEntry = useCallback(
    (id: string, patch: Partial<Pick<QuickCapture, 'text' | 'kind' | 'bucket'>>) => {
      setJournalEntries((list) =>
        list.map((item) => (item.id === id ? { ...item, ...patch } : item))
      )
    },
    []
  )

  const moveJournalToParking = useCallback((id: string) => {
    setJournalEntries((list) => {
      const item = list.find((x) => x.id === id)
      if (!item) return list
      setParkingEntries((parking) => [
        ...parking,
        { id: item.id, text: item.text, at: item.at },
      ])
      return list.filter((x) => x.id !== id)
    })
  }, [])

  const moveParkingToJournal = useCallback(
    (id: string, kind: QuickCaptureKind = 'thought', bucket?: string) => {
      setParkingEntries((list) => {
        const item = list.find((x) => x.id === id)
        if (!item) return list
        setJournalEntries((journal) => [
          ...journal,
          { id: item.id, text: item.text, at: item.at, kind, bucket },
        ])
        return list.filter((x) => x.id !== id)
      })
    },
    []
  )

  const handleWorkComplete = useCallback((actualSeconds: number) => {
    setWorkActualSeconds(actualSeconds)
    setPhase('post')
  }, [])

  const handlePostSave = useCallback(
    async (post: {
      digestDurationPlanned: number
      digestDurationActual: number
      digestSkipped: boolean
      circleAfter?: UnflattenedCircle
      reflections: Record<string, string>
    }) => {
      if (!category) return
      const session: Session = {
        date: getTodayDate(),
        categoryId: category.id,
        intention,
        workDurationPlanned: workMinutes * 60,
        workDurationActual: workActualSeconds,
        digestDurationPlanned: post.digestDurationPlanned,
        digestDurationActual: post.digestDurationActual,
        digestSkipped: post.digestSkipped,
        reflections: post.reflections,
        startedAt,
        endedAt: Date.now(),
        status: 'completed',
        unpacking:
          unpacking && Object.values(unpacking).some((v) => v?.trim())
            ? unpacking
            : undefined,
        circleBefore,
        circleAfter: post.circleAfter,
        journalEntries,
        parkingEntries,
      }
      await saveSession(session)
      resetFlow()
      navigate({ type: 'home' })
    },
    [
      category,
      intention,
      workMinutes,
      workActualSeconds,
      startedAt,
      unpacking,
      circleBefore,
      journalEntries,
      parkingEntries,
      navigate,
      resetFlow,
    ]
  )

  if (!categories || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center text-warm-muted">
        Loading…
      </div>
    )
  }

  if (!category) {
    return (
      <CategoryPicker
        categories={categories}
        onSelect={(c) => setPickedCategory(c)}
        onCancel={goHome}
      />
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      {phase === 'prep' && (
        <PreSessionPrep
          category={category}
          defaultWorkMinutes={settings.defaultWorkMinutes}
          onBack={goHome}
          onContinue={handlePrepContinue}
        />
      )}

      {phase === 'timer-work' && (
        <WorkTimerPanel
          durationSeconds={workMinutes * 60}
          category={category}
          intention={intention}
          journalEntries={journalEntries}
          parkingEntries={parkingEntries}
          onJournalAdd={addJournal}
          onParkingAdd={addParking}
          onJournalUpdate={updateJournalEntry}
          onJournalMoveToParking={moveJournalToParking}
          onParkingMoveToJournal={moveParkingToJournal}
          onComplete={handleWorkComplete}
          onCancel={goHome}
        />
      )}

      {phase === 'post' && (
        <PostSessionPage
          category={category}
          journalEntries={journalEntries}
          parkingEntries={parkingEntries}
          circleBefore={circleBefore}
          onSave={handlePostSave}
          onCancel={goHome}
        />
      )}
    </div>
  )
}
