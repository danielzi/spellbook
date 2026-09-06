# 📖 Spellbook · VPS 脚本宝典

**Spellbook** 是一个 VPS 脚本合集管理工具：在网页端维护脚本库（分类 / 说明 / 标签 / 启停），一键生成单文件 Bash 工具箱部署到 VPS。网页上改完合集，VPS 上执行 `spellbook update` 即可同步，一键安装命令永远不变。

```
┌────────────────────────────┐         ┌──────────────────────────────────┐
│  管理端（浏览器 / 手机）      │         │  VPS                             │
│  · 脚本库：浏览 / 搜索 / 复制 │  生成    │  bash <(curl -sL 地址/spellbook.sh) │
│  · 编辑器：增删改脚本与分类    │ ──────▶ │  交互菜单 / spellbook <编号> 直达  │
│  · 存储本地或 Cloudflare D1  │         │  spellbook update 同步更新        │
└────────────────────────────┘         └──────────────────────────────────┘
```

## ✨ 功能特性

**Web 管理端**（Vue 3 + TailwindCSS）

- 📖 **脚本库**：按分类浏览、关键词搜索、一键复制命令、启停开关，每条脚本附项目 GitHub 仓库直达链接
- ✏️ **编辑器**：点击脚本名行内展开编辑；分类管理；标签体系（需 root / 危险 / 已停更）；支持远程命令与多行内置脚本两种类型
- ⚡ **生成发布**：一键安装命令、下载 `spellbook.sh`、实时预览生成结果
- ⚙️ **双模式存储**：默认浏览器 localStorage 开箱即用；登录后切换云端 Cloudflare D1，任何设备可管理；支持 JSON 导入/导出与数据推送
- 🔒 **密码保护**：管理端写操作需密码登录（HMAC token），浏览与脚本拉取不受限

**VPS 工具箱**（生成的单文件 Bash，兼容 Debian / Ubuntu / CentOS，仅需 curl 或 wget）

- 中文彩色交互菜单：分类 → 条目 → 展示说明与命令 → 确认执行
- 危险条目（DD 重装等）需输入 `yes` 二次确认；需 root 条目自动检查权限
- `spellbook <编号>` 直达执行、`search` 搜索、`list` 列表、`install` 安装、`update` 自更新
- 收藏与自定义命令保存在 VPS 本地（`~/.spellbook/`），更新工具箱不受影响
- 所有数据 base64 编码内嵌，杜绝注入与引号转义问题

---

## 🚀 部署

| 方式 | 适合 | 数据存储 | 一句话概括 |
|---|---|---|---|
| **方式一 · GitHub Actions 全自动**（推荐） | 长期使用、多设备管理 | Cloudflare D1 | 推送代码即上线，建库/迁移/种子/发布全自动 |
| **方式二 · Cloudflare Pages 手动** | 偏好本地命令行控制 | Cloudflare D1 | wrangler 逐步执行，过程完全可控 |
| **方式三 · Docker Compose 自托管** | 内网 / 数据不出门 | 宿主机 `./data` | 数据完全本地，一条命令起服务 |
| 本地开发 | 二次开发 | 浏览器 localStorage | `npm run dev` 即用，见文末 |

> 四种方式的管理端界面与生成的工具箱完全一致；数据可通过「设置 → 导出/导入 JSON」互相迁移。

---

### 方式一：GitHub Actions 全自动部署（推荐）

**本地不需要安装任何东西。** 建库、迁移、种子、构建、发布全部由 GitHub Actions 完成，只要一个 Cloudflare 账号和一个 GitHub 仓库。

> 💡 **Fork 部署**：Fork 本仓库后同样适用——Fork 后先到 Actions 页启用 workflows（Fork 默认禁用），再按下面步骤配好 Secret 即可部署属于你自己的实例。数据库在**你自己的 Cloudflare 账号**里，数据与他人完全独立；上游更新时用「Sync fork」跟进，不影响你的数据。

**① 推送代码到 GitHub**

```bash
git remote add origin https://github.com/<你>/spellbook.git
git push -u origin main
```

**② 配置 3 个 Secret**

GitHub 仓库 → Settings → Secrets and variables → Actions → New repository secret：

| Secret | 必填 | 说明 |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | ✅ | 在 [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens) 创建自定义令牌，权限勾选 **Account · D1 · Edit** 与 **Account · Cloudflare Pages · Edit** |
| `CLOUDFLARE_ACCOUNT_ID` | ✅ | Cloudflare 控制台首页右侧的「账户 ID」 |
| `ADMIN_PASSWORD` | ➖ 选填 | 管理端登录密码，建议强随机串；不配置则站点只读 |

**③ 触发部署**

推送到 `main` 自动触发；也可在仓库 Actions 页选择「Deploy to Cloudflare Pages」→ Run workflow 手动执行。

流水线自动完成：构建 → 创建 D1 并注入 ID → 应用表结构 → 空库导入初始合集 → 创建 Pages 项目 → 同步管理密码 → 发布，约 2 分钟跑完。

