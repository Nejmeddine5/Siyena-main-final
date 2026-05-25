# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS client-build
WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build

FROM node:20-alpine AS server-deps
WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=5000

RUN apk add --no-cache nginx

COPY --from=server-deps /app/server/node_modules ./server/node_modules
COPY server/ ./server
COPY --from=client-build /app/client/dist/siyena-frontend /usr/share/nginx/html

RUN mkdir -p /run/nginx && \
    printf '%s\n' \
      'server {' \
      '    listen 80;' \
      '    server_name _;' \
      '    root /usr/share/nginx/html;' \
      '    index index.html;' \
      '' \
      '    location / {' \
      '        try_files $uri $uri/ /index.html;' \
      '    }' \
      '' \
      '    location /api/ {' \
      '        proxy_pass http://127.0.0.1:5000/api/;' \
      '        proxy_http_version 1.1;' \
      '        proxy_set_header Host $host;' \
      '        proxy_set_header X-Real-IP $remote_addr;' \
      '        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;' \
      '        proxy_set_header X-Forwarded-Proto $scheme;' \
      '    }' \
      '' \
      '    location /socket.io/ {' \
      '        proxy_pass http://127.0.0.1:5000/socket.io/;' \
      '        proxy_http_version 1.1;' \
      '        proxy_set_header Host $host;' \
      '        proxy_set_header X-Real-IP $remote_addr;' \
      '        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;' \
      '        proxy_set_header X-Forwarded-Proto $scheme;' \
      '        proxy_set_header Upgrade $http_upgrade;' \
      '        proxy_set_header Connection "upgrade";' \
      '    }' \
      '}' > /etc/nginx/http.d/default.conf && \
    printf '%s\n' \
      '#!/bin/sh' \
      'set -eu' \
      'nginx' \
      'exec node /app/server/server.js' \
      > /usr/local/bin/docker-entrypoint.sh && \
    chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80 5000

CMD ["/usr/local/bin/docker-entrypoint.sh"]

