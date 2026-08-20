FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

USER node

COPY --chown=node:node src ./src

EXPOSE 9001

CMD ["node", "src/server.js"]

