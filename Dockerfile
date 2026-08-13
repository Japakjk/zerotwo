FROM node:22-alpine

WORKDIR /app

# Instalar dependências de sistema necessárias para compilar o módulo canvas e fontes no Alpine
RUN apk add --no-cache \
    build-base \
    g++ \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    librsvg-dev \
    pixman-dev \
    pkgconfig \
    python3 \
    ttf-dejavu \
    ttf-freefont \
    fontconfig

COPY package.json tsconfig.json ./
RUN npm install

COPY src ./src
RUN npm run build

ENV NODE_ENV=production

CMD ["npm", "start"]
