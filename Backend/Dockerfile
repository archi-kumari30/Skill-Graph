# Production Dockerfile for SkillGraph Backend
FROM node:18-alpine

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy application source code
COPY . .

# Expose backend REST port
EXPOSE 5000

# Run container as unprivileged user
USER node

# Start production server
CMD ["node", "src/server.js"]
