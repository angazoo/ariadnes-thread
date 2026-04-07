import Dexie, { type Table } from 'dexie'
import type {
  Category,
  Session,
  AppSettings,
  DayPlan,
  EveningReflection,
  AdventureLog,
  PyramidTier,
} from './types'
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from './defaults'

const LEGACY_ARCHIVE_IDS = [
  'build',
  'write',
  'tend',
  'engage',
  'process',
  'admin',
]

class AriadneDB extends Dexie {
  categories!: Table<Category, string>
  sessions!: Table<Session, number>
  settings!: Table<AppSettings, number>
  dayPlans!: Table<DayPlan, string>
  eveningReflections!: Table<EveningReflection, string>
  adventureLogs!: Table<AdventureLog, string>

  constructor() {
    super('AriadneDB')

    this.version(1).stores({
      categories: 'id, sortOrder',
      sessions: '++id, date, categoryId, startedAt',
      settings: 'id',
    })

    this.version(2)
      .stores({
        categories: 'id, sortOrder, tier',
        sessions: '++id, date, categoryId, startedAt',
        settings: 'id',
        dayPlans: 'date',
        eveningReflections: 'date',
      })
      .upgrade(async (tx) => {
        const tierMap: Record<string, PyramidTier> = {
          forage: 'treat',
          build: 'building',
          write: 'building',
          engage: 'building',
          digest: 'foundation',
          admin: 'foundation',
        }

        await tx
          .table('categories')
          .toCollection()
          .modify((cat: Record<string, unknown>) => {
            if (!cat.tier) cat.tier = tierMap[cat.id as string] ?? 'building'
            if (cat.archived === undefined) cat.archived = false
          })

        const newDefaults = DEFAULT_CATEGORIES.filter(
          (c) => c.id === 'tend' || c.id === 'process'
        )
        for (const cat of newDefaults) {
          const existing = await tx.table('categories').get(cat.id)
          if (!existing) {
            await tx.table('categories').add(cat)
          }
        }
      })

    this.version(3)
      .stores({
        categories: 'id, sortOrder, tier',
        sessions: '++id, date, categoryId, startedAt',
        settings: 'id',
        dayPlans: 'date',
        eveningReflections: 'date',
      })
      .upgrade(async (tx) => {
        const table = tx.table('categories')
        for (const id of LEGACY_ARCHIVE_IDS) {
          const row = await table.get(id)
          if (row) await table.update(id, { archived: true })
        }
        for (const cat of DEFAULT_CATEGORIES) {
          const existing = (await table.get(cat.id)) as Category | undefined
          if (!existing) {
            await table.add(cat)
          } else {
            await table.put({
              ...existing,
              name: cat.name,
              emoji: cat.emoji,
              colorKey: cat.colorKey,
              tier: cat.tier,
              intentionPrompts: cat.intentionPrompts,
              debriefPrompts: cat.debriefPrompts,
              isDefault: cat.isDefault,
            })
          }
        }
      })

    this.version(4).stores({
      categories: 'id, sortOrder, tier',
      sessions: '++id, date, categoryId, startedAt',
      settings: 'id',
      dayPlans: 'date',
      eveningReflections: 'date',
      adventureLogs: 'date',
    })
  }
}

export const db = new AriadneDB()

db.on('populate', async () => {
  await db.categories.bulkAdd(DEFAULT_CATEGORIES)
  await db.settings.add(DEFAULT_SETTINGS)
})

export async function getSettings(): Promise<AppSettings> {
  const settings = await db.settings.get(1)
  return settings ?? DEFAULT_SETTINGS
}

export async function updateSettings(
  updates: Partial<AppSettings>
): Promise<void> {
  await db.settings.update(1, updates)
}

export async function saveCategory(category: Category): Promise<void> {
  await db.categories.put(category)
}

export async function deleteCategory(id: string): Promise<void> {
  await db.categories.delete(id)
}

export async function saveSession(session: Session): Promise<number> {
  const id = await db.sessions.add(session)
  return id as number
}

export async function saveDayPlan(plan: DayPlan): Promise<void> {
  await db.dayPlans.put(plan)
}

export async function saveEveningReflection(
  reflection: EveningReflection
): Promise<void> {
  await db.eveningReflections.put(reflection)
}

export async function saveAdventureLog(
  partial: Omit<AdventureLog, 'createdAt' | 'updatedAt'> &
    Partial<Pick<AdventureLog, 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const existing = await db.adventureLogs.get(partial.date)
  const now = Date.now()
  await db.adventureLogs.put({
    ...existing,
    ...partial,
    date: partial.date,
    createdAt: existing?.createdAt ?? partial.createdAt ?? now,
    updatedAt: now,
  })
}

/** Persist new sort order for categories (The Map tile order). */
export async function reorderCategories(orderedIds: string[]): Promise<void> {
  await db.transaction('rw', db.categories, async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.categories.update(orderedIds[i], { sortOrder: i })
    }
  })
}
