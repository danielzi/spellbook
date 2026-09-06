<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import ScriptForm from '../components/ScriptForm.vue'
import {
  deleteCategory,
  deleteScript,
  saveCategory,
  saveScript,
  scriptsOf,
  sortedCategories,
  store,
  toast,
} from '../lib/store'
import type { Category, ScriptEntry } from '../../shared/types'

const cats = computed(() => sortedCategories())
const selectedCat = ref<number | 'all'>('all' as const)
const list = computed(() => {
  const base = selectedCat.value === 'all' ? store.data.scripts : store.data.scripts.filter((s) => s.category_id === selectedCat.value)
  return [...base].sort((a, b) => a.sort - b.sort || a.id - b.id)
})

// ---------- 分类 ----------
const catForm = reactive<{ id: number; name: string; icon: string; sort: number }>({ id: 0, name: '', icon: '', sort: 0 })
const catEditing = computed(() => catForm.id > 0)

function editCat(c: Category) {
  Object.assign(catForm, { id: c.id, name: c.name, icon: c.icon, sort: c.sort })
}
function resetCat() {
  Object.assign(catForm, { id: 0, name: '', icon: '', sort: 0 })
}
async function submitCat() {
  if (!catForm.name.trim()) {
    toast('分类名称不能为空', 'err')
    return
  }
  await saveCategory({ ...catForm })
  resetCat()
}
async function removeCat(c: Category) {
  const n = store.data.scripts.filter((s) => s.category_id === c.id).length
  const msg = n > 0 ? `删除分类「${c.name}」？其下 ${n} 个脚本会一并删除，且不可恢复！` : `删除分类「${c.name}」？`
  if (!confirm(msg)) return
  await deleteCategory(c.id)
  if (selectedCat.value === c.id) selectedCat.value = 'all'
  if (form.category_id === c.id) form.category_id = cats.value[0]?.id ?? 0
  if (openId.value !== null && !store.data.scripts.some((s) => s.id === openId.value)) openId.value = null
}

// ---------- 脚本（行内展开编辑） ----------
/** null=全部收起；0=新增表单展开；>0=对应脚本行展开 */
const openId = ref<number | null>(null)

function blankScript(): ScriptEntry {
  return {
    id: 0,
    category_id: typeof selectedCat.value === 'number' ? selectedCat.value : (cats.value[0]?.id ?? 0),
    name: '',
    description: '',
    command: '',
    entry_type: 'remote',
    flags: [],
    enabled: true,
    sort: 0,
    repo: '',
  }
}
const form = reactive<ScriptEntry>(blankScript())

function toggleRow(s: ScriptEntry) {
  if (openId.value === s.id) {
    openId.value = null
    return
  }
  Object.assign(form, JSON.parse(JSON.stringify(s)) as ScriptEntry)
  openId.value = s.id
}
function newScript() {
  Object.assign(form, blankScript())
  openId.value = 0
}
function cancelEdit() {
  openId.value = null
}
async function submit() {
  if (!form.name.trim()) {
    toast('脚本名称不能为空', 'err')
    return
  }
  if (!form.command.trim()) {
    toast('命令不能为空', 'err')
    return
  }
  if (!form.category_id) {
    toast('请先创建一个分类', 'err')
    return
  }
  await saveScript({ ...form })
  openId.value = null
}
async function remove() {
  if (form.id > 0 && confirm(`删除脚本「${form.name}」？`)) {
    await deleteScript(form.id)
    openId.value = null
  }
}
</script>

