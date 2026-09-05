// 云端 API 客户端（Cloudflare Pages Functions）
import { normalizeDataset, type Category, type Dataset, type ScriptEntry, type ToolSettings } from '../../shared/types'

export interface CloudHealth {
  cloudReady: boolean
  protected: boolean
}

const TOKEN_KEY = 'spellbook.token'

function authHeader(): Record<string, string> {
  const t = localStorage.getItem(TOKEN_KEY)
  return t ? { authorization: `Bearer ${t}` } : {}
}

async function req(path: string, init: RequestInit = {}, timeoutMs = 10000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const headers: Record<string, string> = { ...authHeader(), ...(init.headers as Record<string, string> | undefined) }
    if (init.body != null) headers['content-type'] = 'application/json'
    return await fetch(path, { ...init, headers, signal: ctrl.signal })
  } finally {
    clearTimeout(timer)
  }
}

async function errMsg(r: Response): Promise<string> {
  try {
    const j = (await r.json()) as { error?: string }
    return j.error || `HTTP ${r.status}`
  } catch {
    return `HTTP ${r.status}`
  }
}

async function okJson<T>(r: Response): Promise<T> {
  if (!r.ok) throw new Error(await errMsg(r))
  return (await r.json()) as T
}

export async function getHealth(): Promise<CloudHealth | null> {
  try {
    const r = await req('/api/health', {}, 3000)
    if (!r.ok) return null
    return (await r.json()) as CloudHealth
  } catch {
    return null
  }
}

export async function login(password: string): Promise<string> {
  const r = await req('/api/login', { method: 'POST', body: JSON.stringify({ password }) })
  const j = await okJson<{ token: string }>(r)
  localStorage.setItem(TOKEN_KEY, j.token)
  return j.token
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export async function getData(): Promise<Dataset> {
  return normalizeDataset(await okJson(await req('/api/data')))
}

export async function putData(data: Dataset): Promise<Dataset> {
  return normalizeDataset(await okJson(await req('/api/data', { method: 'PUT', body: JSON.stringify(data) })))
}

export async function postScript(s: ScriptEntry): Promise<void> {
  await okJson(await req('/api/scripts', { method: 'POST', body: JSON.stringify(s) }))
}

export async function putScript(s: ScriptEntry): Promise<void> {
  await okJson(await req(`/api/scripts/${s.id}`, { method: 'PUT', body: JSON.stringify(s) }))
}

export async function delScript(id: number): Promise<void> {
  await okJson(await req(`/api/scripts/${id}`, { method: 'DELETE' }))
}

export async function postCategory(c: Category): Promise<void> {
  await okJson(await req('/api/categories', { method: 'POST', body: JSON.stringify(c) }))
}

export async function putCategory(c: Category): Promise<void> {
  await okJson(await req(`/api/categories/${c.id}`, { method: 'PUT', body: JSON.stringify(c) }))
}

export async function delCategory(id: number): Promise<void> {
  await okJson(await req(`/api/categories/${id}`, { method: 'DELETE' }))
}

export async function saveSettings(s: ToolSettings): Promise<void> {
  await okJson(await req('/api/settings', { method: 'POST', body: JSON.stringify(s) }))
}
