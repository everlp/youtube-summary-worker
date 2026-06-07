# Use Node.js LTS slim image
FROM node:20-slim AS builder

WORKDIR /app

# Copy package configuration files
COPY package*.json tsconfig.json ./

# Install all dependencies (including devDependencies to compile TS)
RUN npm ci

# Copy source files
COPY src/ ./src/

# Compile TypeScript
RUN npm run build

# Production image
FROM node:20-slim

WORKDIR /app

COPY package*.json ./

# Install production dependencies only (exclude devDependencies)
RUN npm ci --only=production

# Copy compiled JS files from builder
COPY --from=builder /app/dist ./dist

# Expose port (Cloud Run sets PORT env var automatically)
EXPOSE 8080

# Start server
CMD ["npm", "start"]
