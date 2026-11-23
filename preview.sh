#!/usr/bin/env bash
set -euo pipefail

# Run from the website root, even when launched from another directory.
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"

# Match the Hugo version used by this site's GitHub Pages workflow.
export PATH="$PWD/.preview/node-v22.23.4-darwin-arm64/bin:$PWD/node_modules/.bin:$PATH"
export HUGO_RESOURCEDIR="$PWD/.preview/resources"
export HUGO_ENVIRONMENT=development

if [[ ! -x .preview/bin/hugo || ! -x .preview/node-v22.23.4-darwin-arm64/bin/node || ! -d themes/lowkey || ! -x node_modules/.bin/postcss ]]; then
  echo "Local preview dependencies are missing from this checkout. Ask Codex to set up the preview again." >&2
  exit 1
fi

mkdir -p .preview/cache .preview/resources
exec .preview/bin/hugo server \
  --bind 127.0.0.1 \
  --port 1313 \
  --baseURL http://localhost:1313/ \
  --cacheDir "$PWD/.preview/cache" \
  --destination "$PWD/.preview/public" \
  --cleanDestinationDir \
  --noHTTPCache \
  --disableFastRender \
  "$@"
