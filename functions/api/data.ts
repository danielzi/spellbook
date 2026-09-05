import { normalizeDataset } from '../../shared/types'
import { getDataset, replaceAll } from '../lib/db'
import { requireAuth } from '../lib/auth'
import { json, readBody, route, type Ctx } from '../lib/util'

/** 读取整库（公开） */
export const onRequestGet = route(async ({ env }: Ctx): Promise<Response> => {
  return json(await getDataset(env))
})

/** 整库替换（需鉴权），用于导入/推送 */
export const onRequestPut = route(async ({ request, env }: Ctx): Promise<Response> => {
  await requireAuth(request, env)
  const body = await readBody(request)
  await replaceAll(env, normalizeDataset(body))
  return json(await getDataset(env))
})
