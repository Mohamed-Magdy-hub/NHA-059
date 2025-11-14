# Multi-stage Dockerfile for production

# ---- Build stage (deps install) ----
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files for dependency installation
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# ---- Production image ----
FROM node:20-alpine
WORKDIR /app

# Install dumb-init to handle signals properly
RUN apk add --no-cache dumb-init

# Create non-root user for running the app
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy installed node_modules from build stage
COPY --from=build --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy only necessary application files
COPY --chown=nodejs:nodejs package.json ./
COPY --chown=nodejs:nodejs src/ ./src/
COPY --chown=nodejs:nodejs public/ ./public/

# Create data directory with correct permissions
RUN mkdir -p /app/data && \
    chown -R nodejs:nodejs /app/data

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_FILE=/app/data/urls.db

# Switch to non-root user
USER nodejs

# Expose application port
EXPOSE 3000

# Add healthcheck to ensure container is healthy
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/urls', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals and start the app
CMD ["dumb-init", "node", "src/index.js"]