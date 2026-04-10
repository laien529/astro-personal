#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 2 ]; then
  echo "Usage: ./deploy/deploy.sh <user@server> <remote_base_path>"
  exit 1
fi

TARGET="$1"
REMOTE_BASE="$2"
RELEASE=$(date +%Y%m%d%H%M%S)

npm run build
ssh "$TARGET" "mkdir -p $REMOTE_BASE/releases/$RELEASE"
rsync -avz --delete dist/ "$TARGET:$REMOTE_BASE/releases/$RELEASE/"
ssh "$TARGET" "ln -sfn $REMOTE_BASE/releases/$RELEASE $REMOTE_BASE/current"

echo "Deployed release: $RELEASE"
