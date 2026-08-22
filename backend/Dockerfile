FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install -g npm@10.9.9 && \
    npm ci --omit=dev && \
    rm -rf /usr/local/lib/node_modules/npm \
           /usr/local/bin/npm \
           /usr/local/bin/npx

USER node

COPY --chown=node:node src ./src

EXPOSE 9001

CMD ["node", "src/server.js"]