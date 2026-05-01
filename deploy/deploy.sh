#!/bin/bash
set -e

# Always run from project root regardless of where the script is called from
cd "$(dirname "$0")/.."

DEPLOY_DIR=/var/www/admin

echo "==> Installing dependencies..."
npm ci --omit=dev

echo "==> Building..."
npm run build

echo "==> Deploying to $DEPLOY_DIR..."
sudo mkdir -p "$DEPLOY_DIR"
sudo rm -rf "$DEPLOY_DIR"/*
sudo cp -r dist/. "$DEPLOY_DIR/"

echo "==> Reloading nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo "==> Done."
