<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
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
const previewSource = computed(() => (store.mode === 'cloud' && cloudScript.value ? '服务端实时渲染（/spellbook.sh）' : '浏览器端渲染预览'))

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
  <div class="space-y-5">
    <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h2 class="font-bold text-lg mb-1">⚡ 一键安装 / 使用</h2>
      <p class="text-sm text-slate-500 mb-4">
        部署到 Cloudflare Pages 后，下面的地址永久有效；网页端修改合集后，VPS 上执行 <code class="bg-slate-100 px-1 rounded">spellbook update</code> 即可同步，命令无需变化。
      </p>

      <div class="space-y-3">
        <div>
          <p class="text-xs text-slate-400 mb-1">① 在 VPS 上直接打开菜单</p>
          <div class="flex gap-2">
            <code class="flex-1 bg-slate-900 text-emerald-300 rounded-lg px-3 py-2.5 text-sm overflow-x-auto whitespace-nowrap">{{ installCmd }}</code>
            <button class="px-3 py-2 text-sm rounded-lg border border-slate-300 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700" @click="copyCmd(installCmd)">复制</button>
          </div>
        </div>
        <div>
          <p class="text-xs text-slate-400 mb-1">② 安装为系统命令（装完直接敲 <b>spellbook</b>）</p>
          <div class="flex gap-2">
            <code class="flex-1 bg-slate-900 text-emerald-300 rounded-lg px-3 py-2.5 text-sm overflow-x-auto whitespace-nowrap">{{ directCmd }}</code>
            <button class="px-3 py-2 text-sm rounded-lg border border-slate-300 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700" @click="copyCmd(directCmd)">复制</button>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2 pt-1">
          <button class="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700" @click="download">⬇️ 下载 spellbook.sh</button>
          <span class="text-xs text-slate-400">
            {{ store.mode === 'cloud' ? '云端模式：从当前站点下载实时渲染的脚本' : '本地模式：浏览器直接生成文件，可自行上传 VPS / 托管到 GitHub' }}
          </span>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h2 class="font-bold text-lg mb-4">🧾 工具箱信息（生成到脚本头部）</h2>
      <div class="grid gap-4 md:grid-cols-2">
        <label class="block">
          <span class="text-sm text-slate-500">工具标题</span>
          <input v-model="form.title" class="mt-1 w-full px-2.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </label>
        <label class="block">
          <span class="text-sm text-slate-500">版本号</span>
          <input v-model="form.version" class="mt-1 w-full px-2.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="1.0.0" />
        </label>
      </div>
      <button class="mt-4 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700" @click="save">保存</button>
    </div>

    <details class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <summary class="px-5 py-4 cursor-pointer select-none font-bold">
        👁️ 预览生成的脚本 <span class="ml-2 text-xs font-normal text-slate-400">{{ previewSource }} · 共 {{ preview.length ? Math.round(preview.length / 1024) : 0 }} KB</span>
      </summary>
      <pre class="max-h-[28rem] overflow-auto border-t border-slate-100 bg-slate-950 text-slate-200 text-xs leading-relaxed p-4">{{ preview }}</pre>
    </details>
  </div>
</template>
