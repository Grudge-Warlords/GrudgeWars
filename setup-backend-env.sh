#!/bin/bash
# Run inside WSL: bash /mnt/c/Users/david/Desktop/grudge-wars/setup-backend-env.sh
cat > /opt/grudge/grudge-backend/.env << 'EOF'
# Grudge Studio Backend — Production .env
# DB_PASSWORD and JWT_SECRET auto-generated

DATABASE_URL=postgresql://grudge:76b63a85746149b8afb0c01d7bc8390b2ccc97b83aec386a@postgres:5432/grudge_game
DB_PASSWORD=76b63a85746149b8afb0c01d7bc8390b2ccc97b83aec386a

PORT=5000
NODE_ENV=production

JWT_SECRET=73eda24b55ccfb17e262d56274a43648e24dbcef996d9bbcb394cf170c86656c

CROSSMINT_API_KEY=
CROSSMINT_BASE_URL=https://www.crossmint.com/api/v1-alpha2
CROSSMINT_COLLECTION_CHARACTERS=grudge-characters
CROSSMINT_COLLECTION_ISLANDS=grudge-islands

# Discord OAuth — FILL from discord.com/developers/applications
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_REDIRECT_URI=https://api.grudge-studio.com/auth/discord/callback

# Google OAuth — FILL from console.cloud.google.com
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://api.grudge-studio.com/auth/google/callback

# GitHub OAuth — FILL from github.com/settings/developers
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_REDIRECT_URI=https://api.grudge-studio.com/auth/github/callback

GEMINI_API_KEY=

CORS_ORIGINS=https://grudgewarlords.com,https://www.grudgewarlords.com,https://grudge-studio.com,https://dash.grudge-studio.com,https://warlord-crafting-suite.vercel.app,https://gdevelop-assistant.vercel.app,https://grudge-wars.vercel.app,http://localhost:5173

FRONTEND_URL=https://grudgewarlords.com

# Cloudflare Tunnel — FILL after creating tunnel in Zero Trust dashboard
CLOUDFLARE_TUNNEL_TOKEN=

# Cloudflare R2
R2_ACCOUNT_ID=ee475864561b02d4588180b8b9acf694
R2_S3_ENDPOINT=https://ee475864561b02d4588180b8b9acf694.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=grudge-assets
R2_PUBLIC_URL=https://assets.grudge-studio.com
R2_DEV_URL=https://pub-e7fcf1fd4c9946ecb84b3766bbc7b50d.r2.dev

PUTER_API_TOKEN=
EOF

chmod 600 /opt/grudge/grudge-backend/.env
echo "✅ .env created at /opt/grudge/grudge-backend/.env"
echo "DB_PASSWORD and JWT_SECRET are set."
echo ""
echo "⚠️  You still need to fill in:"
echo "   - DISCORD_CLIENT_ID + DISCORD_CLIENT_SECRET"
echo "   - GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET"
echo "   - GITHUB_CLIENT_ID + GITHUB_CLIENT_SECRET"
echo "   - CLOUDFLARE_TUNNEL_TOKEN"
