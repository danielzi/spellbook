import { buildUpdate, validateCategoryInput } from '../../lib/db'
import { requireAuth } from '../../lib/auth'
import { fail, getDB, json, readBody, route, type Ctx } from '../../lib/util'

export const onRequestPut = route(async ({ request, env, params }: Ctx): Promise<Response> => {
  await requireAuth(request, env)
  const id = Number(params.id)
  if (!id) return fail(400, '无效 id')
  const b = await readBody(request)
  const v = validateCategoryInput(b, false)
  if (!Object.keys(v).length) return fail(400, '没有需要更新的字段')
  const { sql, binds } = buildUpdate('categories', v)
  const r = await getDB(env)
    .prepare(sql)
    .bind(...binds, id)
    .run()
  if (!r.meta.changes) return fail(404, '分类不存在')
  return json({ ok: true })
})

export const onRequestDelete = route(async ({ request, env, params }: Ctx): Promise<Response> => {
  await requireAuth(request, env)
  const id = Number(params.id)
  if (!id) return fail(400, '无效 id')
  // D1 默认启用外键约束，scripts 级联删除
  const r = await getDB(env)
    .prepare('DELETE FROM categories WHERE id = ?1')
    .bind(id)
    .run()
  if (!r.meta.changes) return fail(404, '分类不存在')
  return json({ ok: true })
})
