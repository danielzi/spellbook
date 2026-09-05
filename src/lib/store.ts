// 全局状态：双模式存储（localStorage 本地 / D1 云端），统一 CRUD 入口
import { reactive } from 'vue'
import { normalizeDataset, type Category, type Dataset, type ScriptEntry, type ToolSettings } from '../../shared/types'
import seedJson from '../../seed/default.json'
import * as api from './api'

const LS_DATA = 'spellbook.data.v1'
const LS_MODE = 'spellbook.mode'

const seedData = normalizeDataset(seedJson)

export const store = reactive({
  ready: false,
  mode: 'local' as 'local' | 'cloud',
  data: normalizeDataset(null) as Dataset,
  health: null as api.CloudHealth | null,
  token: !!localStorage.getItem('spellbook.token'),
  toast: null as { msg: string; type: 'ok' | 'err' } | null,
})

let toastTimer: ReturnType<typeof setTimeout> | undefined
export function toast(msg: string, type: 'ok' | 'err' = 'ok') {
  store.toast = { msg, type }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (store.toast = null), 2600)
}

function loadLocal(): Dataset {
  try {
    const raw = localStorage.getItem(LS_DATA)
    if (raw) return normalizeDataset(JSON.parse(raw))
  } catch {
    // 数据损坏时回退种子
  }
  return normalizeDataset(JSON.parse(JSON.stringify(seedData)))
}

function persistLocal() {
  localStorage.setItem(LS_DATA, JSON.stringify(store.data))
}

async function reload() {
  store.data = store.mode === 'cloud' ? await api.getData() : loadLocal()
}

export async function init() {
  store.health = await api.getHealth()
  const saved = localStorage.getItem(LS_MODE)
  store.mode = saved === 'cloud' && store.health?.cloudReady ? 'cloud' : 'local'
  try {
    await reload()
  } catch (e) {
    toast(e instanceof Error ? e.message : '数据加载失败，已回退本地模式', 'err')
    store.mode = 'local'
    store.data = loadLocal()
  }
  store.ready = true
}

export async function switchMode(mode: 'local' | 'cloud') {
  if (mode === store.mode) return
  if (mode === 'cloud') {
    if (!store.health?.cloudReady) throw new Error('云端服务不可用（未检测到后端 API）')
    if (store.health.protected && !store.token) throw new Error('云端已启用密码保护，请先登录')
    store.data = await api.getData()
  } else {
    store.data = loadLocal()
  }
  store.mode = mode
  localStorage.setItem(LS_MODE, mode)
  toast(mode === 'cloud' ? '已切换到云端模式' : '已切换到本地模式')
}

export async function login(password: string) {
  await api.login(password)
  store.token = true
  toast('登录成功')
}

export function logout() {
  api.logout()
  store.token = false
  toast('已退出登录')
}

function nextLocalId(items: Array<{ id: number }>): number {
  return items.reduce((m, x) => Math.max(m, x.id), 0) + 1
}

export async function saveScript(entry: ScriptEntry) {
  const e: ScriptEntry = { ...entry, updated_at: new Date().toISOString() }
  if (store.mode === 'local') {
    if (e.id > 0) {
      const i = store.data.scripts.findIndex((x) => x.id === e.id)
      if (i >= 0) store.data.scripts[i] = e
    } else {
      e.id = nextLocalId(store.data.scripts)
      store.data.scripts.push(e)
    }
    persistLocal()
    toast('已保存（本地）')
  } else {
    if (e.id > 0) await api.putScript(e)
    else await api.postScript(e)
    await reload()
    toast('已保存（云端）')
  }
}

export async function deleteScript(id: number) {
  if (store.mode === 'local') {
    store.data.scripts = store.data.scripts.filter((x) => x.id !== id)
    persistLocal()
    toast('已删除（本地）')
  } else {
    await api.delScript(id)
    await reload()
    toast('已删除（云端）')
  }
}

export async function saveCategory(c: Category) {
  if (store.mode === 'local') {
    if (c.id > 0) {
      const i = store.data.categories.findIndex((x) => x.id === c.id)
      if (i >= 0) store.data.categories[i] = c
    } else {
      c.id = nextLocalId(store.data.categories)
      store.data.categories.push(c)
    }
    persistLocal()
    toast('已保存（本地）')
  } else {
    if (c.id > 0) await api.putCategory(c)
    else await api.postCategory(c)
    await reload()
    toast('已保存（云端）')
  }
}

export async function deleteCategory(id: number) {
  if (store.mode === 'local') {
    store.data.categories = store.data.categories.filter((x) => x.id !== id)
    store.data.scripts = store.data.scripts.filter((x) => x.category_id !== id)
    persistLocal()
    toast('分类及其中脚本已删除')
  } else {
    await api.delCategory(id)
    await reload()
    toast('分类及其中脚本已删除')
  }
}

export async function saveSettings(s: ToolSettings) {
  if (store.mode === 'local') {
    store.data.settings = { ...s }
    persistLocal()
    toast('已保存（本地）')
  } else {
    await api.saveSettings(s)
    await reload()
    toast('已保存（云端）')
  }
}

export async function importJson(text: string, label = '导入') {
  const data = normalizeDataset(JSON.parse(text))
  if (!data.categories.length && !data.scripts.length) throw new Error('文件里没有分类或脚本数据')
  if (store.mode === 'local') {
    store.data = data
    persistLocal()
  } else {
    store.data = await api.putData(data)
  }
  toast(`${label}成功（${store.mode === 'cloud' ? '云端' : '本地'}）`)
}

export async function importSeed() {
  await importJson(JSON.stringify(seedData), '恢复初始合集')
}

export function exportJson(): string {
  return JSON.stringify(store.data, null, 2)
}

/** 把本地数据整体推送到云端（覆盖云端） */
export async function pushLocalToCloud() {
  if (!store.health?.cloudReady) throw new Error('云端服务不可用')
  if (!store.token) throw new Error('请先登录云端')
  store.data = await api.putData(loadLocal())
  toast('本地数据已推送到云端')
}

export function clearLocal() {
  localStorage.removeItem(LS_DATA)
  store.data = loadLocal()
}

// ---------- 视图辅助 ----------
export function sortedCategories(): Category[] {
  return [...store.data.categories].sort((a, b) => a.sort - b.sort || a.id - b.id)
}

export function scriptsOf(catId: number): ScriptEntry[] {
  return store.data.scripts
    .filter((s) => s.category_id === catId)
    .sort((a, b) => a.sort - b.sort || a.id - b.id)
}
