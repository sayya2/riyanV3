#!/usr/bin/env bash
set -euo pipefail

EXT_DIR="${1:-}"
if [ -z "$EXT_DIR" ]; then
  echo "Usage: $0 /path/to/directus/extensions/interfaces/slug-generator" >&2
  exit 1
fi

TMP_DIR="$(mktemp -d)"
cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

cd "$TMP_DIR"
npm pack directus-slug-generator >/dev/null

PKG_TGZ="$(ls -1 directus-slug-generator-*.tgz | head -n 1)"
if [ -z "$PKG_TGZ" ]; then
  echo "Failed to download directus-slug-generator package." >&2
  exit 1
fi

rm -rf "$EXT_DIR"
mkdir -p "$EXT_DIR"
tar -xzf "$PKG_TGZ" -C "$EXT_DIR" --strip-components=1

if [ ! -d "$EXT_DIR/dist" ]; then
  echo "Extension package missing dist/ folder: $EXT_DIR" >&2
  exit 1
fi
