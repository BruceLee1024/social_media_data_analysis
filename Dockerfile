## Build stage: compile Vite app to static files
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies first for better layer caching
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

## Run stage: serve static files with Nginx
FROM nginx:alpine AS runner

# Copy SPA-friendly nginx config
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
