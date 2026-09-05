import { checkPassword, issueToken } from '../lib/auth'
import { fail, json, readBody, route, type Ctx } from '../lib/util'

export const onRequestPost = route(async ({ request, env }: Ctx): Promise<Response> => {
  if (!env.DB) return fail(503, '云端数据库不可用（未绑定 D1）')
  if (!env.ADMIN_PASSWORD) return fail(503, '服务端未配置 ADMIN_PASSWORD，登录不可用')
  const body = await readBody(request)
  if (!(await checkPassword(env, body.password))) return fail(401, '密码错误')
  return json({ token: await issueToken(env), expiresIn: 7 * 24 * 3600 })
})
