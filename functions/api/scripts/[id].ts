import { buildUpdate, validateScriptInput } from '../../lib/db'
import { requireAuth } from '../../lib/auth'
import { fail, getDB, json, readBody, route, type Ctx } from '../../lib/util'

export const onRequestPut = route(async ({ request, env, params }: Ctx): Promise<Response> => {
  await requireAuth(request, env)
  const id = Number(params.id)
  if (!id) return fail(400, '无效 id')
  const b = await readBody(request)
  const v = validateScriptInput(b, false)
  if (!Object.keys(v).length) return fail(400, '没有需要更新的字段')
  const db = getDB(env)
  if (v.category_id !== undefined) {
    const cat = await db.prepare('SELECT id FROM categories WHERE id = ?1').bind(v.category_id).first()
    if (!cat) return fail(400, '所属分类不存在')
  }
  const { sql, binds } = buildUpdate(
    'scripts',
    'flags' in v ? { ...v, flags: JSON.stringify(v.flags ?? []) } : v,
  )
  const r = await db
    .prepare(sql)
    .bind(...binds, id)
    .run()
  if (!r.meta.changes) return fail(404, '脚本不存在')
  return json({ ok: true })
})

export const onRequestDelete = route(async ({ request, env, params }: Ctx): Promise<Response> => {
  await requireAuth(request, env)
  const id = Number(params.id)
  if (!id) return fail(400, '无效 id')
  const r = await getDB(env)
    .prepare('DELETE FROM scripts WHERE id = ?1')
    .bind(id)
    .run()
  if (!r.meta.changes) return fail(404, '脚本不存在')
  return json({ ok: true })
})
