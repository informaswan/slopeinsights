#!/usr/bin/env bash
# One-time setup for a fresh Ubuntu Lightsail nano instance ($5/mo tier).
# Run this ON the instance (ssh in first), as a user with sudo access.
#
# Before running:
#   1. Point an A record for api.slopeinsights.com at this instance's static IP.
#   2. Have your production secrets ready (JWT_SECRET, API_KEY, BESTTIME_API_KEY).
#
# Usage: ./provision-lightsail.sh <git-clone-url>

set -euo pipefail

REPO_URL="${1:?Usage: ./provision-lightsail.sh <git-clone-url>}"
APP_DIR="$HOME/slopeinsights"

echo "==> Installing Docker, Docker Compose, Nginx, Certbot"
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg nginx certbot python3-certbot-nginx

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker "$USER"

echo "==> Cloning repo"
if [ ! -d "$APP_DIR" ]; then
  git clone "$REPO_URL" "$APP_DIR"
fi
cd "$APP_DIR/backend"

if [ ! -f .env ]; then
  cp .env.example .env
  echo ""
  echo "!! Edit $APP_DIR/backend/.env now and fill in real secrets:"
  echo "   JWT_SECRET, API_KEY, BESTTIME_API_KEY, CORS_ORIGINS"
  echo "   Generate a JWT secret with: openssl rand -hex 32"
  echo ""
  read -rp "Press enter once .env is filled in..."
fi

echo "==> Building and starting the API container"
sudo docker compose up -d --build

echo "==> Configuring Nginx reverse proxy"
sudo cp "$APP_DIR/deploy/nginx-api.conf" /etc/nginx/sites-available/slopeinsights-api
sudo ln -sf /etc/nginx/sites-available/slopeinsights-api /etc/nginx/sites-enabled/slopeinsights-api
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

echo "==> Requesting TLS certificate (make sure DNS is already pointing here)"
sudo certbot --nginx -d api.slopeinsights.com --non-interactive --agree-tos -m admin@slopeinsights.com --redirect

echo "==> Done. API should be live at https://api.slopeinsights.com/health"
