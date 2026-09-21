#!/usr/bin/env bash
# Builds the Expo web export and ships it to S3 + invalidates CloudFront.
# Requires S3_BUCKET and CLOUDFRONT_DISTRIBUTION_ID env vars (from
# setup-frontend-aws.sh), and the AWS CLI configured.
#
# EXPO_PUBLIC_* values are baked into the bundle at build time, and app/.env
# holds local-dev values (localhost API, paywall skipped). Shell env vars win
# over .env, so this script pins the production values explicitly.
#
# Usage: S3_BUCKET=slopeinsights.com CLOUDFRONT_DISTRIBUTION_ID=E123 \
#        EXPO_PUBLIC_API_KEY=<same as backend API_KEY> ./deploy-frontend.sh

set -euo pipefail

: "${S3_BUCKET:?Set S3_BUCKET}"
: "${CLOUDFRONT_DISTRIBUTION_ID:?Set CLOUDFRONT_DISTRIBUTION_ID}"
: "${EXPO_PUBLIC_API_KEY:?Set EXPO_PUBLIC_API_KEY (must match the backend API_KEY)}"

export EXPO_PUBLIC_API_URL="${EXPO_PUBLIC_API_URL:-https://api.slopeinsights.com}"
export EXPO_PUBLIC_SKIP_PAYWALL=false

cd "$(dirname "$0")/../app"

echo "==> Building Expo web export (API: $EXPO_PUBLIC_API_URL)"
npx expo export --platform web

echo "==> Syncing to s3://$S3_BUCKET"
aws s3 sync dist/ "s3://$S3_BUCKET" --delete

echo "==> Invalidating CloudFront cache"
aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" --paths "/*"

echo "==> Done."
