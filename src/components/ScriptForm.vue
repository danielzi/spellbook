<script setup lang="ts">
import {
  PhKey as Key,
  PhWarning as Warning,
  PhPauseCircle as PauseCircle,
  PhTrash as Trash2,
} from '@phosphor-icons/vue'
import type { Category, ScriptEntry } from '../../shared/types'

const props = defineProps<{
  /** 父组件传入的响应式表单对象，字段直接在此绑定修改 */
  form: ScriptEntry
  cats: Category[]
  editing: boolean
}>()

defineEmits<{ submit: []; cancel: []; remove: [] }>()

const flagOptions = [
  { value: 'root', label: '需 root', hint: '执行前检查 root 权限', icon: Key },
  { value: 'danger', label: '危险', hint: '执行前需输入 yes 二次确认', icon: Warning },
  { value: 'deprecated', label: '已停更', hint: '标记过时条目，仍可执行', icon: PauseCircle },
]

function toggleFlag(f: string) {
  const i = props.form.flags.indexOf(f)
  if (i >= 0) props.form.flags.splice(i, 1)
  else props.form.flags.push(f)
}
</script>

<template>
  <div class="p-5">
    <h2 class="mb-5 text-sm font-semibold tracking-tight text-zinc-900">
      {{ editing ? `编辑 · ${form.name || '（未命名）'}` : '新增脚本' }}
    </h2>
    <div class="grid gap-4 md:grid-cols-2">
      <label class="block space-y-1.5">
        <span class="text-xs font-medium text-zinc-500">所属分类</span>
        <select
          v-model.number="form.category_id"
          class="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition-all duration-300 sb-ease focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5 focus:outline-none"
        >
          <option v-for="c in cats" :key="c.id" :value="c.id">{{ c.icon }} {{ c.name }}</option>
        </select>
      </label>
      <label class="block space-y-1.5">
        <span class="text-xs font-medium text-zinc-500">名称</span>
        <input
          v-model="form.name"
          class="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition-all duration-300 sb-ease placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5 focus:outline-none"
          placeholder="如：bench.sh 综合测试"
        />
      </label>
      <label class="block space-y-1.5 md:col-span-2">
        <span class="text-xs font-medium text-zinc-500">仓库地址（项目主页 / GitHub，可选）</span>
        <input
          v-model="form.repo"
          class="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 transition-all duration-300 sb-ease placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5 focus:outline-none"
          placeholder="https://github.com/…"
        />
      </label>
      <label class="block space-y-1.5 md:col-span-2">
        <span class="text-xs font-medium text-zinc-500">说明（会显示在工具箱菜单里）</span>
        <textarea
          v-model="form.description"
          rows="2"
          class="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition-all duration-300 sb-ease focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5 focus:outline-none"
        />
      </label>
      <div class="space-y-1.5 md:col-span-2">
        <span class="text-xs font-medium text-zinc-500">类型</span>
        <div class="flex gap-5 text-sm">
          <label class="flex cursor-pointer items-center gap-1.5 text-zinc-700 select-none">
            <input v-model="form.entry_type" type="radio" value="remote" class="size-3.5 accent-emerald-600" />
            远程命令
          </label>
          <label class="flex cursor-pointer items-center gap-1.5 text-zinc-700 select-none">
            <input v-model="form.entry_type" type="radio" value="snippet" class="size-3.5 accent-emerald-600" />
            内置脚本（多行）
          </label>
        </div>
      </div>
      <label class="block space-y-1.5 md:col-span-2">
        <span class="text-xs font-medium text-zinc-500">命令（支持多行）</span>
        <textarea
          v-model="form.command"
          rows="7"
          spellcheck="false"
          class="w-full rounded-lg bg-zinc-950 p-3.5 font-mono text-xs leading-relaxed text-zinc-200 transition-all duration-300 sb-ease placeholder:text-zinc-600 focus:ring-4 focus:ring-zinc-900/15 focus:outline-none"
          placeholder="bash <(curl -sL …)"
        />
      </label>
      <div class="flex flex-wrap items-center gap-x-5 gap-y-2.5 md:col-span-2">
        <label
          v-for="f in flagOptions"
          :key="f.value"
          class="flex cursor-pointer items-center gap-1.5 text-sm text-zinc-700 select-none"
          :title="f.hint"
        >
          <input type="checkbox" :checked="form.flags.includes(f.value)" class="size-3.5 accent-emerald-600" @change="toggleFlag(f.value)" />
          <component :is="f.icon" :size="13" class="text-zinc-400" />
          {{ f.label }}
        </label>
        <label class="ml-auto flex cursor-pointer items-center gap-2 text-sm text-zinc-700 select-none">
          启用
          <input type="checkbox" v-model="form.enabled" class="size-3.5 accent-emerald-600" />
        </label>
        <label class="flex items-center gap-2 text-sm text-zinc-700">
          排序
          <input
            v-model.number="form.sort"
            type="number"
            class="w-20 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm transition-all duration-300 sb-ease focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5 focus:outline-none"
          />
        </label>
      </div>
    </div>
    <div class="mt-5 flex items-center gap-2.5">
      <button
        class="cursor-pointer rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-all duration-300 sb-ease hover:bg-zinc-800 active:scale-[0.98]"
        @click="$emit('submit')"
      >
        保存
      </button>
      <button
        class="cursor-pointer rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-600 transition-all duration-300 sb-ease hover:bg-zinc-50 active:scale-[0.98]"
        @click="$emit('cancel')"
      >
        取消
      </button>
      <button
        v-if="editing"
        class="ml-auto inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-red-600 transition-all duration-300 sb-ease hover:bg-red-50 active:scale-[0.98]"
        @click="$emit('remove')"
      >
        <Trash2 :size="14" />
        删除此脚本
      </button>
    </div>
  </div>
</template>
