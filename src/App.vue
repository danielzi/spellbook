<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  PhBookBookmark as BookBookmark,
  PhCloud as Cloud,
  PhHardDrive as HardDrive,
  PhCheckCircle as CheckCircle,
  PhWarningCircle as WarningCircle,
} from '@phosphor-icons/vue'
import { store, init, toast } from './lib/store'
import ScriptList from './views/ScriptList.vue'
import EditorView from './views/EditorView.vue'
import GenerateView from './views/GenerateView.vue'
import SettingsView from './views/SettingsView.vue'

const tabs = [
  { key: 'list', label: '脚本库', comp: ScriptList },
  { key: 'editor', label: '编辑器', comp: EditorView },
  { key: 'gen', label: '生成发布', comp: GenerateView },
  { key: 'settings', label: '设置', comp: SettingsView },
]
const active = ref('list')
const current = computed(() => tabs.find((t) => t.key === active.value)?.comp ?? ScriptList)

onMounted(() => {
  init().catch((e: unknown) => toast(e instanceof Error ? e.message : '初始化失败', 'err'))
})
</script>

<template>
  <div class="min-h-screen bg-zinc-50 text-zinc-900">
    <header class="sticky top-0 z-40 border-b border-zinc-200 bg-white">
      <div class="mx-auto flex h-16 max-w-6xl items-center gap-3 px-6">
        <div class="flex size-9 items-center justify-center rounded-lg bg-zinc-900 text-white">
          <BookBookmark :size="18" weight="fill" />
        </div>
        <div class="leading-tight">
          <div class="text-[15px] font-semibold tracking-tight">Spellbook</div>
          <div class="text-xs text-zinc-500">VPS 脚本宝典</div>
        </div>

        <div class="ml-auto flex items-center gap-2">
          <span
            class="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-600"
          >
            <component :is="store.mode === 'cloud' ? Cloud : HardDrive" :size="13" />
            {{ store.mode === 'cloud' ? '云端 · D1' : '本地 · 浏览器' }}
          </span>
        </div>
      </div>
      <nav class="mx-auto flex max-w-6xl items-center gap-1 px-6">
        <button
          v-for="t in tabs"
          :key="t.key"
          class="relative inline-flex cursor-pointer items-center gap-1.5 px-3 pb-3 pt-2 text-sm transition-colors duration-300 sb-ease"
          :class="active === t.key ? 'font-medium text-zinc-900' : 'text-zinc-500 hover:text-zinc-800'"
          @click="active = t.key"
        >
          {{ t.label }}
          <span
            v-if="active === t.key"
            class="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-emerald-600"
          />
        </button>
      </nav>
    </header>

    <main v-if="store.ready" class="mx-auto max-w-6xl px-6 py-8">
      <component :is="current" />
    </main>

    <!-- 骨架屏：匹配实际布局的加载占位，避免无意义转圈 -->
    <main v-else class="mx-auto max-w-6xl px-6 py-8">
      <div class="mb-6 flex items-center gap-4">
        <div class="sb-skeleton h-9 w-72" />
        <div class="sb-skeleton h-5 w-24" />
      </div>
      <div class="mb-4 h-6 w-28 sb-skeleton" />
      <div class="grid gap-4 md:grid-cols-2">
        <div v-for="i in 4" :key="i" class="rounded-xl border border-zinc-200 bg-white p-4">
          <div class="mb-3 h-4 w-2/3 sb-skeleton" />
          <div class="mb-4 space-y-2">
            <div class="h-3 w-full sb-skeleton" />
            <div class="h-3 w-4/5 sb-skeleton" />
          </div>
          <div class="h-12 w-full sb-skeleton" />
        </div>
      </div>
    </main>

    <footer class="mx-auto max-w-6xl px-6 pb-10 pt-4 text-xs leading-relaxed text-zinc-400">
      脚本内容来自社区公开分享，使用前请自行确认安全性；DD 重装等危险操作会清空硬盘数据，请谨慎执行。
    </footer>

    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="translate-y-2 opacity-0"
      leave-active-class="transition duration-200 ease-in"
      leave-to-class="translate-y-2 opacity-0"
    >
      <div
        v-if="store.toast"
        class="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)]"
      >
        <component
          :is="store.toast.type === 'ok' ? CheckCircle : WarningCircle"
          :size="18"
          :weight="store.toast.type === 'ok' ? 'fill' : 'fill'"
          :class="store.toast.type === 'ok' ? 'text-emerald-600' : 'text-red-500'"
        />
        {{ store.toast.msg }}
      </div>
    </Transition>
  </div>
</template>
