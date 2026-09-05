#!/bin/sh
# spellbook 容器入口：初始化数据库 → 首次导入种子 → 注入管理密码 → 启动服务
set -e

DATA_DIR=/app/.wrangler

echo "[spellbook] 应用数据库结构（幂等，可重复执行）..."
npx wrangler d1 execute spellbook --local --file=schema.sql -y

if [ ! -f "$DATA_DIR/.seeded" ]; then
  echo "[spellbook] 首次启动，导入初始合集..."
  if node scripts/seed.mjs; then
    mkdir -p "$DATA_DIR"
    touch "$DATA_DIR/.seeded"
  else
    echo "[spellbook] 种子导入失败，可启动后在网页端「设置 → 恢复初始合集」手动导入"
  fi
fi

# wrangler pages dev 从 .dev.vars 读取环境变量型密钥
if [ -n "$ADMIN_PASSWORD" ]; then
  printf 'ADMIN_PASSWORD=%s\n' "$ADMIN_PASSWORD" > /app/.dev.vars
  echo "[spellbook] 管理密码已配置（写操作受保护）"
else
  echo "[spellbook] 未设置 ADMIN_PASSWORD，云端写接口将处于禁用（只读）状态"
fi

echo "[spellbook] 启动服务 http://0.0.0.0:8788 ..."
exec "$@"
