// 把 seed/default.json 导入 D1 数据库（本地或远程）
// 用法：npm run seed（本地） / npm run seed:remote（远程）
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const remote = process.argv.includes('--remote')
const seed = JSON.parse(readFileSync(path.join(process.cwd(), 'seed', 'default.json'), 'utf8'))

const q = (s) => String(s).replace(/'/g, "''")
const stmts = ['DELETE FROM scripts;', 'DELETE FROM categories;', 'DELETE FROM settings;']

let tmpId = 100000
const catIds = new Map()
for (const c of seed.categories) {
  const id = c.id > 0 ? c.id : tmpId++
  catIds.set(c.id, id)
  stmts.push(`INSERT INTO categories (id, name, icon, sort) VALUES (${id}, '${q(c.name)}', '${q(c.icon || '')}', ${c.sort || 0});`)
}
for (const s of seed.scripts) {
  const cid = catIds.get(s.category_id)
  if (!cid) continue
  const id = s.id > 0 ? s.id : tmpId++
  stmts.push(
    `INSERT INTO scripts (id, category_id, name, description, command, entry_type, flags, enabled, sort, repo) VALUES (${id}, ${cid}, '${q(s.name)}', '${q(s.description || '')}', '${q(s.command)}', '${s.entry_type}', '${q(JSON.stringify(s.flags || []))}', ${s.enabled === false ? 0 : 1}, ${s.sort || 0}, '${q(s.repo || '')}');`,
  )
}
if (seed.settings?.title) stmts.push(`INSERT INTO settings (key, value) VALUES ('title', '${q(seed.settings.title)}');`)
if (seed.settings?.version) stmts.push(`INSERT INTO settings (key, value) VALUES ('version', '${q(seed.settings.version)}');`)

const sqlFile = path.join(tmpdir(), `spellbook-seed-${Date.now()}.sql`)
writeFileSync(sqlFile, stmts.join('\n'))
console.log(`生成 ${stmts.length} 条 SQL，${remote ? '导入远程' : '导入本地'} D1 ...`)
const r = spawnSync('npx', ['wrangler', 'd1', 'execute', 'spellbook', remote ? '--remote' : '--local', '--file', sqlFile, '-y'], {
  stdio: 'inherit',
  shell: true,
})
unlinkSync(sqlFile)
process.exit(r.status ?? 1)
