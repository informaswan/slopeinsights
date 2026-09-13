#!/usr/bin/env bash
# Run on the Lightsail instance to ship a new backend version.
set -euo pipefail
cd "$HOME/slopeinsights"
git pull
cd backend
sudo docker compose up -d --build
