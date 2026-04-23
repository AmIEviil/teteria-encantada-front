FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
# Forzar instalación de dependencias nativas de Rollup para Linux
RUN npm install && npm install @rollup/rollup-linux-x64-musl
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