<template>
  <div class="grid gap-5 lg:grid-cols-[280px_1fr]">
    <!-- 左：分类管理 -->
    <aside class="space-y-4">
      <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <h2 class="font-bold mb-3">{{ catEditing ? '✏️ 编辑分类' : '➕ 新增分类' }}</h2>
        <div class="space-y-2.5">
          <input v-model="catForm.icon" placeholder="图标（emoji，如 🛠️）" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          <input v-model="catForm.name" placeholder="分类名称" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          <input v-model.number="catForm.sort" type="number" placeholder="排序（小的在前）" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          <div class="flex gap-2">
            <button class="flex-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700" @click="submitCat">
              {{ catEditing ? '保存修改' : '创建分类' }}
            </button>
            <button v-if="catEditing" class="px-3 py-1.5 rounded-lg border border-slate-300 text-sm text-slate-600 hover:bg-slate-50" @click="resetCat">取消</button>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <h2 class="font-bold mb-2 text-sm text-slate-500">全部分类</h2>
        <ul class="space-y-1">
          <li
            v-for="c in cats"
            :key="c.id"
            class="group flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-indigo-50 cursor-pointer text-sm"
            :class="{ 'bg-indigo-50': selectedCat === c.id }"
            @click="selectedCat = selectedCat === c.id ? 'all' : c.id"
          >
            <span>{{ c.icon }}</span>
            <span class="flex-1 truncate">{{ c.name }}</span>
            <span class="text-xs text-slate-400">{{ scriptsOf(c.id).length }}</span>
            <span class="hidden group-hover:flex gap-1">
              <button class="text-xs px-1.5 py-0.5 rounded border border-slate-300 hover:bg-white" title="编辑" @click.stop="editCat(c)">✏️</button>
              <button class="text-xs px-1.5 py-0.5 rounded border border-rose-200 text-rose-600 hover:bg-rose-50" title="删除" @click.stop="removeCat(c)">🗑</button>
            </span>
          </li>
        </ul>
        <p class="text-xs text-slate-400 mt-2">点击分类名可筛选右侧脚本列表。</p>
      </div>
    </aside>

    <!-- 右：脚本管理（点击行内展开编辑） -->
    <div class="space-y-5 min-w-0">
      <div class="flex flex-wrap items-center gap-3">
        <h2 class="font-bold text-lg">脚本管理</h2>
        <span class="text-sm text-slate-400">{{ list.length }} 项</span>
        <button class="ml-auto px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700" @click="newScript">＋ 新增脚本</button>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <!-- 新增表单：就地展开在列表顶部 -->
        <div v-if="openId === 0" class="border-b-2 border-indigo-200 bg-indigo-50/40">
          <ScriptForm :form="form" :cats="cats" :editing="false" @submit="submit" @cancel="cancelEdit" />
        </div>

        <div class="divide-y divide-slate-100">
          <div v-for="s in list" :key="s.id">
            <button
              class="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-indigo-50/50 transition cursor-pointer"
              :class="{ 'bg-indigo-50': openId === s.id }"
              @click="toggleRow(s)"
            >
              <span
                class="w-2 h-2 rounded-full shrink-0"
                :class="s.enabled ? 'bg-emerald-500' : 'bg-slate-300'"
                :title="s.enabled ? '已启用' : '已禁用'"
              ></span>
              <span class="font-medium truncate">{{ s.name }}</span>
              <span v-if="s.flags.includes('danger')" class="text-xs px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200 shrink-0">⚠️ 危险</span>
              <span v-if="s.flags.includes('root')" class="text-xs px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 shrink-0">root</span>
              <span class="ml-auto text-xs text-slate-400 shrink-0">{{ s.entry_type === 'snippet' ? '内置' : '远程' }}</span>
              <span class="text-xs shrink-0" :class="openId === s.id ? 'text-indigo-600 font-medium' : 'text-slate-400'">
                {{ openId === s.id ? '收起 ▲' : '编辑 ▼' }}
              </span>
            </button>
            <div v-if="openId === s.id" class="border-t border-slate-100 bg-slate-50/60">
              <ScriptForm :form="form" :cats="cats" :editing="true" @submit="submit" @cancel="cancelEdit" @remove="remove" />
            </div>
          </div>
        </div>
        <p v-if="list.length === 0" class="px-4 py-10 text-center text-slate-400 text-sm">暂无脚本，点右上角「新增脚本」创建。</p>
      </div>
    </div>
  </div>
</template>
