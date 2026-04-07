import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, getSettings, updateSettings, saveCategory, deleteCategory } from '../lib/db'
import type { Category, PyramidTier } from '../lib/types'
import { getCategoryColors, getTierColors, getTierLabel } from '../lib/utils'
import { DEFAULT_CATEGORIES } from '../lib/defaults'

const COLOR_OPTIONS = [
  { key: 'act', label: 'Clay' },
  { key: 'forage', label: 'Sage' },
  { key: 'think', label: 'Teal' },
  { key: 'connect', label: 'Gold' },
  { key: 'tidy', label: 'Stone' },
  { key: 'digest', label: 'Plum' },
  { key: 'build', label: 'Terracotta' },
  { key: 'write', label: 'Indigo' },
  { key: 'tend', label: 'Moss' },
  { key: 'engage', label: 'Amber' },
  { key: 'process', label: 'Slate' },
  { key: 'admin', label: 'Gray' },
]

const TIER_OPTIONS: PyramidTier[] = ['foundation', 'building', 'treat']

const EMOJI_QUICK_PICK = [
  '🎯',
  '🌿',
  '🧠',
  '💬',
  '🧹',
  '🫖',
  '✏️',
  '📋',
  '🎨',
  '🏃',
  '💡',
  '🔧',
  '📚',
  '🎭',
  '🌱',
  '⚡',
  '🧘',
  '🎵',
]

