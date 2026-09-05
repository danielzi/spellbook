// spellbook 数据结构 —— 前端、后端 Functions、种子数据共用

export type EntryType = 'remote' | 'snippet'

/** root=需要root权限 danger=危险操作需二次确认 deprecated=已停更/需注意 */
export type EntryFlag = 'root' | 'danger' | 'deprecated'

export interface Category {
  id: number
  name: string
  icon: string
  sort: number
}

export interface ScriptEntry {
  id: number
  category_id: number
  name: string
  description: string
  /** remote: 单行远程命令；snippet: 多行内置脚本 */
  command: string
  entry_type: EntryType
  flags: string[]
  enabled: boolean
  sort: number
  updated_at?: string
}

export interface ToolSettings {
  title: string
  version: string
}

export interface Dataset {
  categories: Category[]
  scripts: ScriptEntry[]
  settings: ToolSettings
}

export const FLAG_LABELS: Record<string, string> = {
  root: '🔑 需 root',
  danger: '⚠️ 危险',
  deprecated: '💤 已停更',
}

export function emptyDataset(): Dataset {
  return { categories: [], scripts: [], settings: { title: 'spellbook', version: '1.0.0' } }
}

export function normalizeDataset(raw: unknown): Dataset {
  const d = (raw || {}) as Partial<Dataset>
  const categories: Category[] = Array.isArray(d.categories)
    ? d.categories
        .filter((c) => c && typeof c === 'object')
        .map((c) => ({
          id: Number(c.id) || 0,
          name: String(c.name ?? ''),
          icon: String(c.icon ?? ''),
          sort: Number(c.sort) || 0,
        }))
    : []
  const scripts: ScriptEntry[] = Array.isArray(d.scripts)
    ? d.scripts
        .filter((s) => s && typeof s === 'object')
        .map((s) => ({
          id: Number(s.id) || 0,
          category_id: Number(s.category_id) || 0,
          name: String(s.name ?? ''),
          description: String(s.description ?? ''),
          command: String(s.command ?? ''),
          entry_type: s.entry_type === 'snippet' ? 'snippet' : 'remote',
          flags: Array.isArray(s.flags) ? s.flags.map(String) : [],
          enabled: s.enabled !== false,
          sort: Number(s.sort) || 0,
          updated_at: s.updated_at ? String(s.updated_at) : undefined,
        }))
    : []
  const settings: ToolSettings = {
    title: String(d.settings?.title ?? 'spellbook') || 'spellbook',
    version: String(d.settings?.version ?? '1.0.0') || '1.0.0',
  }
  return { categories, scripts, settings }
}
