import { requireAuth } from '../lib/auth'
import { getDB, json, readBody, route, type Ctx } from '../lib/util'

const UPsert = "INSERT INTO settings (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value = excluded.value"

export const onRequestPost = route(async ({ request, env }: Ctx): Promise<Response> => {
  await requireAuth(request, env)
  const b = await readBody(request)
  const title = String(b.title ?? '').trim()
  const version = String(b.version ?? '').trim()
  const db = getDB(env)
  const stmts: D1PreparedStatement[] = []
  if (title) stmts.push(db.prepare(UPsert).bind('title', title.slice(0, 50)))
  if (version) stmts.push(db.prepare(UPsert).bind('version', version.slice(0, 20)))
  if (stmts.length) await db.batch(stmts)
  return json({ ok: true })
})
