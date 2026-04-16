#!/bin/bash
set -e

echo "Building Betta Warlords for Puter deployment..."

npx vite build --config vite.config.puter.js

echo "Fixing asset paths to relative..."
JS_FILE=$(ls dist-puter/assets/index-*.js)
sed -i 's|"/audio/|"./audio/|g' "$JS_FILE"
sed -i 's|"/backgrounds/|"./backgrounds/|g' "$JS_FILE"
sed -i 's|"/effects/|"./effects/|g' "$JS_FILE"
sed -i 's|"/icons/|"./icons/|g' "$JS_FILE"
sed -i 's|"/images/|"./images/|g' "$JS_FILE"
sed -i 's|"/map_nodes/|"./map_nodes/|g' "$JS_FILE"
sed -i 's|"/sprites/|"./sprites/|g' "$JS_FILE"
sed -i 's|"/videos/|"./videos/|g' "$JS_FILE"
sed -i 's|"/api/|"./api/|g' "$JS_FILE"
sed -i 's|"/logo.png|"./logo.png|g' "$JS_FILE"

REMAINING=$(grep -oP '"/[a-z][a-z_]+/' "$JS_FILE" | sort -u || true)
if [ -n "$REMAINING" ]; then
  echo "WARNING: Remaining absolute paths found:"
  echo "$REMAINING"
fi

echo "Build complete! Output: dist-puter/"
echo "To create zip: cd dist-puter && zip -r ../betta-warlords-puter.zip . -x 'attached_assets/*'"
