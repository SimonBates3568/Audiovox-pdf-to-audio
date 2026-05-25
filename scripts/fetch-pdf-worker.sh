#!/usr/bin/env bash
set -euo pipefail

# Fetch and extract pdf.worker.min.js from pdfjs-dist npm tarball into public/
# Usage: npm run fetch-worker

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
PKG_JSON="$ROOT_DIR/package.json"
VERSION=$(node -pe "require('$PKG_JSON').dependencies['pdfjs-dist'].replace('^','')")
TARBALL_URL="https://registry.npmjs.org/pdfjs-dist/-/pdfjs-dist-${VERSION}.tgz"
TMPDIR="$ROOT_DIR/tmp_pdfjs"
OUTDIR="$ROOT_DIR/public"
OUTFILE="$OUTDIR/pdf.worker.min.js"

rm -rf "$TMPDIR"
mkdir -p "$TMPDIR"
mkdir -p "$OUTDIR"

echo "Downloading pdfjs-dist ${VERSION} tarball..."
curl -sSfL "$TARBALL_URL" -o "$TMPDIR/pdfjs.tgz"

echo "Extracting worker..."
# Extract only the worker file from the tarball
tar -xzf "$TMPDIR/pdfjs.tgz" -C "$TMPDIR"

# Common path in the package
if [ -f "$TMPDIR/package/build/pdf.worker.min.js" ]; then
  cp "$TMPDIR/package/build/pdf.worker.min.js" "$OUTFILE"
  echo "Worker copied to $OUTFILE"
  rm -rf "$TMPDIR"
  exit 0
fi

# Some package versions place it under dist or build
if [ -f "$TMPDIR/package/dist/pdf.worker.min.js" ]; then
  cp "$TMPDIR/package/dist/pdf.worker.min.js" "$OUTFILE"
  echo "Worker copied to $OUTFILE"
  rm -rf "$TMPDIR"
  exit 0
fi

# Check legacy build paths (mjs)
if [ -f "$TMPDIR/package/legacy/build/pdf.worker.min.mjs" ]; then
  cp "$TMPDIR/package/legacy/build/pdf.worker.min.mjs" "$OUTDIR/pdf.worker.min.mjs"
  echo "Worker copied to $OUTDIR/pdf.worker.min.mjs"
  rm -rf "$TMPDIR"
  exit 0
fi

if [ -f "$TMPDIR/package/legacy/build/pdf.worker.mjs" ]; then
  cp "$TMPDIR/package/legacy/build/pdf.worker.mjs" "$OUTDIR/pdf.worker.mjs"
  echo "Worker copied to $OUTDIR/pdf.worker.mjs"
  rm -rf "$TMPDIR"
  exit 0
fi

echo "Could not find pdf.worker.min.js in the tarball. Listing contents for debugging:"
find "$TMPDIR" -maxdepth 4 -type f | sed -n '1,200p'
rm -rf "$TMPDIR"
exit 1
