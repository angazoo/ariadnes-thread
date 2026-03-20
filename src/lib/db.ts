import Dexie, { type Table } from 'dexie'
import type {
  Category,
  Session,
  AppSettings,
  DayPlan,
  EveningReflection,
  PyramidTier,
} from './types'
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from './defaults'

class AriadneDB extends Dexie {
  categories!: Table<Category, string>
  sessions!: Table<Session, number>
  settings!: Table<AppSettings, number>
  dayPlans!: Table<DayPlan, string>
  eveningReflections!: Table<EveningReflection, string>

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
