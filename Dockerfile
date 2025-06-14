# Etapa de construcción
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .

# Build en producción
RUN npm run build --prod

# Etapa de nginx
FROM nginx:alpine

# Copia del build generado
COPY --from=build /app/dist/lynx-app /usr/share/nginx/html

# Configuración personalizada de NGINX para Angular SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
