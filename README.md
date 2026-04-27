# Seattle Buildings History Map

A static, installable **PWA** that shows notable historic Seattle places on a **Leaflet** map. Each location is a Markdown file in the repo; at build time those files are compiled into data the app loads (via a Vite virtual module—no backend).

## Requirements

- **Node.js 20+** (20.19+ or 22 LTS recommended for tooling such as ESLint and the latest Vite)

## Scripts

| Command           | Description                                      |
|-------------------|--------------------------------------------------|
| `npm install`     | Install dependencies                             |
| `npm run dev`     | Local dev server with hot reload                 |
| `npm run build`   | Typecheck then production build (`dist/`)      |
| `npm run preview` | Serve the production build locally               |
| `npm run lint`    | ESLint                                           |

## Adding or editing buildings

1. Add or change a `.md` file under [`data/buildings/`](data/buildings/).
2. Use YAML frontmatter plus Markdown in the body. Field definitions and examples are in [`data/SCHEMA.md`](data/SCHEMA.md).
3. Optional images go under [`public/`](public/) (for example `public/images/my-building.svg`) and are referenced from frontmatter with a path like `images/my-building.svg`.
4. Restart or save to refresh dev: the Vite plugin watches `data/buildings/*.md`.

## Tech stack

- **Vite 5** + **React** + **TypeScript**
- **react-leaflet** + **OpenStreetMap** tiles (with optional runtime caching via the service worker)
- **gray-matter** + **marked** at build time for Markdown
- **vite-plugin-pwa** for the web app manifest and Workbox service worker

## Deploying

`npm run build` outputs a static site in `dist/`. Host it on any static host (Netlify, Cloudflare Pages, GitHub Pages, etc.). If the site is not at the domain root, set the [`base`](https://vitejs.dev/config/shared-options.html#base) option in `vite.config.ts`.

## License

Private project unless you add a license.
