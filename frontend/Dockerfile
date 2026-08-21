# ==========================================
# TaskFlow Frontend Dockerfile
# ==========================================
# This Dockerfile uses a Multi-Stage build pattern.
# Stage 1: Builds the React/Vite application into static bundles.
# Stage 2: Spins up an lightweight Nginx web server to serve the static bundle assets.
# Advantage: The final production image contains ONLY the Nginx binary and compiled HTML/JS/CSS
# files. Node.js, source files, and dependencies are completely omitted from the final image,
# making it highly secure and tiny (~25MB).

# ==========================================
# Stage 1: Build Application
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy lock files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy application source files
COPY . .

# Set up build arguments and environment variables.
# Vite builds static assets, so environment variables starting with VITE_ must be available
# at build-time. They are baked directly into the static JS bundles.
ARG VITE_API_URL=http://localhost:9001/api
ENV VITE_API_URL=$VITE_API_URL

# Compile the production bundles to the dist/ directory
RUN npm run build


# ==========================================
# Stage 2: Production Web Server
# ==========================================
FROM nginx:alpine

# Copy static assets generated from builder stage directly into Nginx's default root folder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose standard web traffic port (documented for Nginx container configuration)
EXPOSE 80

# Launch Nginx in the foreground to keep the container running
CMD ["nginx", "-g", "daemon off;"]