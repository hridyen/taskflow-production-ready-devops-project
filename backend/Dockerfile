# ==========================================
# TaskFlow Backend Service Dockerfile
# ==========================================
# This Dockerfile structures a secure and optimized Node.js image for production.
# It uses an alpine base image to minimize size and drops container privileges for security.

# Step 1: Use official Node.js Alpine base image for smaller image size footprint
FROM node:22-alpine

# Step 2: Set working directory inside container filesystem
WORKDIR /app

# Step 3: Copy package.json and package-lock.json to install dependencies first.
# This exploits Docker's layer caching so we don't reinstall NPM modules if files haven't changed.
COPY package*.json ./

# Step 4: Perform clean install of production-only packages.
# --omit=dev prevents devDependencies (like nodemon) from being included in the production image.
RUN npm install -g npm@10.9.9 && \
    npm ci --omit=dev


# Step 5: Drop root privileges and switch context to the built-in non-root 'node' user.
# Crucial for security compliance to prevent host-access vulnerabilities.
USER node

# Step 6: Copy application source code under node ownership
COPY --chown=node:node src ./src

# Step 7: Declare listening port (this is documentation for docker, matching server.js PORT)
EXPOSE 9001

# Step 8: Specify command to run on container launch
CMD ["node", "src/server.js"]
