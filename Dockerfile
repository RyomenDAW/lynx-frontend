# Dockerfile para frontend Angular

# Etapa de construcción
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .

# Ejecutar build producción
RUN npm run build --prod

# Verificar que la carpeta build existe y mostrar contenido (solo para debug)
RUN ls -la /app/dist
RUN ls -la /app/dist/lynx-app

# Etapa para servir con nginx
FROM nginx:alpine

# Copiar build Angular al directorio servido por nginx
COPY --from=build /app/dist/lynx-app /usr/share/nginx/html

# Copiar configuración personalizada de nginx para SPA Angular
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