export default function SettingsView() {
  const categories = useLiveQuery(() =>
    db.categories.orderBy('sortOrder').toArray()
  )
  const settings = useLiveQuery(() => getSettings())
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isNewCategory, setIsNewCategory] = useState(false)

  if (!categories || !settings) {
    return <div className="pt-8 text-center text-warm-muted">Loading…</div>
  }

  const handleDurationChange = async (
    key: 'defaultWorkMinutes' | 'defaultDigestMinutes',
    value: number
  ) => {
    await updateSettings({ [key]: value })
  }

  const handleResetDefaults = async () => {
    await db.categories.clear()
    await db.categories.bulkAdd(DEFAULT_CATEGORIES)
  }

  return (
    <div className="space-y-8 pt-2 pb-8 animate-fadeIn">
      <section>
        <h2 className="text-sm font-medium text-warm-muted uppercase tracking-wide mb-3">
          Default Durations
        </h2>
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Work session</span>
            <select
              value={settings.defaultWorkMinutes}
              onChange={(e) =>
                handleDurationChange('defaultWorkMinutes', Number(e.target.value))
              }
              className="bg-warm-white rounded-lg px-3 py-1.5 text-sm focus:outline-none"
            >
              {[15, 25, 30, 45, 60, 90, 120].map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Digest phase</span>
            <select
              value={settings.defaultDigestMinutes}
              onChange={(e) =>
                handleDurationChange(
                  'defaultDigestMinutes',
                  Number(e.target.value)
                )
              }
              className="bg-warm-white rounded-lg px-3 py-1.5 text-sm focus:outline-none"
            >
              {[5, 10, 15, 20].map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section>
        <p className="text-xs text-warm-muted mb-3 leading-relaxed">
          Saved categories appear on the <strong className="font-medium text-warm-text">Map</strong>{' '}
          automatically. Reorder tiles there by dragging the{' '}
          <span className="font-mono text-[10px]">⋮⋮</span> handle (Tiles view). Use{' '}
          <strong className="font-medium text-warm-text">Hide from Map</strong> below to remove
          one without deleting it.
        </p>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-warm-muted uppercase tracking-wide">
            Categories
          </h2>
          <button
            onClick={() => {
              setIsNewCategory(true)
              setEditingCategory({
                id: crypto.randomUUID().slice(0, 8),
                name: '',
                emoji: '📌',
                colorKey: 'act',
                tier: 'building',
                intentionPrompts: ['What are you working on?'],
                debriefPrompts: ['How did it go?'],
                isDefault: false,
                archived: false,
                sortOrder: categories.length,
              })
            }}
            className="btn-ghost text-xs"
          >
            + Add
          </button>
        </div>

        <div className="space-y-2">
          {categories.map((cat) => {
            const colors = getCategoryColors(cat.colorKey)
            return (
              <div
                key={cat.id}
                className={`card flex items-center gap-3 cursor-pointer hover:border-warm-muted/30 ${
                  cat.archived ? 'opacity-60' : ''
                }`}
                onClick={() => {
                  setEditingCategory(cat)
                  setIsNewCategory(false)
                }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
                  style={{ backgroundColor: colors.bg }}
                >
                  {cat.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium block truncate">{cat.name}</span>
                  {cat.archived && (
                    <span className="text-[10px] text-warm-light uppercase tracking-wide">
                      Hidden from Map
                    </span>
                  )}
                </div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-warm-light"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </div>
            )
          })}
        </div>
      </section>

      {editingCategory && (
        <CategoryEditor
          key={editingCategory.id}
          category={editingCategory}
          isNew={isNewCategory}
          onSave={async (cat) => {
            await saveCategory(cat)
            setEditingCategory(null)
            setIsNewCategory(false)
          }}
          onDelete={async (id) => {
            await deleteCategory(id)
            setEditingCategory(null)
          }}
          onCancel={() => {
            setEditingCategory(null)
            setIsNewCategory(false)
          }}
        />
      )}

      <section className="pt-4">
        <button
          onClick={handleResetDefaults}
          className="btn-ghost text-xs text-warm-light w-full"
        >
          Reset categories to defaults
        </button>
      </section>
    </div>
  )
}

function CategoryEditor({
  category,
  isNew,
  onSave,
  onDelete,
  onCancel,
}: {
  category: Category
  isNew: boolean
  onSave: (cat: Category) => void
  onDelete: (id: string) => void
  onCancel: () => void
}) {
  const [cat, setCat] = useState(category)

  useEffect(() => {
    setCat(category)
  }, [category])

  return (
    <div className="fixed inset-0 bg-warm-text/30 flex items-end sm:items-center justify-center z-50">
      <div className="bg-cream rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg">
            {isNew ? 'New Category' : 'Edit Category'}
          </h3>
          <button onClick={onCancel} className="text-warm-muted p-1 text-lg">
            ✕
          </button>
        </div>

        <div>
          <label className="text-sm text-warm-muted block mb-2">Emoji</label>
          <p className="text-[11px] text-warm-light mb-2">
            Tap one below, or paste / type in the box (works with your emoji keyboard).
          </p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {EMOJI_QUICK_PICK.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setCat({ ...cat, emoji: e })}
                className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center border transition-all
                  ${
                    cat.emoji === e
                      ? 'border-warm-text bg-warm-white shadow-sm'
                      : 'border-warm-border/60 bg-warm-white/70 hover:border-warm-muted'
                  }`}
              >
                {e}
              </button>
            ))}
          </div>
          <input
            value={cat.emoji}
            onChange={(e) => setCat({ ...cat, emoji: e.target.value })}
            className="w-full max-w-[200px] bg-warm-white rounded-lg px-3 py-2.5 text-2xl text-center focus:outline-none focus:ring-2 focus:ring-warm-border"
            maxLength={16}
            placeholder="📌"
            aria-label="Category emoji"
          />
        </div>

        <div className="grid grid-cols-[auto_1fr] gap-3 items-center">

          <label className="text-sm text-warm-muted self-start pt-2">Name</label>
          <input
            value={cat.name}
            onChange={(e) => setCat({ ...cat, name: e.target.value })}
            className="bg-warm-white rounded-lg px-3 py-2 text-sm focus:outline-none"
            placeholder="Category name"
          />

          <label className="text-sm text-warm-muted">Color</label>
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map((opt) => {
              const colors = getCategoryColors(opt.key)
              return (
                <button
                  key={opt.key}
                  onClick={() => setCat({ ...cat, colorKey: opt.key })}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    cat.colorKey === opt.key
                      ? 'border-warm-text scale-110'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: colors.accent }}
                  title={opt.label}
                />
              )
            })}
          </div>

          <label className="text-sm text-warm-muted">Pyramid tier</label>
          <div className="flex gap-2">
            {TIER_OPTIONS.map((tier) => {
              const tc = getTierColors(tier)
              return (
                <button
                  key={tier}
                  onClick={() => setCat({ ...cat, tier })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    cat.tier === tier
                      ? 'ring-2 ring-warm-text/30'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: tc.bg, color: tc.text }}
                >
                  {getTierLabel(tier)}
                </button>
              )
            })}
          </div>

          <label className="text-sm text-warm-muted self-start pt-1">Map</label>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-warm-text">
            <input
              type="checkbox"
              checked={!cat.archived}
              onChange={(e) =>
                setCat({ ...cat, archived: !e.target.checked })
              }
              className="rounded border-warm-border w-4 h-4 accent-warm-text shrink-0"
            />
            Show on Map (uncheck to hide without deleting)
          </label>
        </div>

        <div>
          <label className="text-sm text-warm-muted block mb-1">
            Intention prompts (one per line)
          </label>
          <textarea
            value={cat.intentionPrompts.join('\n')}
            onChange={(e) =>
              setCat({
                ...cat,
                intentionPrompts: e.target.value.split('\n').filter(Boolean),
              })
            }
            className="w-full bg-warm-white rounded-xl p-3 text-sm resize-none focus:outline-none min-h-[80px]"
          />
        </div>

        <div>
          <label className="text-sm text-warm-muted block mb-1">
            Debrief prompts (one per line)
          </label>
          <textarea
            value={cat.debriefPrompts.join('\n')}
            onChange={(e) =>
              setCat({
                ...cat,
                debriefPrompts: e.target.value.split('\n').filter(Boolean),
              })
            }
            className="w-full bg-warm-white rounded-xl p-3 text-sm resize-none focus:outline-none min-h-[80px]"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => onSave(cat)}
            disabled={!cat.name.trim()}
            className="btn-primary flex-1 disabled:opacity-40"
          >
            {isNew ? 'Add category' : 'Save'}
          </button>
          {!isNew && !cat.isDefault && (
            <button
              onClick={() => onDelete(cat.id)}
              className="px-4 py-2 rounded-xl text-sm text-red-400 hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
