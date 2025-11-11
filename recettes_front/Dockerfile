# Frontend multi-stage - recettes_front/Dockerfile
# Stage 1: build
FROM node:18-alpine AS build
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm install

# Inject API base URL at build time for Vite
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build    # pour Vite, génère /dist

# Stage 2: serve with nginx
FROM nginx:stable-alpine AS production
# remove default conf
RUN rm /etc/nginx/conf.d/default.conf
COPY ./nginx.conf /etc/nginx/conf.d/app.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
