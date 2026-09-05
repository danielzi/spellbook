// GET /spellbook.sh — 从 D1 实时渲染 VPS 工具箱脚本（公开访问）
// ?dl=1 时触发浏览器下载
import template from './gen/template'
import { renderScript } from '../shared/render'
import { getDataset } from './lib/db'
import { type Ctx } from './lib/util'

function buildResponse(request: Request, env: { DB?: D1Database }, head: boolean): Promise<Response> {
  const url = new URL(request.url)
  const origin = `${url.protocol}//${url.host}`
  const headers: Record<string, string> = {
    'content-type': 'text/x-shellscript; charset=utf-8',
    'cache-control': 'no-store',
  }
  if (url.searchParams.get('dl') === '1') headers['content-disposition'] = 'attachment; filename="spellbook.sh"'
  return getDataset(env)
    .then((data) => {
      const body = renderScript(data, template, { sourceUrl: origin })
      return new Response(head ? null : body, { status: 200, headers })
    })
    .catch((e: unknown) => {
      const msg =
        `#!/bin/sh\necho "spellbook 服务端错误：${e instanceof Error ? e.message.replace(/"/g, "'") : '未知错误'}"\necho "请检查 Cloudflare D1 绑定与数据库迁移"\nexit 1\n`
      return new Response(head ? null : msg, {
        status: 503,
        headers: { 'content-type': 'text/x-shellscript; charset=utf-8' },
      })
    })
}

export async function onRequestGet(ctx: Ctx): Promise<Response> {
  return buildResponse(ctx.request, ctx.env, false)
}

export async function onRequestHead(ctx: Ctx): Promise<Response> {
  return buildResponse(ctx.request, ctx.env, true)
}
