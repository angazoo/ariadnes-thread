import { useMemo, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Category, Session } from '../lib/types'
import { formatDuration, getCategoryColors, getTierLabel } from '../lib/utils'
import { reorderCategories } from '../lib/db'

interface Props {
  categories: Category[]
  sessionsToday: Session[]
  plannedIds: Set<string>
  onTogglePlanned: (categoryId: string) => void
  onStartSession: (categoryId: string) => void
  mode: 'grid' | 'pyramid'
}

function secondsPerCategory(
  sessions: Session[]
): Record<string, number> {
  const m: Record<string, number> = {}
  for (const s of sessions) {
    const t = s.workDurationActual + s.digestDurationActual
    m[s.categoryId] = (m[s.categoryId] ?? 0) + t
  }
  return m
}

function SortableTile({
  cat,
  seconds,
  maxSec,
  planned,
  onTogglePlanned,
  onStartSession,
}: {
  cat: Category
  seconds: number
  maxSec: number
  planned: boolean
  onTogglePlanned: (id: string) => void
  onStartSession: (id: string) => void
}) {
  const colors = getCategoryColors(cat.colorKey)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cat.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.85 : 1,
  }

  const barPct = maxSec > 0 ? Math.min(100, (seconds / maxSec) * 100) : 0

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative rounded-2xl border border-warm-border/70 overflow-hidden min-h-[132px] flex flex-col shadow-soft transition-shadow duration-300 hover:shadow-float"
    >
      <button
        type="button"
        className="absolute left-1.5 top-2 z-20 p-2 text-warm-light hover:text-warm-muted touch-none cursor-grab active:cursor-grabbing"
        aria-label="Drag to reorder"
        {...listeners}
        {...attributes}
      >
        <span className="text-sm leading-none tracking-tighter">⋮⋮</span>
      </button>

      <button
        type="button"
        className="flex-1 text-left pl-9 pr-10 pt-3 pb-3 w-full"
        style={{ backgroundColor: colors.bg }}
        onClick={() => onStartSession(cat.id)}
      >
        <div className="text-2xl mb-1">{cat.emoji}</div>
        <div className="font-medium text-sm" style={{ color: colors.text }}>
          {cat.name}
        </div>
        <div className="text-[11px] text-warm-muted mt-1">
          {seconds > 0
            ? formatDuration(seconds)
            : 'Tap to begin'}
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-white/50 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${barPct}%`,
              backgroundColor: colors.accent,
            }}
          />
        </div>
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onTogglePlanned(cat.id)
        }}
        className={`absolute right-2 top-2 z-20 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors
          ${
            planned
              ? 'border-warm-text bg-warm-text/90'
              : 'border-warm-light/50 bg-white/40 hover:border-warm-muted'
          }`}
        aria-label={
          planned ? 'Remove from today’s intention' : 'Mark for today'
        }
        aria-pressed={planned}
      >
        {planned && (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FAF8F5"
            strokeWidth="2.5"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>
    </div>
  )
}

function StaticTile({
  cat,
  seconds,
  maxSec,
  planned,
  onTogglePlanned,
  onStartSession,
}: {
  cat: Category
  seconds: number
  maxSec: number
  planned: boolean
  onTogglePlanned: (id: string) => void
  onStartSession: (id: string) => void
}) {
  const colors = getCategoryColors(cat.colorKey)
  const barPct = maxSec > 0 ? Math.min(100, (seconds / maxSec) * 100) : 0

  return (
    <div className="relative rounded-2xl border border-warm-border/60 overflow-hidden min-h-[120px]">
      <button
        type="button"
        className="w-full text-left px-4 pt-3 pb-3 pr-12"
        style={{ backgroundColor: colors.bg }}
        onClick={() => onStartSession(cat.id)}
      >
        <div className="text-2xl mb-1">{cat.emoji}</div>
        <div className="font-medium text-sm" style={{ color: colors.text }}>
          {cat.name}
        </div>
        <div className="text-[10px] text-warm-muted mt-0.5">
          {getTierLabel(cat.tier)}
        </div>
        <div className="text-[11px] text-warm-muted mt-1">
          {seconds > 0 ? formatDuration(seconds) : 'Tap to begin'}
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-white/50 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${barPct}%`, backgroundColor: colors.accent }}
          />
        </div>
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onTogglePlanned(cat.id)
        }}
        className={`absolute right-2 top-2 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors
          ${
            planned
              ? 'border-warm-text bg-warm-text/90'
              : 'border-warm-light/50 bg-white/40'
          }`}
        aria-label={planned ? 'Remove intention' : 'Mark for today'}
        aria-pressed={planned}
      >
        {planned && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FAF8F5" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>
    </div>
  )
}

export default function MapTileGrid({
  categories,
  sessionsToday,
  plannedIds,
  onTogglePlanned,
  onStartSession,
  mode,
}: Props) {
  const activeCats = useMemo(
    () =>
      [...categories]
        .filter((c) => !c.archived)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [categories]
  )

  const secMap = useMemo(
    () => secondsPerCategory(sessionsToday),
    [sessionsToday]
  )
  const maxSec = useMemo(
    () => Math.max(1, ...activeCats.map((c) => secMap[c.id] ?? 0)),
    [activeCats, secMap]
  )

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 12 },
    })
  )

  const onDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active: dragged, over } = event
      if (!over || dragged.id === over.id) return
      const ids = activeCats.map((c) => c.id)
      const oldIndex = ids.indexOf(dragged.id as string)
      const newIndex = ids.indexOf(over.id as string)
      if (oldIndex < 0 || newIndex < 0) return
      const next = arrayMove(ids, oldIndex, newIndex)
      await reorderCategories(next)
    },
    [activeCats]
  )

  if (mode === 'pyramid') {
    const byTier = {
      treat: activeCats.filter((c) => c.tier === 'treat'),
      building: activeCats.filter((c) => c.tier === 'building'),
      foundation: activeCats.filter((c) => c.tier === 'foundation'),
    }
    const rows: [string, Category[]][] = [
      ['Treats', byTier.treat],
      ['Building', byTier.building],
      ['Foundation', byTier.foundation],
    ]
    return (
      <div className="space-y-4">
        {rows.map(([label, cats]) =>
          cats.length ? (
            <div key={label}>
              <p className="text-[10px] uppercase tracking-wide text-warm-muted mb-2">
                {label}
              </p>
              <div
                className={`grid gap-3 ${
                  cats.length === 1 ? 'grid-cols-1 max-w-xs mx-auto' : 'grid-cols-2'
                }`}
              >
                {cats.map((cat) => (
                  <StaticTile
                    key={cat.id}
                    cat={cat}
                    seconds={secMap[cat.id] ?? 0}
                    maxSec={maxSec}
                    planned={plannedIds.has(cat.id)}
                    onTogglePlanned={onTogglePlanned}
                    onStartSession={onStartSession}
                  />
                ))}
              </div>
            </div>
          ) : null
        )}
      </div>
    )
  }

  const ids = activeCats.map((c) => c.id)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 gap-3">
          {activeCats.map((cat) => (
            <SortableTile
              key={cat.id}
              cat={cat}
              seconds={secMap[cat.id] ?? 0}
              maxSec={maxSec}
              planned={plannedIds.has(cat.id)}
              onTogglePlanned={onTogglePlanned}
              onStartSession={onStartSession}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
