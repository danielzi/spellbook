# 📖 Spellbook · VPS 脚本宝典

一个 **VPS 脚本合集管理工具**：在网页端维护你的脚本库（分类 / 说明 / 标签 / 启停），实时生成单文件 Bash 工具箱部署到 VPS。网页上改完合集，VPS 上 `spellbook update` 一条命令即可同步，一键安装命令永远不变。

```
┌────────────────────────────┐         ┌─────────────────────────────────┐
│  管理端（浏览器 / 手机）      │         │  VPS                            │
│  · 脚本库：浏览 / 搜索 / 复制 │  生成    │  bash <(curl -sL 地址/spellbook.sh) │
│  · 编辑器：增删改脚本与分类    │ ──────▶ │  交互菜单 / spellbook <编号> 直达 │
│  · 存储本地或 Cloudflare D1  │         │  spellbook update 同步更新       │
└────────────────────────────┘         └─────────────────────────────────┘
```

## 功能特性

**Web 管理端**（Vue 3 + TailwindCSS）
- 📖 脚本库：分类浏览、关键词搜索、一键复制命令、启停开关、**项目仓库直达链接**
- ✏️ 编辑器：点击脚本名行内展开编辑；分类管理；标签（需 root / 危险 / 已停更）；类型（远程命令 / 多行内置脚本）；每条脚本可附 GitHub 仓库地址
- ⚡ 生成发布：一键安装命令、下载 `spellbook.sh`、实时预览生成结果
- ⚙️ 设置：**双模式存储**——默认浏览器 localStorage 开箱即用，登录后切换云端 D1；JSON 导入/导出、本地数据推送云端、一键恢复初始合集
- 🔒 管理密码保护写操作，查看与脚本拉取不受限

**生成的 VPS 工具箱**（单文件 Bash，兼容 Debian/Ubuntu/CentOS，仅需 curl 或 wget）
- 中文彩色交互菜单：分类 → 条目 → 显示说明与命令 → 确认执行
- 危险条目需输入 `yes` 二次确认；需 root 条目自动检查权限
- `spellbook <编号>` 直达、`search` 搜索、`list` 列表、`install` 安装、`update` 自更新
- 收藏与自定义命令（存于 VPS 的 `~/.spellbook/`）
- 数据字段 base64 编码内嵌，杜绝注入与引号转义问题

---

## 部署

| 方式 | 适合 | 数据存储 | 特点 |
|---|---|---|---|
| **Cloudflare Pages**（推荐） | 长期使用、多设备管理 | Cloudflare D1 | 免费额度足够、全球访问、HTTPS 自动 |
| **Docker Compose 自托管** | 内网 / 不想用 CF | 宿主机 `./data` | 数据完全本地，一条命令起服务 |
| **本地开发** | 二次开发 | 浏览器 localStorage | 零部署，`npm run dev` 即用 |

三种方式的管理端界面和生成脚本完全一致，数据可通过「设置 → 导出/导入 JSON」互相迁移。

### 方式一：Cloudflare Pages（推荐）

