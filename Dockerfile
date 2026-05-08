FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN node node_modules/typescript/bin/tsc -b && node node_modules/vite/bin/vite.js build

EXPOSE 3040

CMD ["npm", "start"]
