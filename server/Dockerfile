# Production API image for Abol Coffee
# Build from server/: docker build -t abol-coffee-api .

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.json prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4001
ENV UPLOADS_DIR=/app/uploads

RUN addgroup -S abol && adduser -S abol -G abol \
  && mkdir -p /app/uploads \
  && chown -R abol:abol /app

COPY --from=build --chown=abol:abol /app/package.json /app/package-lock.json ./
COPY --from=build --chown=abol:abol /app/node_modules ./node_modules
COPY --from=build --chown=abol:abol /app/dist ./dist
COPY --from=build --chown=abol:abol /app/prisma ./prisma
COPY --from=build --chown=abol:abol /app/prisma.config.ts ./prisma.config.ts

USER abol
EXPOSE 4001
VOLUME ["/app/uploads"]

CMD ["npm", "run", "start:prod"]
