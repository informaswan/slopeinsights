#!/usr/bin/env bash
# Builds the Expo web export and ships it to S3 + invalidates CloudFront.
# Requires S3_BUCKET and CLOUDFRONT_DISTRIBUTION_ID env vars (from
# setup-frontend-aws.sh), and the AWS CLI configured.
#
# Usage: S3_BUCKET=slopeinsights.com CLOUDFRONT_DISTRIBUTION_ID=E123 ./deploy-frontend.sh

set -euo pipefail

: "${S3_BUCKET:?Set S3_BUCKET}"
: "${CLOUDFRONT_DISTRIBUTION_ID:?Set CLOUDFRONT_DISTRIBUTION_ID}"

cd "$(dirname "$0")/../app"

echo "==> Building Expo web export"
npx expo export --platform web

echo "==> Syncing to s3://$S3_BUCKET"
aws s3 sync dist/ "s3://$S3_BUCKET" --delete

echo "==> Invalidating CloudFront cache"
aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" --paths "/*"

echo "==> Done."
