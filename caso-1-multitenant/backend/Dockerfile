FROM node:20-bullseye-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY prisma ./prisma
RUN npm run prisma:generate
COPY src ./src

RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "start"]
