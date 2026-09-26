<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import {
  PhCopySimple as CopySimple,
  PhDownloadSimple as DownloadSimple,
  PhInfo as Info,
  PhCaretDown as CaretDown,
} from '@phosphor-icons/vue'
import { saveSettings, store, toast } from '../lib/store'
import { copyText, downloadText } from '../lib/clip'
import { renderScript } from '../../shared/render'
import tpl from '../../shared/spellbook.sh.tpl?raw'

const origin = window.location.origin
const installCmd = `bash <(curl -sL ${origin}/spellbook.sh)`
const directCmd = `bash <(curl -sL ${origin}/spellbook.sh) install`

const form = reactive({ title: store.data.settings.title, version: store.data.settings.version })
watch(
  () => store.data.settings,
  (s) => {
    form.title = s.title
    form.version = s.version
  },
)

// 本地即时渲染（本地模式/兜底预览）
const localScript = computed(() => renderScript(store.data, tpl, { sourceUrl: origin }))

// 云端模式下展示服务端渲染结果
const cloudScript = ref('')
watch(
  () => [store.mode, store.data] as const,
  async () => {
    if (store.mode !== 'cloud') return
    try {
      const r = await fetch(`${origin}/spellbook.sh`, { cache: 'no-store' })
      cloudScript.value = await r.text()
    } catch {
      cloudScript.value = '# 无法从当前站点获取 /spellbook.sh（后端可能未部署）'
    }
  },
  { immediate: true },
)

const preview = computed(() => (store.mode === 'cloud' && cloudScript.value ? cloudScript.value : localScript.value))
const previewSource = computed(() => (store.mode === 'cloud' && cloudScript.value ? '服务端实时渲染' : '浏览器端渲染预览'))

async function copyCmd(cmd: string) {
  toast((await copyText(cmd)) ? '已复制到剪贴板' : '复制失败，请手动复制')
}
function download() {
  if (store.mode === 'cloud' && store.health?.cloudReady) {
    window.open(`${origin}/spellbook.sh?dl=1`)
  } else {
    downloadText('spellbook.sh', localScript.value)
    toast('已生成并下载 spellbook.sh（本地模式）')
  }
}
async function save() {
  if (!form.title.trim()) {
    toast('标题不能为空', 'err')
    return
  }
  await saveSettings({ title: form.title.trim(), version: form.version.trim() || '1.0.0' })
}
</script>

<template>
  <div class="max-w-3xl space-y-6">
    <!-- ① 安装命令 -->
    <section class="sb-in" style="--i: 0">
      <h2 class="mb-1 text-lg font-semibold tracking-tight">一键安装</h2>
      <p class="mb-5 max-w-[65ch] text-sm leading-relaxed text-zinc-500">
        部署到 Cloudflare Pages 后地址永久有效。网页端修改合集后，在 VPS 上执行
        <code class="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs">spellbook update</code> 即可同步，命令无需变化。
      </p>
      <div class="space-y-4">
        <div class="space-y-1.5">
          <p class="text-xs font-medium text-zinc-500">在 VPS 上直接打开菜单</p>
          <div class="flex gap-2">
            <code class="min-w-0 flex-1 overflow-x-auto rounded-lg bg-zinc-950 p-3 font-mono text-xs whitespace-nowrap text-emerald-400">
              {{ installCmd }}
            </code>
            <button
              class="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-600 transition-all duration-300 sb-ease hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.98]"
              @click="copyCmd(installCmd)"
            >
              <CopySimple :size="13" />
              复制
            </button>
          </div>
        </div>
        <div class="space-y-1.5">
          <p class="text-xs font-medium text-zinc-500">
            安装为系统命令<span class="ml-1 text-zinc-400">（装完直接敲 spellbook）</span>
          </p>
          <div class="flex gap-2">
            <code class="min-w-0 flex-1 overflow-x-auto rounded-lg bg-zinc-950 p-3 font-mono text-xs whitespace-nowrap text-emerald-400">
              {{ directCmd }}
            </code>
            <button
              class="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-600 transition-all duration-300 sb-ease hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.98]"
              @click="copyCmd(directCmd)"
            >
              <CopySimple :size="13" />
              复制
            </button>
          </div>
        </div>
      </div>
      <div class="mt-5 flex flex-wrap items-center gap-3">
        <button
          class="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-all duration-300 sb-ease hover:bg-zinc-800 active:scale-[0.98]"
          @click="download"
        >
          <DownloadSimple :size="16" />
          下载 spellbook.sh
        </button>
        <p class="text-xs text-zinc-400">
          {{ store.mode === 'cloud' ? '云端模式：从当前站点下载实时渲染的脚本' : '本地模式：浏览器直接生成文件，可自行上传 VPS 或托管到 GitHub' }}
        </p>
      </div>
    </section>

    <!-- ② 工具箱信息 -->
    <section class="sb-in" style="--i: 1">
      <h2 class="mb-1 text-lg font-semibold tracking-tight">工具箱信息</h2>
      <p class="mb-4 text-sm text-zinc-500">标题与版本号会写入生成脚本的头部。</p>
      <div class="rounded-xl border border-zinc-200 bg-white p-5">
        <div class="grid gap-4 md:grid-cols-2">
          <label class="block space-y-1.5">
            <span class="text-xs font-medium text-zinc-500">工具标题</span>
            <input
              v-model="form.title"
              class="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm transition-all duration-300 sb-ease focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5 focus:outline-none"
            />
          </label>
          <label class="block space-y-1.5">
            <span class="text-xs font-medium text-zinc-500">版本号</span>
            <input
              v-model="form.version"
              placeholder="1.0.0"
              class="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm transition-all duration-300 sb-ease placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5 focus:outline-none"
            />
          </label>
        </div>
        <button
          class="mt-4 cursor-pointer rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-all duration-300 sb-ease hover:bg-zinc-50 active:scale-[0.98]"
          @click="save"
        >
          保存
        </button>
      </div>
    </section>

    <!-- ③ 预览 -->
    <section class="sb-in overflow-hidden rounded-xl border border-zinc-200 bg-white" style="--i: 2">
      <details>
        <summary class="flex cursor-pointer list-none items-center gap-2 p-5 text-sm font-medium text-zinc-800 select-none">
          <CaretDown :size="14" class="text-zinc-400 transition-transform duration-300 sb-ease" />
          预览生成的脚本
          <span class="rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[11px] text-zinc-500">
            {{ preview.length ? Math.round(preview.length / 1024) : 0 }} KB
          </span>
          <span class="text-xs text-zinc-400">{{ previewSource }}</span>
        </summary>
        <pre class="max-h-[26rem] overflow-auto border-t border-zinc-800 bg-zinc-950 p-5 font-mono text-xs leading-relaxed text-zinc-300">{{ preview }}</pre>
      </details>
    </section>

    <p class="flex items-start gap-2 rounded-lg border border-dashed border-zinc-300 p-4 text-xs leading-relaxed text-zinc-500 sb-in" style="--i: 3">
      <Info :size="14" class="mt-0.5 shrink-0" />
      本地模式生成的脚本没有内嵌来源地址，无法使用 <code class="rounded bg-zinc-100 px-1 font-mono">spellbook update</code> 自更新；部署到 Pages 后从站点拉取的脚本支持自更新。
    </p>
  </div>
</template>
