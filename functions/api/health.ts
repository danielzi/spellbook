import { json, route, type Ctx } from '../lib/util'

export const onRequestGet = route(async ({ env }: Ctx): Promise<Response> => {
  return json({
    ok: true,
    cloudReady: !!env.DB,
    protected: !!env.ADMIN_PASSWORD,
  })
})
