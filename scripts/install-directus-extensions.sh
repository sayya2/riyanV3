#!/usr/bin/env bash
set -euo pipefail

EXTENSIONS_PATH="${1:-directus/extensions}"
PACKAGES=(
  "@directus-labs/ai-image-generation-operation"
  "@directus-labs/experimental-m2a-interface"
  "@directus-labs/super-header-interface"
  "@directus-labs/inline-repeater-interface"
  "@directus-labs/seo-plugin"
  "directus-extension-wpslug-interface"
  "@directus-labs/ai-writer-operation"
  "@directus-labs/liquidjs-operation"
  "@directus-labs/card-select-interfaces"
  "@directus-labs/simple-list-interface"
  "@directus-labs/command-palette-module"
  "directus-extension-group-tabs-interface"
)

TMP_DIR="$(mktemp -d)"
cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

mkdir -p "$EXTENSIONS_PATH"

for package in "${PACKAGES[@]}"; do
  PKG_DIR="$TMP_DIR/$(date +%s%N)"
  mkdir -p "$PKG_DIR"
  (cd "$PKG_DIR" && npm pack "$package" >/dev/null)

  TGZ="$(ls -1 "$PKG_DIR"/*.tgz | head -n 1)"
  if [ -z "${TGZ:-}" ]; then
    echo "Failed to download package: $package" >&2
    exit 1
  fi

  EXTRACT_DIR="$PKG_DIR/extract"
  mkdir -p "$EXTRACT_DIR"
  tar -xzf "$TGZ" -C "$EXTRACT_DIR"

  MANIFEST="$EXTRACT_DIR/package/package.json"
  if [ ! -f "$MANIFEST" ]; then
    echo "Missing package.json for $package" >&2
    exit 1
  fi

  PACKAGE_NAME="$(node -e "const p=require('$MANIFEST'); console.log(p.name || '')")"
  if [ -z "${PACKAGE_NAME:-}" ]; then
    echo "Missing package name for $package" >&2
    exit 1
  fi

  FOLDER_NAME="${PACKAGE_NAME##*/}"
  DEST_DIR="$EXTENSIONS_PATH/$FOLDER_NAME"
  rm -rf "$DEST_DIR"
  mv "$EXTRACT_DIR/package" "$DEST_DIR"

  if [ ! -d "$DEST_DIR/dist" ]; then
    echo "Warning: No dist/ folder found for $package at $DEST_DIR" >&2
  fi
done

echo "Directus extensions installed to $EXTENSIONS_PATH"
