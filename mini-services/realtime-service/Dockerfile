FROM node:20-slim
WORKDIR /app
COPY package.json pnpm-lock.yaml* package-lock.json* ./
RUN npm install
COPY . .
RUN npx prisma generate
CMD ["npm", "start"]
