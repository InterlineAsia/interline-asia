#!/bin/bash
# Helper script to create Vercel webhook
# Note: You'll need to get the webhook URL from Vercel Dashboard

REPO_OWNER="InterlineAsia"
REPO_NAME="interline-asia"

echo "🔧 Creating Vercel webhook..."
echo "⚠️  You need to get the webhook URL from Vercel Dashboard first:"
echo "   1. Go to Vercel → Project Settings → Git"
echo "   2. Copy the webhook URL"
echo "   3. Update WEBHOOK_URL below"

WEBHOOK_URL="https://api.vercel.com/v1/integrations/deploy/YOUR_PROJECT_ID/YOUR_HOOK_ID"

if [ "$WEBHOOK_URL" = "https://api.vercel.com/v1/integrations/deploy/YOUR_PROJECT_ID/YOUR_HOOK_ID" ]; then
    echo "❌ Please update WEBHOOK_URL in this script first!"
    exit 1
fi

TOKEN=$(load_github_token)

curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "web",
    "active": true,
    "events": ["push", "pull_request"],
    "config": {
      "url": "'$WEBHOOK_URL'",
      "content_type": "application/json",
      "insecure_ssl": "0"
    }
  }' \
  "https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/hooks"

echo "✅ Webhook creation attempted"
