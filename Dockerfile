FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN rm -f package-lock.json && npm install
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
# Vite inlinea las VITE_* en el bundle: sin este ARG el Brick de MP no renderiza en prod.
ARG VITE_MP_PUBLIC_KEY
ENV VITE_MP_PUBLIC_KEY=$VITE_MP_PUBLIC_KEY
RUN npm run build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
