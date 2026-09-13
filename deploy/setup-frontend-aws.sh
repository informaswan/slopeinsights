#!/usr/bin/env bash
# One-time setup: S3 bucket + CloudFront distribution + ACM cert for the
# static SlopeInsights web frontend. Run once, locally, with the AWS CLI
# configured (aws configure). Requires jq.
#
# Usage: ./setup-frontend-aws.sh slopeinsights.com

set -euo pipefail

DOMAIN="${1:?Usage: ./setup-frontend-aws.sh <domain>}"
BUCKET="$DOMAIN"
REGION="us-east-1" # ACM certs used by CloudFront must be issued in us-east-1

echo "==> Creating S3 bucket: $BUCKET"
aws s3api create-bucket --bucket "$BUCKET" --region "$REGION"
aws s3api put-public-access-block --bucket "$BUCKET" --public-access-block-configuration \
  BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false
aws s3 website "s3://$BUCKET" --index-document index.html --error-document index.html

cat > /tmp/bucket-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicRead",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::$BUCKET/*"
  }]
}
EOF
aws s3api put-bucket-policy --bucket "$BUCKET" --policy file:///tmp/bucket-policy.json

echo "==> Requesting ACM certificate for $DOMAIN"
CERT_ARN=$(aws acm request-certificate --domain-name "$DOMAIN" \
  --subject-alternative-names "www.$DOMAIN" \
  --validation-method DNS --region "$REGION" --query CertificateArn --output text)
echo "Certificate ARN: $CERT_ARN"
echo ""
echo "!! ACM needs a DNS CNAME record to validate ownership. Fetch it with:"
echo "   aws acm describe-certificate --certificate-arn $CERT_ARN --region $REGION \\"
echo "     --query 'Certificate.DomainValidationOptions[0].ResourceRecord'"
echo "   Add that CNAME at your registrar, then wait for validation (few minutes to an hour):"
echo "   aws acm wait certificate-validated --certificate-arn $CERT_ARN --region $REGION"
read -rp "Press enter once the certificate shows ISSUED..."

echo "==> Creating CloudFront distribution"
DIST_JSON=$(aws cloudfront create-distribution --distribution-config "{
  \"CallerReference\": \"$(date +%s)\",
  \"Aliases\": {\"Quantity\": 2, \"Items\": [\"$DOMAIN\", \"www.$DOMAIN\"]},
  \"DefaultRootObject\": \"index.html\",
  \"Origins\": {\"Quantity\": 1, \"Items\": [{
    \"Id\": \"s3-origin\",
    \"DomainName\": \"$BUCKET.s3-website-$REGION.amazonaws.com\",
    \"CustomOriginConfig\": {\"HTTPPort\": 80, \"HTTPSPort\": 443, \"OriginProtocolPolicy\": \"http-only\"}
  }]},
  \"DefaultCacheBehavior\": {
    \"TargetOriginId\": \"s3-origin\",
    \"ViewerProtocolPolicy\": \"redirect-to-https\",
    \"AllowedMethods\": {\"Quantity\": 2, \"Items\": [\"GET\", \"HEAD\"]},
    \"CachePolicyId\": \"658327ea-f89d-4fab-a63d-7e88639e58f6\"
  },
  \"CustomErrorResponses\": {\"Quantity\": 1, \"Items\": [{
    \"ErrorCode\": 404, \"ResponseCode\": \"200\", \"ResponsePagePath\": \"/index.html\", \"ErrorCachingMinTTL\": 10
  }]},
  \"ViewerCertificate\": {
    \"ACMCertificateArn\": \"$CERT_ARN\",
    \"SSLSupportMethod\": \"sni-only\",
    \"MinimumProtocolVersion\": \"TLSv1.2_2021\"
  },
  \"Comment\": \"SlopeInsights frontend\",
  \"Enabled\": true
}")
DIST_DOMAIN=$(echo "$DIST_JSON" | jq -r '.Distribution.DomainName')
DIST_ID=$(echo "$DIST_JSON" | jq -r '.Distribution.Id')

echo ""
echo "==> Done. Now add these DNS records at your registrar:"
echo "   $DOMAIN      -> CNAME/ALIAS -> $DIST_DOMAIN"
echo "   www.$DOMAIN  -> CNAME       -> $DIST_DOMAIN"
echo ""
echo "Save these for deploy-frontend.sh:"
echo "   S3_BUCKET=$BUCKET"
echo "   CLOUDFRONT_DISTRIBUTION_ID=$DIST_ID"
