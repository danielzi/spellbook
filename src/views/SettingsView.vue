<script setup lang="ts">
import { ref } from 'vue'
import {
  clearLocal,
  exportJson,
  importJson,
  importSeed,
  login,
  logout,
  pushLocalToCloud,
  store,
  switchMode,
  toast,
} from '../lib/store'

const pw = ref('')

async function doSwitch(mode: 'local' | 'cloud') {
  try {
    await switchMode(mode)
  } catch (e) {
    toast(e instanceof Error ? e.message : '切换失败', 'err')
  }
}
async function doLogin() {
  if (!pw.value) return
  try {
    await login(pw.value)
    pw.value = ''
  } catch (e) {
    toast(e instanceof Error ? e.message : '登录失败', 'err')
  }
}
function doExport() {
  const blob = new Blob([exportJson()], { type: 'application/json;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `spellbook-export-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(a.href)
  toast('已导出 JSON')
}
async function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  const f = input.files?.[0]
  if (!f) return
  try {
    const text = await f.text()
    if (!confirm(`确定用「${f.name}」里的数据替换当前${store.mode === 'cloud' ? '云端' : '本地'}全部数据？`)) return
    await importJson(text, '导入')
  } catch (err) {
    toast(err instanceof Error ? err.message : '导入失败', 'err')
  }
  input.value = ''
}
async function doSeed() {
  if (!confirm('将用初始合集（39 条精选常用脚本）替换当前全部数据，继续？')) return
  try {
    await importSeed()
  } catch (e) {
    toast(e instanceof Error ? e.message : '导入失败', 'err')
  }
}
async function doPush() {
  if (!confirm('确定把当前本地数据推送到云端？将覆盖云端全部数据。')) return
  try {
    await pushLocalToCloud()
  } catch (e) {
    toast(e instanceof Error ? e.message : '推送失败', 'err')
  }
}
async function doClear() {
  if (!confirm('清空本地数据并重置为初始合集？')) return
  try {
    clearLocal()
    toast('本地数据已重置为初始合集')
  } catch {
    toast('操作失败', 'err')
  }
}
</script>

<template>
  <div class="grid gap-5 md:grid-cols-2">
    <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h2 class="font-bold text-lg mb-3">☁️ 存储模式</h2>
      <dl class="text-sm space-y-1.5 mb-4">
        <div class="flex justify-between">
          <dt class="text-slate-500">云端 API</dt>
          <dd>{{ store.health ? (store.health.cloudReady ? '✅ 可用' : '❌ 不可用') : '— 未检测到' }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-slate-500">密码保护</dt>
          <dd>{{ store.health ? (store.health.protected ? '🔒 已启用' : '⚠️ 未配置 ADMIN_PASSWORD，云端写接口已禁用') : '—' }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-slate-500">当前模式</dt>
          <dd class="font-medium">{{ store.mode === 'cloud' ? '云端（D1）' : '本地（浏览器）' }}</dd>
        </div>
      </dl>
      <div class="flex gap-2">
        <button
          class="px-3 py-2 rounded-lg text-sm border transition"
          :class="store.mode === 'local' ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300 hover:bg-slate-50'"
          @click="doSwitch('local')"
        >
          💾 本地模式
        </button>
        <button
          class="px-3 py-2 rounded-lg text-sm border transition"
          :class="store.mode === 'cloud' ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300 hover:bg-slate-50'"
          @click="doSwitch('cloud')"
        >
          ☁️ 云端模式
        </button>
      </div>

      <div v-if="store.health?.protected" class="mt-4 pt-4 border-t border-slate-100">
        <p v-if="store.token" class="text-sm flex items-center gap-2">
          <span class="text-emerald-600">● 已登录</span>
          <button class="text-xs px-2 py-1 rounded border border-slate-300 hover:bg-slate-50" @click="logout">退出登录</button>
        </p>
        <template v-else>
          <p class="text-sm text-slate-500 mb-2">云端受密码保护，写操作前请登录：</p>
          <div class="flex gap-2">
            <input
              v-model="pw"
              type="password"
              placeholder="管理密码"
              class="flex-1 px-2.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              @keyup.enter="doLogin"
            />
            <button class="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700" @click="doLogin">登录</button>
          </div>
        </template>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h2 class="font-bold text-lg mb-3">🗃️ 数据管理</h2>
      <div class="space-y-2.5 text-sm">
        <button class="w-full text-left px-3 py-2.5 rounded-lg border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 transition" @click="doExport">
          ⬇️ 导出 JSON（当前{{ store.mode === 'cloud' ? '云端' : '本地' }}全部数据）
        </button>
        <label class="block w-full text-left px-3 py-2.5 rounded-lg border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 transition cursor-pointer">
          ⬆️ 导入 JSON（替换{{ store.mode === 'cloud' ? '云端' : '本地' }}数据）
          <input type="file" accept=".json,application/json" class="hidden" @change="onFile" />
        </label>
        <button class="w-full text-left px-3 py-2.5 rounded-lg border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 transition" @click="doSeed">
          🌱 恢复初始合集（39 条精选常用脚本）
        </button>
        <button
          class="w-full text-left px-3 py-2.5 rounded-lg border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="!store.health?.cloudReady || !store.token"
          @click="doPush"
        >
          ☁️ 把本地数据推送到云端（覆盖）
        </button>
        <button class="w-full text-left px-3 py-2.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition" @click="doClear">
          🗑️ 清空本地数据（重置为初始合集）
        </button>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm md:col-span-2">
      <h2 class="font-bold text-lg mb-2">ℹ️ 关于</h2>
      <div class="text-sm text-slate-600 space-y-1.5 leading-relaxed">
        <p>spellbook 是一个 VPS 脚本合集管理工具：在网页端维护脚本库，实时生成单文件 Bash 工具箱，VPS 一条命令安装使用。</p>
        <p>初始数据整理自 VPS 社区的公开分享，精选常用条目并逐条核对可用性（已剔除失效与有风险项）。</p>
        <p>部署说明见项目 README：绑定 D1、配置 ADMIN_PASSWORD、连接 GitHub 自动部署。</p>
      </div>
    </div>
  </div>
</template>
