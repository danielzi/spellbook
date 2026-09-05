import { validateCategoryInput } from '../../lib/db'
import { requireAuth } from '../../lib/auth'
import { getDB, json, readBody, route, type Ctx } from '../../lib/util'

export const onRequestPost = route(async ({ request, env }: Ctx): Promise<Response> => {
  await requireAuth(request, env)
  const b = await readBody(request)
  const v = validateCategoryInput(b, true)
  const r = await getDB(env)
    .prepare('INSERT INTO categories (name, icon, sort) VALUES (?1, ?2, ?3)')
    .bind(v.name, v.icon ?? '', v.sort ?? 0)
    .run()
  return json({ id: r.meta.last_row_id }, 201)
})
