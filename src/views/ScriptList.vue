<script setup lang="ts">
import { computed, ref } from 'vue'
import { scriptsOf, sortedCategories, store, saveScript, toast } from '../lib/store'
import { copyText } from '../lib/clip'
import { FLAG_LABELS, type ScriptEntry } from '../../shared/types'

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
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center gap-3 mb-5">
      <input
        v-model="q"
        type="search"
        placeholder="搜索名称 / 描述 / 命令…"
        class="w-72 px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
      />
      <label class="text-sm flex items-center gap-1.5 text-slate-600">
        <input v-model="showDisabled" type="checkbox" class="accent-indigo-600" />
        显示已禁用
      </label>
      <span class="text-sm text-slate-400">
        共 {{ store.data.scripts.length }} 个脚本 · {{ store.data.categories.length }} 个分类
      </span>
    </div>

    <section v-for="g in groups" :key="g.cat.id" class="mb-7">
      <div class="flex items-baseline gap-2 mb-2.5">
        <h2 class="text-lg font-bold text-slate-800">{{ g.cat.icon }} {{ g.cat.name }}</h2>
        <span class="text-xs text-slate-400">{{ g.items.length }} 项</span>
      </div>
      <div class="grid gap-3 md:grid-cols-2">
        <article
          v-for="s in g.items"
          :key="s.id"
          class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow transition"
          :class="{ 'opacity-60': !s.enabled }"
        >
          <div class="flex items-start justify-between gap-2">
            <h3 class="font-semibold text-slate-800 leading-snug">{{ s.name }}</h3>
            <label class="text-xs flex items-center gap-1 shrink-0 text-slate-500 cursor-pointer" title="禁用后不会出现在生成的工具箱中">
              <input type="checkbox" :checked="s.enabled" class="accent-indigo-600" @change="toggle(s)" />
              启用
            </label>
          </div>
          <p class="text-sm text-slate-500 mt-1 leading-relaxed">{{ s.description }}</p>
          <div class="mt-2 flex flex-wrap gap-1">
            <span
              v-for="f in s.flags"
              :key="f"
              class="text-xs px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200"
            >
              {{ FLAG_LABELS[f] || f }}
            </span>
            <span class="text-xs px-1.5 py-0.5 rounded bg-slate-50 text-slate-500 border border-slate-200">
              {{ s.entry_type === 'snippet' ? '内置命令' : '远程脚本' }}
            </span>
          </div>
          <div class="mt-2.5 flex items-stretch gap-2">
            <code class="flex-1 max-h-28 overflow-auto text-xs bg-slate-900 text-slate-200 rounded-lg p-2 whitespace-pre-wrap break-all">{{ s.command }}</code>
            <button
              class="shrink-0 self-start px-2.5 py-1 text-xs rounded-lg border border-slate-300 text-slate-600 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition"
              @click="copy(s)"
            >
              复制
            </button>
          </div>
        </article>
      </div>
    </section>

    <div v-if="groups.length === 0" class="text-center py-20 text-slate-400">
      <p class="text-4xl mb-3">📖</p>
      <p>没有匹配的脚本。可到「编辑器」添加，或到「设置」恢复初始合集。</p>
    </div>
  </div>
</template>
