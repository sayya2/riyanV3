#!/bin/bash
# Deployment script for Raspberry Pi dev server
# This script is called by GitHub Actions to deploy code changes
set -e

echo "🚀 Deploying to Pi..."

cd /data/projects/riyan

# Pull latest code
echo "📥 Pulling latest code from develop branch..."
git fetch origin develop
git reset --hard origin/develop

# Login to GHCR
echo "🔐 Logging into GitHub Container Registry..."
echo $GHCR_TOKEN | docker login ghcr.io -u $GHCR_USERNAME --password-stdin

# Pull updated web image
echo "📦 Pulling latest web image..."
docker compose -f docker-compose.pi.yml --env-file .env.pi pull web

# Restart services
echo "🔄 Restarting services..."
docker compose -f docker-compose.pi.yml --env-file .env.pi up -d

# Health check
echo "🏥 Performing health check..."
sleep 10

# Check container status
echo ""
echo "=== Container Status ==="
docker compose -f docker-compose.pi.yml ps

# Show recent logs
echo ""
echo "=== Recent Logs ==="
docker compose -f docker-compose.pi.yml logs --tail=50

echo ""
echo "✅ Deployment complete!"
echo "🌐 Web: http://$(hostname -I | awk '{print $1}'):3000"
echo "🔧 Directus: http://$(hostname -I | awk '{print $1}'):8055"
