FROM node:22-alpine AS builder

WORKDIR /app
RUN apk update && apk upgrade --no-cache
COPY package.json yarn.lock* ./
# Prefer yarn.lock if it exists, otherwise proceed without it for yarn install
RUN if [ -f yarn.lock ]; then yarn install --frozen-lockfile; else yarn install; fi

COPY . .

ENV PORT=3001
ENV STREAMING_PORT=3002

# Expose both ports
EXPOSE 3001
EXPOSE 3002

ENTRYPOINT ["yarn", "start"]