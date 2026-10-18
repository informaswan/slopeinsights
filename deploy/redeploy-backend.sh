#!/usr/bin/env bash
# Run on the Lightsail instance to ship a new backend version.
set -euo pipefail
cd "$HOME/slopeinsights"
git pull
cd backend
sudo docker compose build

# Refuse to swap in an image that can't start (e.g. a placeholder JWT_SECRET/API_KEY in .env);
# the running container keeps serving until this passes.
sudo docker compose run --rm --no-deps api python -c "import app.config"

sudo docker compose up -d

# Old image layers from the previous build become "dangling" once replaced;
# clean them up so disk usage doesn't creep up with every deploy.
sudo docker image prune -f
