# Backend Dockerfile - recettes_back/Dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
# copy package manifests first for caching
COPY package*.json ./
RUN npm install
RUN npm ci --only=production

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# copy only production node_modules
COPY --from=deps /app/node_modules ./node_modules


# copy app source
COPY . .
# installer bash et wait-for-it
RUN apk add --no-cache bash curl
COPY wait-for-it.sh /wait-for-it.sh
# expose the port your server listens on (change si besoin)
EXPOSE 5000
# healthcheck (optionnel)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD curl -sf http://localhost:5000/api/health || exit 1

CMD ["./wait-for-it.sh", "mongodb:27017", "--", "node", "server.js"]
