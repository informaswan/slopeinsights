#!/usr/bin/env bash
# Run on the Lightsail instance to ship a new frontend version.
# Requires EXPO_PUBLIC_API_KEY to match the backend's API_KEY (in backend/.env).
set -euo pipefail

: "${EXPO_PUBLIC_API_KEY:?Set EXPO_PUBLIC_API_KEY (must match backend API_KEY)}"

cd "$HOME/slopeinsights"
git pull
sudo docker build -t slopeinsights-web \
  --build-arg EXPO_PUBLIC_API_URL=https://api.slopeinsights.com \
  --build-arg EXPO_PUBLIC_API_KEY="$EXPO_PUBLIC_API_KEY" \
  app/
sudo docker rm -f slopeinsights-web 2>/dev/null || true
sudo docker run -d --name slopeinsights-web --restart unless-stopped \
  -p 127.0.0.1:8080:80 slopeinsights-web
