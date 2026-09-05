// 管理端鉴权：ADMIN_PASSWORD 环境变量 + HMAC 签名 token（7 天有效）
import { HttpError, type Env } from './util'

const TOKEN_TTL = 7 * 24 * 3600

async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let r = 0
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return r === 0
}

/** 密码比对：双侧先 HMAC 再比较，避免时序侧信道 */
export async function checkPassword(env: Env, password: unknown): Promise<boolean> {
  if (!env.ADMIN_PASSWORD || typeof password !== 'string' || !password) return false
  const a = await hmacHex(password, 'spellbook-login')
  const b = await hmacHex(env.ADMIN_PASSWORD, 'spellbook-login')
  return safeEqual(a, b)
}

export async function issueToken(env: Env): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL
  const sig = await hmacHex(env.ADMIN_PASSWORD + ':spellbook', String(exp))
  return `${exp}.${sig}`
}

export async function verifyToken(env: Env, token: string | null): Promise<boolean> {
  if (!env.ADMIN_PASSWORD || !token) return false
  const m = token.match(/^(\d+)\.([0-9a-f]{64})$/)
  if (!m) return false
  if (Number(m[1]) <= Math.floor(Date.now() / 1000)) return false
  const expect = await hmacHex(env.ADMIN_PASSWORD + ':spellbook', m[1])
  return safeEqual(expect, m[2])
}

/** 所有写操作（增删改）必须通过；查看与 /spellbook.sh 拉取不受限 */
export async function requireAuth(request: Request, env: Env): Promise<void> {
  if (!env.DB) throw new HttpError(503, '云端数据库不可用（未绑定 D1）')
  if (!env.ADMIN_PASSWORD) throw new HttpError(503, '服务端未配置 ADMIN_PASSWORD，写接口已禁用')
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || null
  if (!(await verifyToken(env, token))) throw new HttpError(401, '未登录或登录已过期')
}
