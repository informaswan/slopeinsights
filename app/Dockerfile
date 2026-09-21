# Builds the static web export and serves it with nginx.
#   docker build -t slopeinsights-web \
#     --build-arg EXPO_PUBLIC_API_URL=https://api.slopeinsights.com \
#     --build-arg EXPO_PUBLIC_API_KEY=<same as backend API_KEY> .
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci
COPY . .

# EXPO_PUBLIC_* values are baked into the bundle at build time.
ARG EXPO_PUBLIC_API_URL
ARG EXPO_PUBLIC_API_KEY
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL \
    EXPO_PUBLIC_API_KEY=$EXPO_PUBLIC_API_KEY
RUN test -n "$EXPO_PUBLIC_API_URL" && test -n "$EXPO_PUBLIC_API_KEY"
RUN npx expo export --platform web

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
