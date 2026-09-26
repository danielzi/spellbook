<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import ScriptForm from '../components/ScriptForm.vue'
import {
  PhPencilSimple as PencilSimple,
  PhTrash as Trash,
  PhPlus as Plus,
  PhCaretRight as ChevronRight,
} from '@phosphor-icons/vue'
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
  <div class="grid items-start gap-6 lg:grid-cols-[260px_1fr]">
    <!-- 左：分类管理 -->
    <aside class="space-y-4">
      <div class="rounded-xl border border-zinc-200 bg-white p-4">
        <h2 class="mb-3.5 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
          {{ catEditing ? '编辑分类' : '新增分类' }}
        </h2>
        <div class="space-y-2.5">
          <input
            v-model="catForm.icon"
            placeholder="图标（emoji，如 🛠️）"
            class="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm transition-all duration-300 sb-ease placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5 focus:outline-none"
          />
          <input
            v-model="catForm.name"
            placeholder="分类名称"
            class="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm transition-all duration-300 sb-ease placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5 focus:outline-none"
          />
          <input
            v-model.number="catForm.sort"
            type="number"
            placeholder="排序（小的在前）"
            class="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm transition-all duration-300 sb-ease placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5 focus:outline-none"
          />
          <div class="flex gap-2 pt-0.5">
            <button
              class="flex-1 cursor-pointer rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition-all duration-300 sb-ease hover:bg-zinc-800 active:scale-[0.98]"
              @click="submitCat"
            >
              {{ catEditing ? '保存修改' : '创建分类' }}
            </button>
            <button
              v-if="catEditing"
              class="cursor-pointer rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 transition-all duration-300 sb-ease hover:bg-zinc-50 active:scale-[0.98]"
              @click="resetCat"
            >
              取消
            </button>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-zinc-200 bg-white p-2">
        <ul class="space-y-0.5">
          <li
            v-for="c in cats"
            :key="c.id"
            class="group flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors duration-300 sb-ease"
            :class="selectedCat === c.id ? 'bg-zinc-100 font-medium text-zinc-900' : 'text-zinc-600 hover:bg-zinc-50'"
            @click="selectedCat = selectedCat === c.id ? 'all' : c.id"
          >
            <span class="text-xs">{{ c.icon }}</span>
            <span class="flex-1 truncate">{{ c.name }}</span>
            <span class="font-mono text-[11px] text-zinc-400">{{ scriptsOf(c.id).length }}</span>
            <span class="hidden gap-0.5 group-hover:flex">
              <button
                class="inline-flex size-6 cursor-pointer items-center justify-center rounded-md text-zinc-400 transition-colors duration-300 sb-ease hover:bg-white hover:text-zinc-700"
                title="编辑"
                @click.stop="editCat(c)"
              >
                <PencilSimple :size="12" />
              </button>
              <button
                class="inline-flex size-6 cursor-pointer items-center justify-center rounded-md text-zinc-400 transition-colors duration-300 sb-ease hover:bg-white hover:text-red-600"
                title="删除"
                @click.stop="removeCat(c)"
              >
                <Trash :size="12" />
              </button>
            </span>
          </li>
        </ul>
        <p class="mt-1.5 px-2.5 pb-1.5 text-[11px] text-zinc-400">点击分类名可筛选右侧列表</p>
      </div>
    </aside>

    <!-- 右：脚本管理（点击行内展开编辑） -->
    <div class="min-w-0 space-y-4">
      <div class="flex flex-wrap items-center gap-3">
        <h2 class="text-lg font-semibold tracking-tight">脚本管理</h2>
        <span class="font-mono text-xs text-zinc-400">{{ list.length }} 项</span>
        <button
          class="ml-auto inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition-all duration-300 sb-ease hover:bg-zinc-800 active:scale-[0.98]"
          @click="newScript"
        >
          <Plus :size="15" weight="bold" />
          新增脚本
        </button>
      </div>

      <div class="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <!-- 新增表单：就地展开在列表顶部 -->
        <div v-if="openId === 0" class="border-b-2 border-zinc-900">
          <ScriptForm :form="form" :cats="cats" :editing="false" @submit="submit" @cancel="cancelEdit" />
        </div>

        <div class="divide-y divide-zinc-100">
          <div v-for="s in list" :key="s.id">
            <button
              class="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left text-sm transition-colors duration-300 sb-ease hover:bg-zinc-50"
              :class="{ 'bg-zinc-50': openId === s.id }"
              @click="toggleRow(s)"
            >
              <span
                class="size-1.5 shrink-0 rounded-full"
                :class="s.enabled ? 'bg-emerald-500' : 'bg-zinc-300'"
                :title="s.enabled ? '已启用' : '已禁用'"
              />
              <span class="truncate font-medium text-zinc-800">{{ s.name }}</span>
              <span
                v-if="s.flags.includes('danger')"
                class="shrink-0 rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[11px] text-amber-700"
              >
                危险
              </span>
              <span
                v-if="s.flags.includes('root')"
                class="shrink-0 rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[11px] text-zinc-500"
              >
                root
              </span>
              <span class="ml-auto shrink-0 text-[11px] text-zinc-400">{{ s.entry_type === 'snippet' ? '内置' : '远程' }}</span>
              <ChevronRight
                :size="14"
                class="shrink-0 text-zinc-300 transition-transform duration-300 sb-ease"
                :class="openId === s.id ? 'rotate-90 text-zinc-600' : ''"
              />
            </button>
            <div v-if="openId === s.id" class="border-t border-zinc-100 bg-zinc-50/60">
              <ScriptForm :form="form" :cats="cats" :editing="true" @submit="submit" @cancel="cancelEdit" @remove="remove" />
            </div>
          </div>
        </div>
        <p v-if="list.length === 0" class="px-4 py-14 text-center text-sm text-zinc-400">
          暂无脚本，点右上角「新增脚本」创建
        </p>
      </div>
    </div>
  </div>
</template>
