<script setup lang="ts">
import { ref } from 'vue'
import {
  PhHardDrive as HardDrive,
  PhCloud as Cloud,
  PhDownloadSimple as DownloadSimple,
  PhUploadSimple as UploadSimple,
  PhPlant as Sprout,
  PhCloudArrowUp as CloudArrowUp,
  PhTrash as Trash,
  PhSignOut as SignOut,
  PhInfo as Info,
} from '@phosphor-icons/vue'
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
  if (!confirm('将用初始合集（37 条精选常用脚本）替换当前全部数据，继续？')) return
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
  if (!confirm('确定清空本地全部数据？将删除所有分类与脚本（不会恢复初始合集），且不可恢复！')) return
  try {
    clearLocal()
    toast('本地数据已彻底清空')
  } catch {
    toast('操作失败', 'err')
  }
}
</script>

<template>
  <div class="grid items-start gap-6 md:grid-cols-2">
    <!-- 存储模式 -->
    <section class="sb-in rounded-xl border border-zinc-200 bg-white p-5" style="--i: 0">
      <h2 class="text-lg font-semibold tracking-tight">存储模式</h2>
      <p class="mt-1 mb-4 text-sm leading-relaxed text-zinc-500">本地模式存浏览器 localStorage；云端模式存 Cloudflare D1，任何设备可管理。</p>

      <dl class="space-y-2.5 border-t border-zinc-100 pt-4 text-sm">
        <div class="flex items-center justify-between gap-4">
          <dt class="text-zinc-500">云端 API</dt>
          <dd class="flex items-center gap-1.5">
            <span class="size-1.5 rounded-full" :class="store.health?.cloudReady ? 'bg-emerald-500' : 'bg-zinc-300'" />
            {{ store.health ? (store.health.cloudReady ? '可用' : '不可用') : '未检测到' }}
          </dd>
        </div>
        <div class="flex items-center justify-between gap-4">
          <dt class="text-zinc-500">密码保护</dt>
          <dd>{{ store.health?.protected ? '已启用' : '未配置' }}</dd>
        </div>
        <div class="flex items-center justify-between gap-4">
          <dt class="text-zinc-500">当前模式</dt>
          <dd class="font-medium">{{ store.mode === 'cloud' ? '云端（D1）' : '本地（浏览器）' }}</dd>
        </div>
      </dl>

      <div class="mt-4 grid grid-cols-2 gap-2">
        <button
          class="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-300 sb-ease active:scale-[0.98]"
          :class="store.mode === 'local' ? 'border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800' : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'"
          @click="doSwitch('local')"
        >
          <HardDrive :size="14" />
          本地模式
        </button>
        <button
          class="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-300 sb-ease active:scale-[0.98]"
          :class="store.mode === 'cloud' ? 'border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800' : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'"
          @click="doSwitch('cloud')"
        >
          <Cloud :size="14" />
          云端模式
        </button>
      </div>

      <div v-if="store.health?.protected" class="mt-4 space-y-3 border-t border-zinc-100 pt-4">
        <p v-if="store.token" class="flex items-center gap-2 text-sm">
          <span class="inline-flex items-center gap-1.5 text-emerald-700">
            <span class="size-1.5 rounded-full bg-emerald-500" />
            已登录
          </span>
          <button
            class="ml-auto inline-flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-zinc-500 transition-all duration-300 sb-ease hover:bg-zinc-50 hover:text-zinc-800"
            @click="logout"
          >
            <SignOut :size="12" />
            退出登录
          </button>
        </p>
        <template v-else>
          <p class="text-sm text-zinc-500">云端受密码保护，写操作前请登录：</p>
          <div class="flex gap-2">
            <input
              v-model="pw"
              type="password"
              placeholder="管理密码"
              class="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm transition-all duration-300 sb-ease placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5 focus:outline-none"
              @keyup.enter="doLogin"
            />
            <button
              class="shrink-0 cursor-pointer rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-all duration-300 sb-ease hover:bg-zinc-800 active:scale-[0.98]"
              @click="doLogin"
            >
              登录
            </button>
          </div>
        </template>
      </div>
      <p v-else-if="store.health?.cloudReady" class="mt-4 border-t border-zinc-100 pt-3 text-xs leading-relaxed text-zinc-400">
        未配置管理密码时云端写接口已禁用（只读）。在 Pages 环境变量中设置 ADMIN_PASSWORD 后重新部署即可启用。
      </p>
    </section>

    <!-- 数据管理 -->
    <section class="sb-in rounded-xl border border-zinc-200 bg-white p-5" style="--i: 1">
      <h2 class="text-lg font-semibold tracking-tight">数据管理</h2>
      <p class="mt-1 mb-4 text-sm text-zinc-500">操作作用于当前模式的数据。</p>
      <div class="space-y-2 border-t border-zinc-100 pt-4">
        <button
          class="inline-flex w-full cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-700 transition-all duration-300 sb-ease hover:bg-zinc-50 active:scale-[0.99]"
          @click="doExport"
        >
          <DownloadSimple :size="15" class="text-zinc-400" />
          导出 JSON
        </button>
        <label
          class="inline-flex w-full cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-700 transition-all duration-300 sb-ease hover:bg-zinc-50 active:scale-[0.99]"
        >
          <UploadSimple :size="15" class="text-zinc-400" />
          导入 JSON（替换数据）
          <input type="file" accept=".json,application/json" class="hidden" @change="onFile" />
        </label>
        <button
          class="inline-flex w-full cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-700 transition-all duration-300 sb-ease hover:bg-zinc-50 active:scale-[0.99]"
          @click="doSeed"
        >
          <Sprout :size="15" class="text-zinc-400" />
          恢复初始合集（37 条）
        </button>
        <button
          class="inline-flex w-full cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-700 transition-all duration-300 sb-ease hover:bg-zinc-50 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-40"
          :disabled="!store.health?.cloudReady || !store.token"
          @click="doPush"
        >
          <CloudArrowUp :size="15" class="text-zinc-400" />
          把本地数据推送到云端
        </button>
        <button
          class="inline-flex w-full cursor-pointer items-center gap-2 rounded-lg border border-red-200 px-3.5 py-2.5 text-sm text-red-600 transition-all duration-300 sb-ease hover:bg-red-50 active:scale-[0.99]"
          @click="doClear"
        >
          <Trash :size="15" />
          清空本地数据（完全清空，不恢复初始合集）
        </button>
      </div>
    </section>

    <!-- 关于 -->
    <section class="rounded-xl border border-zinc-200 bg-white p-5 md:col-span-2 sb-in" style="--i: 2">
      <h2 class="text-lg font-semibold tracking-tight">关于</h2>
      <div class="mt-3 max-w-[70ch] space-y-2 text-sm leading-relaxed text-zinc-500">
        <p class="flex items-start gap-2">
          <Info :size="15" class="mt-0.5 shrink-0 text-zinc-400" />
          Spellbook 是一个 VPS 脚本合集管理工具：在网页端维护脚本库，实时生成单文件 Bash 工具箱，VPS 一条命令安装使用。
        </p>
        <p>初始数据整理自 VPS 社区的公开分享，精选常用条目并逐条核对可用性（已剔除失效与有风险项）。</p>
        <p>部署说明见项目 README：推荐 GitHub Actions 全自动部署（推送即上线），另有 wrangler 手动部署与 Docker 自托管；管理端写操作由 ADMIN_PASSWORD 保护。</p>
      </div>
    </section>
  </div>
</template>
