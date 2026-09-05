// 工具箱脚本渲染器 —— 由数据集 + 模板生成单文件 Bash 工具箱。
// 同时被 CF Pages Functions（Text 模块导入模板）与前端（?raw 导入模板）复用。
import type { Dataset } from './types'

/** UTF-8 安全的 base64（Workers / 浏览器 / Node 通用） */
export function b64encode(s: string): string {
  const bytes = new TextEncoder().encode(s)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}

function oneline(s: string): string {
  return s.replace(/[\r\n]+/g, ' ').trim()
}

export interface RenderOptions {
  /** 内嵌到脚本里的来源地址（用于 spellbook update），如 https://xxx.pages.dev */
  sourceUrl?: string
  generatedAt?: string
}

export function renderScript(data: Dataset, template: string, opts: RenderOptions = {}): string {
  const title = oneline(data.settings?.title || 'spellbook') || 'spellbook'
  const version = oneline(data.settings?.version || '1.0.0') || '1.0.0'
  const sourceUrl = oneline(opts.sourceUrl || '')
  const generatedAt = opts.generatedAt || new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC'

  const cats = [...data.categories].sort((a, b) => a.sort - b.sort || a.id - b.id)
  const catIndex = new Map<number, number>()
  cats.forEach((c, i) => catIndex.set(c.id, i + 1))

  const scripts = data.scripts
    .filter((s) => s.enabled)
    .sort((a, b) => {
      const ca = catIndex.get(a.category_id) ?? 999
      const cb = catIndex.get(b.category_id) ?? 999
      return ca - cb || a.sort - b.sort || a.id - b.id
    })

  // 数据区：C|序号|图标b64|分类名b64   S|分类序号|类型|标签|名称b64|描述b64|命令b64
  const lines: string[] = []
  for (const c of cats) {
    lines.push(`C|${catIndex.get(c.id)}|${b64encode(c.icon || '')}|${b64encode(c.name || '')}`)
  }
  for (const s of scripts) {
    const c = catIndex.get(s.category_id) ?? 0
    const flags = (s.flags || []).filter(Boolean).join(',')
    lines.push(
      `S|${c}|${s.entry_type}|${flags}|${b64encode(s.name || '')}|${b64encode(s.description || '')}|${b64encode(s.command || '')}`,
    )
  }

  // 头部可读目录（注释）
  const catalog: string[] = []
  let n = 0
  for (const c of cats) {
    catalog.push(`#   [${catIndex.get(c.id)}] ${c.icon || ''} ${c.name}`)
    const cid = catIndex.get(c.id)!
    for (const s of scripts) {
      if ((catIndex.get(s.category_id) ?? -1) !== cid) continue
      n++
      const tags = (s.flags || []).length ? `（${s.flags.join('/')}）` : ''
      catalog.push(`#      ${n}. ${s.name}${tags}`)
    }
  }

  const map: Record<string, string> = {
    '{{TITLE}}': title,
    '{{VERSION}}': version,
    '{{GENERATED_AT}}': generatedAt,
    '{{SOURCE_URL}}': sourceUrl,
    '{{TITLE_B64}}': b64encode(title),
    '{{VERSION_B64}}': b64encode(version),
    '{{SOURCE_URL_B64}}': b64encode(sourceUrl),
    '{{CATALOG}}': catalog.join('\n'),
    '{{DATA_BLOCK}}': lines.join('\n'),
    '{{SCRIPT_COUNT}}': String(scripts.length),
    '{{CATEGORY_COUNT}}': String(cats.length),
  }
  let out = template
  for (const [k, v] of Object.entries(map)) out = out.split(k).join(v)
  return out
}
