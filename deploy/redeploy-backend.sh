#!/usr/bin/env bash
# Run on the Lightsail instance to ship a new backend version.
set -euo pipefail
cd "$HOME/slopeinsights"
git pull
cd backend
sudo docker compose up -d --build

# Old image layers from the previous build become "dangling" once replaced;
# clean them up so disk usage doesn't creep up with every deploy.
sudo docker image prune -f
