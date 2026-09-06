<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { store, init, toast } from './lib/store'
import ScriptList from './views/ScriptList.vue'
import EditorView from './views/EditorView.vue'
import GenerateView from './views/GenerateView.vue'
import SettingsView from './views/SettingsView.vue'

const tabs = [
  { key: 'list', label: '📖 脚本库', comp: ScriptList },
  { key: 'editor', label: '✏️ 编辑器', comp: EditorView },
  { key: 'gen', label: '⚡ 生成发布', comp: GenerateView },
  { key: 'settings', label: '⚙️ 设置', comp: SettingsView },
]
const active = ref('list')
const current = computed(() => tabs.find((t) => t.key === active.value)?.comp ?? ScriptList)

onMounted(() => {
  init().catch((e: unknown) => toast(e instanceof Error ? e.message : '初始化失败', 'err'))
})
</script>

<template>
  <div class="min-h-screen bg-slate-100 text-slate-800">
    <header class="bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md">
      <div class="mx-auto max-w-6xl px-4 pt-4 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 class="text-xl font-bold tracking-wide">📖 Spellbook <span class="font-normal opacity-80">· VPS 脚本宝典</span></h1>
          <p class="text-xs opacity-75 mt-0.5">在线管理脚本合集，一键生成 VPS 工具箱</p>
        </div>
        <span
          class="text-xs px-2.5 py-1 rounded-full border"
          :class="store.mode === 'cloud' ? 'bg-emerald-400/15 border-emerald-300/40 text-emerald-100' : 'bg-white/10 border-white/25 text-white'"
        >
          {{ store.mode === 'cloud' ? '☁️ 云端模式（D1）' : '💾 本地模式（浏览器存储）' }}
        </span>
      </div>
      <nav class="mx-auto max-w-6xl px-4 mt-2 flex gap-1 overflow-x-auto">
        <button
          v-for="t in tabs"
          :key="t.key"
          class="px-4 py-2.5 text-sm whitespace-nowrap rounded-t-lg transition"
          :class="active === t.key ? 'bg-slate-100 text-indigo-700 font-semibold' : 'text-indigo-100 hover:bg-white/10'"
          @click="active = t.key"
        >
          {{ t.label }}
        </button>
      </nav>
    </header>

    <main v-if="store.ready" class="mx-auto max-w-6xl px-4 py-6">
      <component :is="current" />
    </main>
    <main v-else class="mx-auto max-w-6xl px-4 py-24 text-center text-slate-500">
      <div class="animate-pulse">正在初始化…</div>
    </main>

    <footer class="mx-auto max-w-6xl px-4 pb-8 text-xs text-slate-400 leading-relaxed">
      脚本内容来自社区公开分享，使用前请自行确认安全性；DD 重装等危险操作会清空硬盘数据，请谨慎执行。
    </footer>

    <div
      v-if="store.toast"
      class="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg text-sm text-white"
      :class="store.toast.type === 'ok' ? 'bg-emerald-600' : 'bg-rose-600'"
    >
      {{ store.toast.msg }}
    </div>
  </div>
</template>