前置要求：[Node.js](https://nodejs.org) ≥ 20、一个 [Cloudflare](https://dash.cloudflare.com) 账号。

```bash
git clone <你的仓库地址> spellbook && cd spellbook   # 或解压源码
npm install
```

**1️⃣ 创建数据库并初始化**

```bash
npx wrangler login                  # 首次使用需登录 Cloudflare
npx wrangler d1 create spellbook    # 输出 database_id，复制它
```

把输出的 `database_id` 填入 [wrangler.jsonc](wrangler.jsonc)，然后：

```bash
npm run d1:migrate:remote           # 远程建表
npm run seed:remote                 # 导入初始合集（39 条，可选）
```

**2️⃣ 发布（二选一）**

- **Git 自动部署**：把仓库推到 GitHub/GitLab → Cloudflare 控制台 → Workers & Pages → 创建 Pages 项目 → 连接仓库，构建命令 `npm run build`，输出目录 `dist`。
- **命令行直发**：`npm run deploy`（首次会引导创建 Pages 项目，项目名取自 wrangler.jsonc 的 `name`）。

**3️⃣ 配置管理密码（重要）**

Pages 控制台 → 项目 → Settings → Environment variables → 为 **Production（和 Preview）** 添加：

| 变量 | 说明 |
|---|---|
| `ADMIN_PASSWORD` | 管理端写操作的登录密码，建议强随机串 |

不配置时站点为**只读**（可浏览、可拉脚本，改不了数据）。配置后重新部署生效。

完成。打开 `https://<项目名>.pages.dev` → 设置页登录 → 切换云端模式即可管理。VPS 侧使用：

```bash
bash <(curl -sL https://<项目名>.pages.dev/spellbook.sh) install
```

> **部署核对**：以下链路已在本仓库验证通过——全新克隆 → `npm ci` → `npm run build`（自动生成 Functions 所需模板）→ `wrangler pages dev` 启动 → API / 静态站 / 脚本渲染正常。Git 集成构建执行的就是同一组命令；唯一需要账号才能做的是首次上传与 D1 远程迁移（即上面 1️⃣ 的两条命令）。

### 方式二：Docker Compose 自托管

前置要求：宿主机装有 Docker 与 Docker Compose 插件。

```bash
git clone <你的仓库地址> spellbook && cd spellbook
ADMIN_PASSWORD=你的管理密码 docker compose up -d --build
```

打开 `http://<宿主机IP>:8788` 即可使用。容器启动时会自动：建表（幂等）→ 首次导入初始合集 → 从环境变量注入管理密码。

常用操作：

```bash
# 更新版本（拉取新代码后重建镜像，数据在 ./data 不受影响）
git pull && docker compose up -d --build

# 查看日志 / 状态
docker compose logs -f
docker compose ps

# 备份数据（SQLite 直接拷贝即可）
docker compose stop spellbook
tar czf spellbook-backup.tar.gz data/
docker compose start spellbook

# 恢复备份：解压覆盖 data/ 后重启
# 修改管理密码：改 ADMIN_PASSWORD 后 docker compose up -d --force-recreate
```

> **说明**：容器内使用 `wrangler pages dev`（workerd 运行时）同时承载静态站、Functions API 和本地 D1，数据持久化在宿主机 `./data` 目录。此方式面向个人与内网场景；对外长期服务建议使用方式一（Cloudflare 免费额度足够，且自带全球 CDN 与 HTTPS）。

### 本地开发

```bash
npm install
npm run dev                # 纯前端 + localStorage，http://localhost:5173
```

本地全栈联调（D1 + Functions）：

```bash
npm run d1:migrate:local            # 本地 D1 建表
npm run seed                        # 导入初始合集
cp .dev.vars.example .dev.vars      # 设置本地管理密码
npm run pages:dev                   # http://127.0.0.1:8788
```

---

## 使用说明

### 管理端

**📖 脚本库**：按分类浏览所有脚本；搜索框匹配名称/描述/命令；`复制` 拷贝命令本身；右上开关可禁用条目（禁用后不出现在生成的工具箱中，数据保留）。

**✏️ 编辑器**：
- 左侧管理分类（图标 / 名称 / 排序），点击分类名筛选右侧列表
- **点击脚本名称行即在该行下方展开编辑表单**，再点收起；「＋ 新增脚本」在列表顶部展开表单
- 表单字段：

| 字段 | 说明 |
|---|---|
| 类型 · 远程命令 | 一行命令，工具箱里通过 `bash -c` 执行，如 `bash <(curl -sL …)` |
| 类型 · 内置脚本 | 多行命令直接内嵌在工具箱文件里，无需外部下载（如 sysctl 配置） |
| 🔑 需 root | 执行前检查 root 权限，非 root 直接拦截 |
| ⚠️ 危险 | 需输入 `yes` 二次确认（DD 重装、PVE 等清盘操作务必勾选） |
| 💤 已停更 | 标记过时条目，仅作提示仍可执行 |
| 排序 | 数字小的排在前面 |

**⚡ 生成发布**：显示当前站点的一键安装命令与下载入口；修改工具标题 / 版本号（会写入脚本头部）；展开可预览生成的完整脚本。

**⚙️ 设置**：
- 存储模式切换：本地（浏览器）/ 云端（D1）；云端受密码保护时需先登录
- 数据管理：导出 JSON（备份）、导入 JSON（整库替换）、恢复初始合集、本地数据推送云端、清空本地数据

### VPS 工具箱

```bash
# 方式① 直接打开菜单
bash <(curl -sL https://你的站点/spellbook.sh)
# 方式② 安装为系统命令（推荐，装完直接敲 spellbook）
bash <(curl -sL https://你的站点/spellbook.sh) install
```

| 命令 / 操作 | 作用 |
|---|---|
| `spellbook`（无参数） | 打开交互菜单，数字选分类，`f` 收藏，`c` 自定义命令，`u` 更新，`i` 安装，`q` 退出 |
| `spellbook <编号>` | 直达执行对应脚本（编号见 `spellbook list`） |
| `spellbook list` | 列出全部脚本及编号 |
| `spellbook search 关键词` | 搜索（不分大小写） |
| `spellbook update` | 从站点重新拉取最新工具箱并覆盖安装 |
| `spellbook install` | 安装到 `/usr/local/bin/spellbook`（需 root） |
| 菜单中 `f编号` | 收藏 / 取消收藏该脚本 |
| 收藏/自定义菜单 `a`、`d编号` | 添加、删除自定义命令 |

收藏与自定义命令保存在 VPS 的 `~/.spellbook/favorites.conf` 与 `custom.conf`，更新工具箱不受影响。

---

## 数据说明与安全

- **数据在哪**：本地模式存浏览器 localStorage；云端模式存 Cloudflare D1；Docker 模式存宿主机 `./data`。模式之间用 JSON 导入/导出或「推送到云端」迁移。
- **密码安全**：`ADMIN_PASSWORD` 只存在于服务端环境变量；登录签发 7 天有效 HMAC token；所有写接口校验，只读接口开放。
- **脚本安全**：生成工具箱时所有数据 base64 编码内嵌，无注入风险；但脚本内容本身来自社区，**执行前请自行确认来源可靠**。
- **初始数据**：`seed/default.json` 精选 37 条常用脚本（11 个分类），**每条均附项目 GitHub 仓库地址**，全部逐一到 GitHub 核对过存在性与维护状态；已剔除失效项目（git.io / ghproxy 短链、仓库已 404 的脚本、无公开仓库的脚本），个别经典脚本仓库已归档但功能完好的会在描述中注明。

## 常见问题

- **打开站点提示「云端 API 不可用」？** 纯静态托管（无 Functions）或未绑定 D1。管理端自动回退本地模式，不影响使用。
- **写操作报「未配置 ADMIN_PASSWORD」？** 按部署文档第 3 步配置环境变量后重新部署/重建容器。
- **`/spellbook.sh` 返回一段报错脚本？** 数据库还没迁移。执行 `npm run d1:migrate:remote`（CF）或重启容器（Docker 自动迁移）。
- **`spellbook update` 提示未内嵌来源地址？** 该脚本来自本地模式下载；从部署站点重新拉取即可（站点渲染的脚本都带自更新地址）。
- **本地和云端数据不一致？** 在「设置」里导出一份再导入另一端，或用「把本地数据推送到云端」。

## 目录结构与开发命令

```
spellbook/
├── src/                     # Vue 3 管理端（views/ 页面，lib/ 存储适配层，components/ 通用组件）
├── functions/               # CF Pages Functions（api/ CRUD 鉴权，spellbook.sh.ts 脚本渲染）
├── shared/                  # 前后端共享：types.ts 数据结构、render.ts 渲染器、spellbook.sh.tpl 模板
├── scripts/                 # gen-tpl.mjs 构建步骤、seed.mjs 种子导入
├── seed/default.json        # 初始合集数据
├── schema.sql               # D1 建表脚本
├── Dockerfile / docker-compose.yml / docker-entrypoint.sh   # Docker 自托管
└── wrangler.jsonc           # Cloudflare Pages + D1 绑定配置
```

| 命令 | 作用 |
|---|---|
| `npm run dev` | 前端开发服务器（localStorage 模式） |
| `npm run build` | 生成模板 + 构建静态站到 dist/ |
| `npm run pages:dev` | 本地全栈（静态站 + Functions + 本地 D1） |
| `npm run d1:migrate:local / :remote` | 本地 / 远程 D1 建表 |
| `npm run seed / seed:remote` | 本地 / 远程导入种子数据 |
| `npm run deploy` | 构建并部署到 Cloudflare Pages |
| `npm run check`、`npm run check:fn` | 前端 / Functions 类型检查 |
