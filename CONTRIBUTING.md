# Contributing to Grudge Warlords

Thank you for your interest in contributing to Grudge Warlords!

## How to Contribute

### Reporting Issues

If you find a bug or have a feature request:

1. Check if the issue already exists in the [Issues](https://github.com/MolochDaGod/GrudgeWars/issues) section
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce (for bugs)
   - Expected vs actual behavior
   - Environment details (OS, Node.js version, etc.)

### Pull Requests

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test your changes thoroughly
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/GrudgeWars.git
cd GrudgeWars

# Install dependencies
npm install

# Create your .env file
cp .env.example .env

# Start development
npm run dev
```

### Code Style

- Inline styles only (no CSS files) — gold/dark WCS theme (`#FAAC47`, `#DB6331`, `#0a0a12`)
- `'Cinzel'` for headings, `'Jost'` for body
- React functional components with hooks only
- ESM (`import`/`export`) in `src/`, CJS in `api/`
- Always use `assetUrl()` or `getWeaponIcon()` for asset paths — never hardcode URLs

### Testing

Before submitting a PR:

- Test all affected functionality
- Ensure scripts run without errors
- Verify documentation is updated
- Check that build succeeds (`npm run build`)

### Areas for Contribution

We welcome contributions in:

- **Game systems** — Combat, crafting, professions, island mechanics
- **Sprite & animation** — New character sprites, VFX, animation mappings
- **UI/UX** — Equipment panel, hotbar, harvest mode, radial menus
- **Backend integration** — Railway API routes, Cloudflare Workers
- **Documentation** — Tutorials, guides, system explanations
- **Testing** — Unit tests, integration tests, load tests

### Architecture

- **Frontend**: React + Vite SPA on Vercel (`grudgewarlords.com`)
- **Backend**: Railway Docker containers (`api.grudge-studio.com`)
- **Auth**: Cloudflare Worker → Railway (`id.grudge-studio.com`)
- **Assets**: Cloudflare R2 CDN (`assets.grudge-studio.com`)
- **Game data**: ObjectStore on GitHub Pages + Cloudflare Workers

See [ARCHITECTURE.md](ARCHITECTURE.md) for full details.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Maintain professionalism

## Questions?

Feel free to open an issue for questions or reach out to the maintainers.

---

*May your grudges be eternal.*
