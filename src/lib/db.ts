import Dexie, { type Table } from 'dexie'
import type { Category, Session, AppSettings } from './types'
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from './defaults'

class AriadneDB extends Dexie {
  categories!: Table<Category, string>
  sessions!: Table<Session, number>
  settings!: Table<AppSettings, number>

  constructor() {
    super('AriadneDB')
    this.version(1).stores({
      categories: 'id, sortOrder',
      sessions: '++id, date, categoryId, startedAt',
      settings: 'id',
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
