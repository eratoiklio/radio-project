FROM node:22-alpine AS builder

ENV NEXT_PUBLIC_API_BASE_URL=https://cms-gateway.polskieradio.pl/dev-proxy
ENV POLISH_RADIO_MEDIA_CDN_BASE_URL=https://cdn6.polskieradio.pl

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV NEXT_PUBLIC_API_BASE_URL=https://cms-gateway.polskieradio.pl/dev-proxy
ENV POLISH_RADIO_MEDIA_CDN_BASE_URL=https://cdn6.polskieradio.pl

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
