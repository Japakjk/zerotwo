FROM node:22-alpine

WORKDIR /app

# Instalar dependências nativas necessárias para compilar o módulo canvas.
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

COPY package.json package-lock.json tsconfig.json ./
RUN npm ci

COPY src ./src
COPY scripts ./scripts

RUN npm run build \
    && test -f dist/src/index.js \
    && test -f dist/scripts/deploy-commands.js \
    && echo "Build artifacts confirmed:" \
    && find dist -maxdepth 3 -type f | sort

ENV NODE_ENV=production

CMD ["npm", "start"]
