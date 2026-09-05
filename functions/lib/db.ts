// D1 数据访问与校验
import { normalizeDataset, type Dataset } from '../../shared/types'
import { HttpError, getDB, type Env } from './util'

const ENTRY_TYPES = ['remote', 'snippet']
const KNOWN_FLAGS = ['root', 'danger', 'deprecated']

export async function getDataset(env: Env): Promise<Dataset> {
  const db = getDB(env)
  const [cats, scrs, sets] = await Promise.all([
    db.prepare('SELECT id, name, icon, sort FROM categories ORDER BY sort, id').all(),
    db
      .prepare(
        'SELECT id, category_id, name, description, command, entry_type, flags, enabled, sort, updated_at FROM scripts ORDER BY sort, id',
      )
      .all(),
    db.prepare("SELECT key, value FROM settings WHERE key IN ('title','version')").all(),
  ])
  const settings = { title: 'spellbook', version: '1.0.0' }
  for (const row of (sets.results ?? []) as Array<{ key: string; value: string }>) {
    if (row.key === 'title' && row.value) settings.title = row.value
    if (row.key === 'version' && row.value) settings.version = row.value
  }
  return normalizeDataset({
    settings,
    categories: cats.results,
    scripts: (scrs.results ?? []).map((r) => {
      const row = r as Record<string, unknown>
      let flags: unknown = []
      try {
        flags = JSON.parse(String(row.flags || '[]'))
      } catch {
        flags = []
      }
      return { ...row, flags, enabled: Number(row.enabled) === 1 }
    }),
  })
}

/** 整库替换（导入 / 前端推送）。id 缺失的条目分配高位临时 id，避免与保留 id 冲突。 */
export async function replaceAll(env: Env, data: Dataset): Promise<void> {
  const db = getDB(env)
  const stmts: D1PreparedStatement[] = [
    db.prepare('DELETE FROM scripts'),
    db.prepare('DELETE FROM categories'),
    db.prepare('DELETE FROM settings'),
  ]
  const catMap = new Map<object, number>()
  let tmpId = 100000
  for (const c of data.categories) {
    let id = Number(c.id) || 0
    if (id <= 0) id = tmpId++
    catMap.set(c, id)
    stmts.push(
      db
        .prepare('INSERT INTO categories (id, name, icon, sort) VALUES (?1, ?2, ?3, ?4)')
        .bind(id, c.name, c.icon || '', c.sort || 0),
    )
  }
  for (const s of data.scripts) {
    const cid = catMap.get(data.categories.find((c) => c.id === s.category_id) as object)
    if (!cid) continue // 没有分类的脚本跳过
    let id = Number(s.id) || 0
    if (id <= 0) id = tmpId++
    stmts.push(
      db
        .prepare(
          'INSERT INTO scripts (id, category_id, name, description, command, entry_type, flags, enabled, sort) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)',
        )
        .bind(
          id,
          cid,
          s.name,
          s.description || '',
          s.command || '',
          s.entry_type || 'remote',
          JSON.stringify(s.flags || []),
          s.enabled === false ? 0 : 1,
          s.sort || 0,
        ),
    )
  }
  if (data.settings?.title) stmts.push(db.prepare("INSERT INTO settings (key, value) VALUES ('title', ?1)").bind(data.settings.title))
  if (data.settings?.version) stmts.push(db.prepare("INSERT INTO settings (key, value) VALUES ('version', ?1)").bind(data.settings.version))
  await db.batch(stmts)
}

export function validateCategoryInput(b: Record<string, unknown>, requireAll: boolean): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (requireAll || b.name !== undefined) {
    const name = String(b.name ?? '').trim()
    if (!name) throw new HttpError(400, '分类名称不能为空')
    out.name = name.slice(0, 50)
  }
  if (b.icon !== undefined) out.icon = String(b.icon ?? '').slice(0, 16)
  if (b.sort !== undefined) out.sort = Number(b.sort) || 0
  return out
}

export function validateScriptInput(b: Record<string, unknown>, requireAll: boolean): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (requireAll || b.name !== undefined) {
    const name = String(b.name ?? '').trim()
    if (!name) throw new HttpError(400, '脚本名称不能为空')
    out.name = name.slice(0, 100)
  }
  if (requireAll || b.category_id !== undefined) {
    const cid = Number(b.category_id)
    if (!cid) throw new HttpError(400, '必须选择所属分类')
    out.category_id = cid
  }
  if (requireAll || b.command !== undefined) {
    const command = String(b.command ?? '')
    if (!command.trim()) throw new HttpError(400, '命令不能为空')
    if (command.length > 20000) throw new HttpError(400, '命令过长（上限 20000 字符）')
    out.command = command
  }
  if (b.description !== undefined) out.description = String(b.description ?? '').slice(0, 500)
  if (b.entry_type !== undefined) {
    if (!ENTRY_TYPES.includes(String(b.entry_type))) throw new HttpError(400, 'entry_type 只能是 remote 或 snippet')
    out.entry_type = b.entry_type
  }
  if (b.flags !== undefined) {
    if (!Array.isArray(b.flags)) throw new HttpError(400, 'flags 必须是数组')
    out.flags = b.flags.map(String).filter((f) => KNOWN_FLAGS.includes(f))
  }
  if (b.enabled !== undefined) out.enabled = b.enabled === false ? 0 : 1
  if (b.sort !== undefined) out.sort = Number(b.sort) || 0
  return out
}

export function buildUpdate(table: string, v: Record<string, unknown>): { sql: string; binds: unknown[] } {
  const sets: string[] = []
  const binds: unknown[] = []
  let k = 1
  for (const [key, val] of Object.entries(v)) {
    sets.push(`${key} = ?${k}`)
    binds.push(val)
    k++
  }
  return { sql: `UPDATE ${table} SET ${sets.join(', ')} WHERE id = ?${k}`, binds }
}
