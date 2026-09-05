// 构建前把 shared/spellbook.sh.tpl 转成 functions/gen/template.ts（Pages Functions 无自定义 loader 支持）
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'

const tpl = readFileSync(path.join(process.cwd(), 'shared', 'spellbook.sh.tpl'), 'utf8')
const outDir = path.join(process.cwd(), 'functions', 'gen')
mkdirSync(outDir, { recursive: true })
writeFileSync(
  path.join(outDir, 'template.ts'),
  `// 自动生成：npm run build 时由 scripts/gen-tpl.mjs 从 shared/spellbook.sh.tpl 生成，请勿手改\nexport default ${JSON.stringify(tpl)};\n`,
)
console.log('已生成 functions/gen/template.ts')
