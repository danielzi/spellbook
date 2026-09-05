# spellbook 自托管镜像
# 运行时使用 wrangler pages dev（workerd）承载静态站 + Pages Functions + 本地 D1，
# 数据通过挂载 /app/.wrangler 卷持久化。详见 docker-compose.yml 与 README。
FROM node:22-bookworm-slim

WORKDIR /app

# 先装依赖，充分利用镜像层缓存
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# 构建静态站 + 生成 functions/gen/template.ts（Functions 由 wrangler 启动时打包）
RUN npm run build

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 8788

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npx", "wrangler", "pages", "dev", "dist", "--ip", "0.0.0.0", "--port", "8788"]
