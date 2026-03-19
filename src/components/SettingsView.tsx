import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, getSettings, updateSettings, saveCategory, deleteCategory } from '../lib/db'
import type { Category } from '../lib/types'
import { getCategoryColors } from '../lib/utils'
import { DEFAULT_CATEGORIES } from '../lib/defaults'

const COLOR_OPTIONS = [
  { key: 'forage', label: 'Sage' },
  { key: 'build', label: 'Terracotta' },
  { key: 'write', label: 'Indigo' },
  { key: 'engage', label: 'Gold' },
  { key: 'digest', label: 'Plum' },
  { key: 'admin', label: 'Gray' },
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
                colorKey: 'admin',
                intentionPrompts: ['What are you working on?'],
                debriefPrompts: ['How did it go?'],
                isDefault: false,
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
                className="card flex items-center gap-3 cursor-pointer hover:border-warm-muted/30"
                onClick={() => {
                  setEditingCategory(cat)
                  setIsNewCategory(false)
                }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: colors.bg }}
                >
                  {cat.emoji}
                </div>
                <span className="text-sm font-medium flex-1">{cat.name}</span>
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

        <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
          <label className="text-sm text-warm-muted">Emoji</label>
          <input
            value={cat.emoji}
            onChange={(e) => setCat({ ...cat, emoji: e.target.value })}
            className="bg-warm-white rounded-lg px-3 py-2 text-center w-16 focus:outline-none"
            maxLength={4}
          />

          <label className="text-sm text-warm-muted">Name</label>
          <input
            value={cat.name}
            onChange={(e) => setCat({ ...cat, name: e.target.value })}
            className="bg-warm-white rounded-lg px-3 py-2 text-sm focus:outline-none"
            placeholder="Category name"
          />

          <label className="text-sm text-warm-muted">Color</label>
          <div className="flex gap-2">
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
