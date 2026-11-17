#!/bin/sh
# LEGACY: rebuilds the overlay from two old worktrees. Deploys use overlay-live-previews.sh (tarball + checksums).
# Copy the client previews that are live on jarvisweb.lt (/perziura/*, /previews/*) into ./dist
# after `npm run build`. Their inputs are private and git-ignored, and the live pages were built
# from older template code, so they are carried over as built files, not rebuilt.
# Sources (2026-11-11): seo-services-20261026 prebuilt output (27 Oct) + MAS pages from
# mas-feedback-20261108/dist (deployed 8 Nov, dpl_EtjEKe7qEZBYPbg3xQdBPxMnKuRM).
set -eu
W="${JARVISCO_WORKTREES:-$HOME/Work/Code projects/JarvisCo-worktrees}"
BASE="$W/seo-services-20261026/.vercel/output/static"
MAS="$W/mas-feedback-20261108/dist"
[ -d "$BASE/perziura" ] && [ -d "$MAS/perziura/cfa9bwee8q" ] || { echo "overlay: source output missing" >&2; exit 1; }
[ -d dist ] || { echo "overlay: run npm run build first" >&2; exit 1; }
[ -e dist/perziura ] && { echo "overlay: dist/perziura already exists (previews/*.json present?)" >&2; exit 1; }
cp -R "$BASE/perziura" dist/perziura
rm -rf dist/perziura/cfa9bwee8q && cp -R "$MAS/perziura/cfa9bwee8q" dist/perziura/
mkdir -p dist/previews dist/_astro
cp -R "$BASE/previews/." dist/previews/ 2>/dev/null || true
rm -rf dist/previews/cfa9bwee8q && cp -R "$MAS/previews/cfa9bwee8q" dist/previews/ 2>/dev/null || true
cp -Rn "$BASE/_astro/." dist/_astro/ 2>/dev/null || true
cp -Rn "$MAS/_astro/." dist/_astro/ 2>/dev/null || true
echo "overlay: $(find dist/perziura -name index.html | wc -l | tr -d ' ') preview pages copied"
