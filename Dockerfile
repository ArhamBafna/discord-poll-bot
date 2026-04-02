# JustRunMy.App: copy full source so `bot/client.js` and all modules exist at runtime.
FROM node:22-alpine
WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY . .

CMD ["node", "index.js"]
