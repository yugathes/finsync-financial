# Multi-stage Dockerfile
# Stage 1: build the client and server artifacts
FROM node:20-bullseye-slim AS builder
WORKDIR /app

# Use corepack to ensure yarn is available and consistent
RUN corepack enable && corepack prepare yarn@stable --activate

# Copy package manifests and install all deps (including devDeps needed for build)
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source and run build (this runs `vite build` and esbuild per package.json)
COPY . .
RUN yarn build

# Stage 2: production image
FROM node:20-bullseye-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# Ensure yarn is available
RUN corepack enable && corepack prepare yarn@stable --activate

# Install only production dependencies
COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile --ignore-scripts

# Copy the built artifacts from the builder stage
COPY --from=builder /app/dist ./dist

# Expose the port the server listens on
EXPOSE 5000

# Default command starts the built server
CMD ["node", "dist/index.js"]
