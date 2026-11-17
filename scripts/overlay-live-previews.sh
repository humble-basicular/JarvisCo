#!/bin/sh
# Carry the client previews that are live on jarvisweb.lt (/perziura/*: 83 pages, /previews/*, their _astro assets) into ./dist
# after `npm run build`. Their inputs are private and git-ignored and the live pages were built from older template code, so they
# are shipped as the built files, not rebuilt.
# Source (durable, S5 18 Nov 2026): the tarball in Drive `management/site-s5-20261118/overlay/` (50 MB, copy also in
# `site-s2-20261117/overlay-backup/`), checked against scripts/overlay-tarball.sha256, then every extracted file is checked against
# scripts/overlay-manifest.sha256. It was proven identical to production on 18 Nov (see DEPLOY-RUNBOOK.md §A).
# Override the location with OVERLAY_TGZ=/path/to/overlay-perziura-previews-83.tgz. Legacy rebuild from two old worktrees:
# scripts/overlay-from-worktrees.sh (only if the tarball is lost).
set -eu
cd "$(dirname "$0")/.."
DRIVE="$HOME/Library/CloudStorage/GoogleDrive-matasbasinskas1@gmail.com/My Drive/Business/JarvisWeb/management"
TGZ="${OVERLAY_TGZ:-}"
if [ -z "$TGZ" ]; then
  for c in "$DRIVE/site-s5-20261118/overlay/overlay-perziura-previews-83.tgz" "$DRIVE/site-s2-20261117/overlay-backup/overlay-perziura-previews-83.tgz"; do [ -f "$c" ] && { TGZ="$c"; break; }; done
fi
[ -n "$TGZ" ] && [ -f "$TGZ" ] || { echo "overlay: tarball not found (set OVERLAY_TGZ)" >&2; exit 1; }
[ -d dist ] || { echo "overlay: run npm run build first" >&2; exit 1; }
[ -e dist/perziura ] && { echo "overlay: dist/perziura already exists (overlay already applied?)" >&2; exit 1; }
want="$(cut -d' ' -f1 scripts/overlay-tarball.sha256)"
have="$(shasum -a 256 "$TGZ" | cut -d' ' -f1)"
[ "$want" = "$have" ] || { echo "overlay: tarball checksum mismatch ($have, expected $want)" >&2; exit 1; }
tar -xzkf "$TGZ" -C .
shasum -a 256 -c scripts/overlay-manifest.sha256 --quiet || { echo "overlay: file checksum mismatch after extraction" >&2; exit 1; }
n="$(find dist/perziura -name index.html | wc -l | tr -d ' ')"
[ "$n" = 83 ] || { echo "overlay: expected 83 /perziura pages, found $n" >&2; exit 1; }
echo "overlay: $n /perziura pages + $(find dist/previews -type f | wc -l | tr -d ' ') /previews files + $(find dist/_astro -type f | wc -l | tr -d ' ') _astro files, all checksums ok"
