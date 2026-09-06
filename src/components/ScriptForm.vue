<script setup lang="ts">
import type { Category, ScriptEntry } from '../../shared/types'

const props = defineProps<{
  /** 父组件传入的响应式表单对象，字段直接在此绑定修改 */
  form: ScriptEntry
  cats: Category[]
  editing: boolean
}>()

defineEmits<{ submit: []; cancel: []; remove: [] }>()

const flagOptions = [
  { value: 'root', label: '🔑 需 root', hint: '执行前检查 root 权限' },
  { value: 'danger', label: '⚠️ 危险', hint: '执行前需输入 yes 二次确认' },
  { value: 'deprecated', label: '💤 已停更', hint: '标记过时条目，仍可执行' },
]

function toggleFlag(f: string) {
  const i = props.form.flags.indexOf(f)
  if (i >= 0) props.form.flags.splice(i, 1)
  else props.form.flags.push(f)
}
</script>

<template>
  <div class="p-5">
    <h2 class="font-bold mb-4">{{ editing ? `✏️ 编辑：${form.name || '（未命名）'}` : '➕ 新增脚本' }}</h2>
    <div class="grid gap-4 md:grid-cols-2">
      <label class="block">
        <span class="text-sm text-slate-500">所属分类</span>
        <select v-model.number="form.category_id" class="mt-1 w-full px-2.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
          <option v-for="c in cats" :key="c.id" :value="c.id">{{ c.icon }} {{ c.name }}</option>
        </select>
      </label>
          <label class="block">
            <span class="text-sm text-slate-500">名称</span>
            <input v-model="form.name" class="mt-1 w-full px-2.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="如：bench.sh 综合测试" />
          </label>
          <label class="block md:col-span-2">
            <span class="text-sm text-slate-500">仓库地址（项目主页 / GitHub，可选）</span>
            <input v-model="form.repo" class="mt-1 w-full px-2.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="https://github.com/…" />
          </label>
      <label class="block md:col-span-2">
        <span class="text-sm text-slate-500">说明（会显示在工具箱菜单里）</span>
        <textarea v-model="form.description" rows="2" class="mt-1 w-full px-2.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"></textarea>
      </label>
      <div class="md:col-span-2">
        <span class="text-sm text-slate-500">类型</span>
        <div class="mt-1 flex gap-4 text-sm">
          <label class="flex items-center gap-1.5 cursor-pointer">
            <input v-model="form.entry_type" type="radio" value="remote" class="accent-indigo-600" />
            远程命令（bash &lt;(curl …)）
          </label>
          <label class="flex items-center gap-1.5 cursor-pointer">
            <input v-model="form.entry_type" type="radio" value="snippet" class="accent-indigo-600" />
            内置脚本（多行命令）
          </label>
        </div>
      </div>
      <label class="block md:col-span-2">
        <span class="text-sm text-slate-500">命令（支持多行）</span>
        <textarea
          v-model="form.command"
          rows="7"
          spellcheck="false"
          class="mt-1 w-full px-2.5 py-2 rounded-lg border border-slate-300 text-sm font-mono bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          placeholder="bash <(curl -sL …)"
        ></textarea>
      </label>
      <div class="md:col-span-2 flex flex-wrap gap-4">
        <label v-for="f in flagOptions" :key="f.value" class="flex items-center gap-2 text-sm cursor-pointer" :title="f.hint">
          <input type="checkbox" :checked="form.flags.includes(f.value)" class="accent-indigo-600" @change="toggleFlag(f.value)" />
          {{ f.label }}
        </label>
        <label class="flex items-center gap-2 text-sm cursor-pointer ml-auto">
          <input type="checkbox" v-model="form.enabled" class="accent-indigo-600" />
          启用
        </label>
        <label class="flex items-center gap-2 text-sm">
          排序
          <input v-model.number="form.sort" type="number" class="w-20 px-2 py-1 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </label>
      </div>
    </div>
    <div class="mt-5 flex gap-2">
      <button class="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700" @click="$emit('submit')">保存</button>
      <button class="px-4 py-2 rounded-lg border border-slate-300 text-sm text-slate-600 hover:bg-slate-50" @click="$emit('cancel')">取消</button>
      <button v-if="editing" class="px-4 py-2 rounded-lg border border-rose-200 text-rose-600 text-sm hover:bg-rose-50 ml-auto" @click="$emit('remove')">删除此脚本</button>
    </div>
  </div>
</template>
