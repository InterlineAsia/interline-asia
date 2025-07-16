#!/bin/bash

# Interline Asia - GitHub-Vercel Webhook Monitor (Shell Version)
# Checks if GitHub webhook to Vercel is properly configured

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Repository configuration
REPO_OWNER="InterlineAsia"
REPO_NAME="interline-asia"

# Function to print colored output
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Load GitHub token
load_github_token() {
    # Try environment variable first
    if [ -n "$GITHUB_TOKEN" ]; then
        echo "$GITHUB_TOKEN"
        return 0
    fi
    
    # Try .env.local file
    if [ -f ".env.local" ]; then
        local token=$(grep "^GITHUB_TOKEN=" .env.local | cut -d'=' -f2- | tr -d '"' | tr -d "'")
        if [ -n "$token" ]; then
            echo "$token"
            return 0
        fi
    fi
    
    print_error "GitHub token not found!"
    print_info "Please set GITHUB_TOKEN in environment or .env.local"
    print_info "Token needs 'repo' and 'admin:repo_hook' scopes"
    exit 1
}

# Fetch webhooks from GitHub API
fetch_webhooks() {
    local token="$1"
    local url="https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/hooks"
    
    curl -s -H "Authorization: Bearer $token" \
         -H "Accept: application/vnd.github.v3+json" \
         -H "User-Agent: Interline-Asia-Webhook-Checker/1.0" \
         "$url"
}

# Check if response contains error
check_api_error() {
    local response="$1"
    
    if echo "$response" | grep -q '"message"'; then
        local error_msg=$(echo "$response" | grep '"message"' | cut -d'"' -f4)
        print_error "GitHub API error: $error_msg"
        exit 1
    fi
}

# Main webhook check function
check_webhooks() {
    print_info "Checking GitHub webhooks for Interline Asia..."
    
    local token=$(load_github_token)
    local response=$(fetch_webhooks "$token")
    
    check_api_error "$response"
    
    # Count total webhooks
    local total_webhooks=$(echo "$response" | grep -c '"id":' || echo "0")
    
    # Find Vercel webhooks
    local vercel_webhooks=$(echo "$response" | grep -B5 -A10 'vercel\|zeit\|now\.sh' || echo "")
    local vercel_count=0
    
    if [ -n "$vercel_webhooks" ]; then
        vercel_count=$(echo "$vercel_webhooks" | grep -c '"id":' || echo "0")
    fi
    
    # Print report
    echo ""
    print_info "Webhook Status Report"
    echo "========================"
    echo "Repository: ${REPO_OWNER}/${REPO_NAME}"
    echo "Total webhooks: $total_webhooks"
    echo "Vercel webhooks: $vercel_count"
    
    if [ "$vercel_count" -gt 0 ]; then
        print_success "GitHub-Vercel webhook is connected"
        
        # Extract webhook details
        echo "$response" | jq -r '.[] | select(.config.url | test("vercel|zeit|now\\.sh")) | 
            "🔗 Webhook: " + .config.url + 
            "\n   Active: " + (.active | tostring) + 
            "\n   Events: " + (.events | join(", ")) + 
            "\n   Created: " + .created_at + 
            "\n"' 2>/dev/null || {
            
            # Fallback if jq is not available
            echo ""
            print_info "Vercel webhook found (install 'jq' for detailed info)"
            echo "$vercel_webhooks" | grep -E '"url"|"active"|"events"' | head -10
        }
        
        # Check for push events
        if echo "$vercel_webhooks" | grep -q '"push"'; then
            print_success "Webhook listens to push events"
        else
            print_warning "Webhook may not listen to push events"
        fi
        
        # Check if active
        if echo "$vercel_webhooks" | grep -q '"active": true'; then
            print_success "Webhook is active"
        else
            print_warning "Webhook may be inactive"
        fi
        
    else
        print_error "GitHub-Vercel webhook missing or broken!"
        echo ""
        print_info "To fix this:"
        echo "   1. Go to Vercel Dashboard → Settings → Git"
        echo "   2. Disconnect and reconnect your GitHub repository"
        echo "   3. Or run: ./scripts/create-webhook.sh"
        echo ""
        exit 1
    fi
    
    echo ""
    print_success "Webhook check completed successfully"
}

# Create webhook helper function
create_webhook_helper() {
    cat << 'EOF'
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
EOF
}

# Main execution
main() {
    if [ "$1" = "--create-helper" ]; then
        create_webhook_helper > scripts/create-webhook.sh
        chmod +x scripts/create-webhook.sh
        print_success "Created scripts/create-webhook.sh helper script"
        exit 0
    fi
    
    check_webhooks
}

# Run main function
main "$@"