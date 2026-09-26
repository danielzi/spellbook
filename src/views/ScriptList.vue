<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  PhCopy as Copy,
  PhMagnifyingGlass as MagnifyingGlass,
  PhGlobe as Globe,
  PhFileCode as FileCode,
  PhKey as Key,
  PhWarning as Warning,
  PhPauseCircle as PauseCircle,
  PhPackage as PackageOpen,
} from '@phosphor-icons/vue'
import { scriptsOf, sortedCategories, store, saveScript, toast } from '../lib/store'
import { copyText } from '../lib/clip'
import type { ScriptEntry } from '../../shared/types'

const q = ref('')
const showDisabled = ref(false)

const groups = computed(() =>
  sortedCategories()
    .map((c) => ({ cat: c, items: scriptsOf(c.id).filter(match) }))
    .filter((g) => g.items.length > 0),
)

function match(s: ScriptEntry): boolean {
  if (!showDisabled.value && !s.enabled) return false
  const kw = q.value.trim().toLowerCase()
  if (!kw) return true
  return (s.name + ' ' + s.description + ' ' + s.command).toLowerCase().includes(kw)
}

async function copy(s: ScriptEntry) {
  toast((await copyText(s.command)) ? '命令已复制' : '复制失败，请手动复制', 'ok')
}

async function toggle(s: ScriptEntry) {
  await saveScript({ ...s, enabled: !s.enabled })
}

let idx = 0
function stagger() {
  return { '--i': idx++ }
}
</script>

<template>
  <div>
    <div class="mb-7 flex flex-wrap items-center gap-4">
      <div class="relative w-full max-w-xs">
        <MagnifyingGlass class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400" :size="16" />
        <input
          v-model="q"
          type="search"
          placeholder="搜索名称 / 描述 / 命令…"
          class="w-full rounded-lg border border-zinc-200 bg-white py-2 pr-3 pl-9 text-sm text-zinc-900 transition-all duration-300 sb-ease placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5 focus:outline-none"
        />
      </div>
      <label class="flex cursor-pointer items-center gap-2 text-sm text-zinc-600 select-none">
        <input v-model="showDisabled" type="checkbox" class="size-4 accent-emerald-600" />
        显示已禁用
      </label>
      <span class="ml-auto font-mono text-xs text-zinc-400">
        {{ store.data.scripts.length }} 脚本 · {{ store.data.categories.length }} 分类
      </span>
    </div>

    <section v-for="g in groups" :key="g.cat.id" class="mb-9">
      <div class="mb-3 flex items-center gap-2.5">
        <span class="text-sm text-zinc-400">{{ g.cat.icon }}</span>
        <h2 class="text-[15px] font-semibold tracking-tight">{{ g.cat.name }}</h2>
        <span class="font-mono text-xs text-zinc-400">{{ g.items.length }}</span>
        <div class="h-px flex-1 bg-zinc-100" />
      </div>
      <div class="grid items-start gap-4 md:grid-cols-2">
        <article
          v-for="s in g.items"
          :key="s.id"
          class="sb-in rounded-xl border border-zinc-200 bg-white p-5 transition-all duration-300 sb-ease hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-[0_12px_24px_-12px_rgba(0,0,0,0.08)]"
          :class="{ 'opacity-55': !s.enabled }"
          :style="stagger()"
        >
          <div class="flex items-start justify-between gap-3">
            <h3 class="text-sm leading-snug font-semibold text-zinc-900">{{ s.name }}</h3>
            <label class="flex shrink-0 cursor-pointer items-center gap-2 text-xs text-zinc-500 select-none" title="禁用后不会出现在生成的工具箱中">
              <input type="checkbox" :checked="s.enabled" class="size-3.5 accent-emerald-600" @change="toggle(s)" />
              启用
            </label>
          </div>
          <p class="mt-1.5 text-[13px] leading-relaxed text-zinc-500">{{ s.description }}</p>
          <div class="mt-3 flex flex-wrap gap-1.5">
            <span
              v-for="f in s.flags"
              :key="f"
              class="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[11px] text-zinc-600"
            >
              <Key v-if="f === 'root'" :size="11" />
              <Warning v-else-if="f === 'danger'" :size="11" class="text-amber-600" />
              <PauseCircle v-else :size="11" />
              {{ f === 'root' ? 'root' : f === 'danger' ? '危险' : '已停更' }}
            </span>
            <span class="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[11px] text-zinc-500">
              <component :is="s.entry_type === 'snippet' ? FileCode : Globe" :size="11" />
              {{ s.entry_type === 'snippet' ? '内置' : '远程' }}
            </span>
            <a
              v-if="s.repo"
              :href="s.repo"
              target="_blank"
              rel="noopener"
              class="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[11px] text-emerald-700 transition-colors duration-300 sb-ease hover:bg-emerald-100"
              :title="s.repo"
            >
              仓库 ↗
            </a>
          </div>
          <div class="group relative mt-3.5">
            <pre class="max-h-24 overflow-auto rounded-lg bg-zinc-950 p-3 pr-11 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all text-zinc-300">{{ s.command }}</pre>
            <button
              class="absolute top-2 right-2 inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-zinc-500 transition-all duration-300 sb-ease hover:bg-white/10 hover:text-white active:scale-90"
              title="复制命令"
              @click="copy(s)"
            >
              <Copy :size="14" />
            </button>
          </div>
        </article>
      </div>
    </section>

    <div v-if="groups.length === 0" class="flex flex-col items-center py-24 text-center sb-in" style="--i: 1">
      <div class="mb-4 flex size-14 items-center justify-center rounded-2xl border border-zinc-200 bg-white">
        <PackageOpen :size="24" class="text-zinc-400" />
      </div>
      <p class="text-sm font-medium text-zinc-700">没有匹配的脚本</p>
      <p class="mt-1 text-xs text-zinc-500">到「编辑器」添加，或到「设置」恢复初始合集</p>
    </div>
  </div>
</template>
