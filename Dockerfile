# Build stage: compile TypeScript and prepare the Cordova browser platform
FROM node:26-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY config.xml tsconfig.json ./
COPY res ./res
COPY www ./www

RUN npm run build \
    && npx cordova prepare browser

# Runtime stage: serve the static site with nginx
FROM nginx:1.30-alpine
COPY --from=build /app/platforms/browser/www /usr/share/nginx/html
EXPOSE 80
