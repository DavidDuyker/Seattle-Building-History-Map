# GitHub Pages setup

The site is built with `GITHUB_PAGES=true` so asset URLs use the project path `/Seattle-Building-History-Map/`.

## One-time steps on GitHub

1. Open the repository on GitHub.
2. Go to **Settings** → **Pages** (under *Code and automation*).
3. Under **Build and deployment** → **Source**, choose **GitHub Actions** (not “Deploy from a branch”).
4. Merge or push the workflow file to **`main`**. The workflow **Deploy to GitHub Pages** runs automatically.
5. After the workflow succeeds, refresh the Pages settings page. The site URL is shown at the top, typically:

   `https://DavidDuyker.github.io/Seattle-Building-History-Map/`

## If the workflow fails

- Confirm **Settings** → **Actions** → **General** → *Workflow permissions* allows workflows to run (read and write for `GITHUB_TOKEN` where required).
- The first Pages deploy may require accepting the **github-pages** environment (if GitHub prompts for deployment approval).

## Local preview of a Pages-style build

```bash
GITHUB_PAGES=true npm run build && npm run preview
```

Then open the URL Vite prints, including the `/Seattle-Building-History-Map/` path.

## Renaming the repository

If the GitHub repo name changes, update `GITHUB_PAGES_BASE` in `vite.config.ts` to match the new name (with leading and trailing slashes).
