# ---- Base Stage ----
FROM node:20-slim AS base

# Prisma requires OpenSSL at runtime
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ---- Dependencies Stage ----
FROM base AS deps

COPY package*.json ./
# Install only production dependencies
RUN npm ci --omit=dev

# ---- Final Stage ----
FROM base AS runner

WORKDIR /app

# Copy production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy prisma schema and generate the Prisma client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy application source
COPY src ./src/

# Expose the application port
EXPOSE 3000

# Health check (optional but good practice)
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

COPY package*.json ./
CMD ["npm", "start"]