> 🔖 **关于访问域名**：不需要自己创建或注册，Cloudflare 在项目首次部署成功后**自动生成** `https://<项目名>.pages.dev`（本项目默认项目名 `spellbook`）。注意 `.pages.dev` 的子域名在**所有 Cloudflare 用户中全局唯一**——如果 `spellbook` 已被占用，流水线会明确报错，此时在仓库 **Settings → Secrets and variables → Variables** 页签（注意不是 Secrets）新建 `PAGES_PROJECT_NAME`（如 `spellbook-v2`）重新运行即可；部署后也可在 Pages 项目 → Custom domains 绑定自己的域名。
>
> 部署日志里形如 `fa3e1195.<项目名>.pages.dev` 的地址是**单次部署的快照链接**（永远指向那一次构建的版本）；日常使用**不带哈希前缀**的 `https://<项目名>.pages.dev`，它始终指向最新版本。

**④ 开始使用**

打开站点（`https://<项目名>.pages.dev`）→ 设置页登录（即 `ADMIN_PASSWORD`）→ 切换云端模式即可管理。VPS 侧：

```bash
bash <(curl -sL https://<项目名>.pages.dev/spellbook.sh) install
```

**日常维护**

- 更新脚本库：网页端直接改，VPS 数据即时可用（脚本按需拉取）
- 升级程序：`git push` 后自动重新部署；数据库已有数据不会被覆盖
- 改管理密码：更新 `ADMIN_PASSWORD` Secret 后重新运行 workflow

> ⚠️ **安全提示**：站点公开可访问，任何人都能浏览与拉取脚本，`ADMIN_PASSWORD` 只保护管理端写操作；该密码请勿与其他重要账户复用。

---

### 方式二：Cloudflare Pages 手动部署（wrangler）

