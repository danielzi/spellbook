import { validateScriptInput } from '../../lib/db'
import { requireAuth } from '../../lib/auth'
import { fail, getDB, json, readBody, route, type Ctx } from '../../lib/util'

export const onRequestPost = route(async ({ request, env }: Ctx): Promise<Response> => {
  await requireAuth(request, env)
  const b = await readBody(request)
  const v = validateScriptInput(b, true)
  const db = getDB(env)
  const cat = await db
    .prepare('SELECT id FROM categories WHERE id = ?1')
    .bind(v.category_id)
    .first()
  if (!cat) return fail(400, '所属分类不存在')
  const r = await db
    .prepare(
      'INSERT INTO scripts (category_id, name, description, command, entry_type, flags, enabled, sort) VALUES (?1,?2,?3,?4,?5,?6,?7,?8)',
    )
    .bind(
      v.category_id,
      v.name,
      v.description ?? '',
      v.command,
      v.entry_type ?? 'remote',
      JSON.stringify(v.flags ?? []),
      v.enabled === 0 ? 0 : 1,
      v.sort ?? 0,
    )
    .run()
  return json({ id: r.meta.last_row_id }, 201)
})
