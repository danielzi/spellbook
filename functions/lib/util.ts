// 通用工具与环境类型

export interface Env {
  DB?: D1Database
  ADMIN_PASSWORD?: string
}

export interface Ctx {
  request: Request
  env: Env
  params: Record<string, string | undefined>
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  })
}

export function fail(status: number, message: string): Response {
  return json({ error: message }, status)
}

export async function readBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const b = await request.json()
    return b && typeof b === 'object' ? (b as Record<string, unknown>) : {}
  } catch {
    throw new HttpError(400, '请求体不是合法 JSON')
  }
}

export function getDB(env: Env): D1Database {
  if (!env.DB) throw new HttpError(503, '云端数据库不可用（未绑定 D1）')
  return env.DB
}

type Handler = (ctx: Ctx) => Promise<Response>

/** 路由包装：统一把 HttpError 转成 JSON，避免泄露堆栈 */
export function route(fn: Handler): Handler {
  return async (ctx) => {
    try {
      return await fn(ctx)
    } catch (e) {
      if (e instanceof HttpError) return fail(e.status, e.message)
      console.error(e)
      return fail(500, '服务端内部错误')
    }
  }
}