偏好本地命令行逐步控制时使用。前置要求：[Node.js](https://nodejs.org) ≥ 20、Cloudflare 账号。

**① 初始化**

```bash
git clone <你的仓库地址> spellbook && cd spellbook
npm install
npx wrangler login                  # 首次使用需登录 Cloudflare
npx wrangler d1 create spellbook    # 输出 database_id，复制它
```

把输出的 `database_id` 填入 [wrangler.jsonc](wrangler.jsonc)，然后：

```bash
npm run d1:migrate:remote           # 远程建表
npm run seed:remote                 # 导入初始合集（37 条，可选）
npm run deploy                      # 首次会自动创建 Pages 项目
```

> 访问域名同样是自动生成的 `https://<项目名>.pages.dev`（项目名取自 wrangler.jsonc 的 `name`，全局唯一；被占用就换一个名字）。部署后也可在 Pages 项目 → Custom domains 绑定自己的域名。

**② 配置管理密码**

```bash
npx wrangler pages secret put ADMIN_PASSWORD --project-name spellbook
```

不配置时站点为**只读**（可浏览、可拉脚本，改不了数据）。

**③ 开始使用**

打开 `https://<项目名>.pages.dev` → 设置页登录 → 切换云端模式。VPS 侧：

```bash
bash <(curl -sL https://<项目名>.pages.dev/spellbook.sh) install
```

> 以后更新程序：`git pull && npm install && npm run deploy`；脚本库内容照旧在网页端维护，无需重新部署。

---

### 方式三：Docker Compose 自托管

前置要求：宿主机装有 Docker 与 Docker Compose 插件。数据持久化在宿主机 `./data` 目录，不经过任何第三方。

```bash
git clone <你的仓库地址> spellbook && cd spellbook
ADMIN_PASSWORD=你的管理密码 docker compose up -d --build
```

打开 `http://<宿主机IP>:8788` 即可使用。容器启动时自动完成：建表（幂等）→ 首次导入初始合集 → 注入管理密码。

**常用操作**

```bash
# 升级版本（拉新代码重建镜像，./data 数据不受影响）
git pull && docker compose up -d --build

# 日志与状态
docker compose logs -f
docker compose ps

# 备份（SQLite 直接拷贝）
docker compose stop spellbook
tar czf spellbook-backup.tar.gz data/
docker compose start spellbook

# 恢复备份：解压覆盖 data/ 后重启
# 修改密码：改 ADMIN_PASSWORD 后 docker compose up -d --force-recreate
```

> **定位说明**：容器内使用 workerd 运行时同时承载静态站、Functions API 与本地 D1，适合个人与内网场景；对外长期服务建议使用方式一（Cloudflare 免费额度足够，自带全球 CDN 与 HTTPS）。

---

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

## 📖 使用说明

### 管理端

- **脚本库**：按分类浏览；搜索框匹配名称/描述/命令；`复制` 拷贝命令本身；开关可禁用条目（禁用后不出现在生成的工具箱中，数据保留）；点「GitHub 仓库 ↗」直达项目主页
- **编辑器**：左侧管理分类（图标/名称/排序），点击分类名筛选列表；**点击脚本名行即在该行下方展开编辑表单**；「＋ 新增脚本」在列表顶部展开表单
- **生成发布**：展示当前站点的一键安装命令与下载入口；工具标题/版本号会写入脚本头部；可展开预览完整脚本
- **设置**：本地/云端模式切换、登录、JSON 导入/导出、恢复初始合集、本地数据推送云端

**脚本字段说明**

| 字段 | 说明 |
|---|---|
| 类型 · 远程命令 | 一行命令，工具箱里通过 `bash -c` 执行，如 `bash <(curl -sL …)` |
| 类型 · 内置脚本 | 多行命令直接内嵌在工具箱文件里，无需外部下载（如 sysctl 配置） |
| 🔑 需 root | 执行前检查 root 权限，非 root 直接拦截 |
| ⚠️ 危险 | 需输入 `yes` 二次确认（DD 重装、PVE 等清盘操作务必勾选） |
| 💤 已停更 | 标记过时条目，仅作提示仍可执行 |
| 仓库地址 | 项目主页 / GitHub 链接，卡片上显示「GitHub 仓库 ↗」 |
| 排序 | 数字小的排在前面 |

### VPS 工具箱

```bash
# 方式① 直接打开菜单
bash <(curl -sL https://你的站点/spellbook.sh)
# 方式② 安装为系统命令（推荐，装完直接敲 spellbook）
bash <(curl -sL https://你的站点/spellbook.sh) install
```

| 命令 / 操作 | 作用 |
|---|---|
| `spellbook`（无参数） | 交互菜单：数字选分类，`f` 收藏，`c` 自定义命令，`u` 更新，`i` 安装，`q` 退出 |
| `spellbook <编号>` | 直达执行（编号见 `spellbook list`） |
| `spellbook list` | 列出全部脚本及编号 |
| `spellbook search 关键词` | 搜索（不分大小写） |
| `spellbook update` | 从站点重新拉取最新工具箱并覆盖安装 |
| `spellbook install` | 安装到 `/usr/local/bin/spellbook`（需 root） |
| 菜单中 `f编号` | 收藏 / 取消收藏 |
| 收藏/自定义菜单 `a`、`d编号` | 添加、删除自定义命令 |

收藏与自定义命令保存在 VPS 的 `~/.spellbook/favorites.conf` 与 `custom.conf`，`spellbook update` 不受影响。

---

## 🔐 数据说明与安全

- **数据在哪**：本地模式存浏览器 localStorage；方式一/二存 Cloudflare D1；方式三存宿主机 `./data`。模式间用 JSON 导入/导出或「推送到云端」迁移
- **密码安全**：`ADMIN_PASSWORD` 只存在于服务端（Secret / 环境变量）；登录签发 7 天有效 HMAC token；所有写接口校验，读取接口开放
- **脚本安全**：工具箱生成时所有数据 base64 编码内嵌，无注入风险；但脚本内容来自社区，**执行前请自行确认来源可靠**
- **初始数据**：`seed/default.json` 精选 37 条常用脚本（11 个分类），**每条均附项目 GitHub 仓库地址**，全部逐一到 GitHub 核对过存在性与维护状态；已剔除失效项目（失效短链、仓库 404、无公开仓库），个别归档但功能完好的经典脚本在描述中注明

## ❓ 常见问题

- **打开站点提示「云端 API 不可用」？** 纯静态托管（无 Functions）或未绑定 D1。管理端自动回退本地模式，不影响使用
- **写操作报「未配置 ADMIN_PASSWORD」？** 按所选方式补配：方式一添加 `ADMIN_PASSWORD` Secret 后重新运行 Actions；方式二 `npx wrangler pages secret put ADMIN_PASSWORD --project-name spellbook`；Docker 改环境变量后 `docker compose up -d --force-recreate`
- **`/spellbook.sh` 返回一段报错脚本？** 数据库还没迁移：方式一查看 Actions 日志中「应用数据库结构」一步；方式二执行 `npm run d1:migrate:remote`；Docker 重启容器自动迁移
- **`spellbook update` 提示未内嵌来源地址？** 该脚本来自本地模式下载；从部署站点重新拉取即可（站点渲染的脚本都带自更新地址）
- **本地和云端数据不一致？** 在「设置」导出一份再导入另一端，或用「把本地数据推送到云端」

## 🧩 目录结构与开发命令

```
spellbook/
├── .github/workflows/deploy.yml   # GitHub Actions 全自动部署
├── src/                           # Vue 3 管理端（views/ 页面，lib/ 存储适配层，components/ 组件）
├── functions/                     # CF Pages Functions（api/ CRUD 鉴权，spellbook.sh.ts 脚本渲染）
├── shared/                        # 前后端共享：types.ts / render.ts / spellbook.sh.tpl 模板
├── scripts/                       # gen-tpl.mjs 构建步骤、seed.mjs 种子导入
├── seed/default.json              # 初始合集数据
├── schema.sql                     # D1 建表脚本
├── Dockerfile / docker-compose.yml / docker-entrypoint.sh   # Docker 自托管
└── wrangler.jsonc                 # Cloudflare Pages + D1 绑定配置
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

## 📄 许可证

本项目代码基于 [MIT License](LICENSE) 开源。收录的第三方 VPS 脚本版权归原作者所有，本项目仅提供链接与管理界面，使用前请遵循各脚本自身的许可与条款。
