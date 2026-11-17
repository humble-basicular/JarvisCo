#!/bin/sh
# Carry the client previews that are live on jarvisweb.lt (/perziura/*: 83 pages, /previews/*, their _astro assets) into ./dist
# after `npm run build`. Their inputs are private and git-ignored and the live pages were built from older template code, so they
# are shipped as the built files, not rebuilt.
# Source (durable, S5 18 Nov 2026): the tarball in Drive `management/site-s5-20261118/overlay/` (50 MB, copy also in
# `site-s2-20261117/overlay-backup/`), checked against scripts/overlay-tarball.sha256, then every extracted file is checked against
# scripts/overlay-manifest.sha256. It was proven identical to production on 18 Nov (see DEPLOY-RUNBOOK.md §A).
# Usage: sh scripts/overlay-live-previews.sh [target]   target = `dist` (default, after `npm run build`) or `.vercel/output/static`
# (after `vercel build --prod`, the deploy path). Override the location with OVERLAY_TGZ=/path/to/overlay-perziura-previews-83.tgz. Legacy rebuild from two old worktrees:
# scripts/overlay-from-worktrees.sh (only if the tarball is lost).
set -eu
cd "$(dirname "$0")/.."
T="${1:-dist}"
DRIVE="$HOME/Library/CloudStorage/GoogleDrive-matasbasinskas1@gmail.com/My Drive/Business/JarvisWeb/management"
TGZ="${OVERLAY_TGZ:-}"
if [ -z "$TGZ" ]; then
  for c in "$DRIVE/site-s5-20261118/overlay/overlay-perziura-previews-83.tgz" "$DRIVE/site-s2-20261117/overlay-backup/overlay-perziura-previews-83.tgz"; do [ -f "$c" ] && { TGZ="$c"; break; }; done
fi
[ -n "$TGZ" ] && [ -f "$TGZ" ] || { echo "overlay: tarball not found (set OVERLAY_TGZ)" >&2; exit 1; }
[ -d "$T" ] || { echo "overlay: $T missing, build first" >&2; exit 1; }
[ -e "$T/perziura" ] && { echo "overlay: $T/perziura already exists (overlay already applied?)" >&2; exit 1; }
want="$(cut -d' ' -f1 scripts/overlay-tarball.sha256)"
have="$(shasum -a 256 "$TGZ" | cut -d' ' -f1)"
[ "$want" = "$have" ] || { echo "overlay: tarball checksum mismatch ($have, expected $want)" >&2; exit 1; }
# Stage first: nothing in $T changes unless the archive, every file checksum, the page count and all _astro collisions are fine.
STAGE="$(mktemp -d)"; trap 'rm -rf "$STAGE"' EXIT
tar -xzf "$TGZ" -C "$STAGE"
( cd "$STAGE" && shasum -a 256 -c --quiet "$OLDPWD/scripts/overlay-manifest.sha256" ) || { echo "overlay: file checksum mismatch in the archive, $T untouched" >&2; exit 1; }
n="$(find "$STAGE/dist/perziura" -name index.html | wc -l | tr -d ' ')"
[ "$n" = 83 ] || { echo "overlay: expected 83 /perziura pages, found $n, $T untouched" >&2; exit 1; }
[ -e "$T/_astro" ] && [ ! -d "$T/_astro" ] && { echo "overlay: $T/_astro is not a directory, $T untouched" >&2; exit 1; }
[ -w "$T" ] || { echo "overlay: $T is not writable" >&2; exit 1; }
[ -e "$T/previews" ] && { echo "overlay: $T/previews already exists, $T untouched" >&2; exit 1; }
( cd "$STAGE/dist/_astro" && find . -type f ) | while read -r f; do
  if [ -e "$T/_astro/$f" ] && ! cmp -s "$STAGE/dist/_astro/$f" "$T/_astro/$f"; then echo "overlay: _astro collision (different content): $f, $T untouched" >&2; exit 1; fi
done || exit 1
cp -R "$STAGE/dist/." "$T/"
echo "overlay: $n /perziura pages + $(find "$T/previews" -type f | wc -l | tr -d ' ') /previews files + $(find "$T/_astro" -type f | wc -l | tr -d ' ') _astro files in $T, all checksums ok"
