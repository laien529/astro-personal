#!/bin/bash
set -e

PROJECT_DIR="/Users/csc/Downloads/astro-portfolio-template"
SERVER="root@8.162.11.60"
REMOTE_DIR="/var/www/astro-personal"

cd "$PROJECT_DIR"
npm run build
ssh "$SERVER" "mkdir -p $REMOTE_DIR && rm -rf $REMOTE_DIR/*"
scp -r "$PROJECT_DIR"/dist/* "$SERVER":"$REMOTE_DIR"/
ssh "$SERVER" "nginx -t && systemctl reload nginx"
echo "Deploy done."