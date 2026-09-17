FROM node:22-bookworm-slim
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV AUTH_URL=https://www.wova.cc
ARG AUTH_SECRET=build-time-placeholder
ENV AUTH_SECRET=$AUTH_SECRET
RUN npm run build
ENV AUTH_SECRET=

RUN mkdir -p data public/uploads
ENV NODE_ENV=production
EXPOSE 3000
CMD ["sh", "-c", "npx next start -H 0.0.0.0 -p ${PORT:-3000}"]
