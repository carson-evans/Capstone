#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$ROOT_DIR/../.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
BUILD_DIR="$ROOT_DIR/.build"
SHARED_THRESHOLDS_PATH="$REPO_ROOT/src/app/data/incomeThresholds.json"

rm -rf "$BUILD_DIR" "$DIST_DIR"
mkdir -p "$BUILD_DIR" "$DIST_DIR"

# Copy handler and shared threshold data
cp "$ROOT_DIR/lambda_function.py" "$BUILD_DIR/"
cp "$SHARED_THRESHOLDS_PATH" "$BUILD_DIR/income_thresholds.json"

# Install deps into build dir (Linux container)
docker run --rm -v "$ROOT_DIR":/var/task -w /var/task public.ecr.aws/sam/build-python3.12 \
  pip install -r requirements.txt -t .build

# Zip contents (not folder)
cd "$BUILD_DIR"
zip -r "$DIST_DIR/packet_generator.zip" .

echo "OK Built: $DIST_DIR/packet_generator.zip"
