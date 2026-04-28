# Building data schema

Each historic place is one Markdown file under `data/buildings/`. The filename (without `.md`) becomes the building `id` in the app (for example `smith-tower.md` → `smith-tower`).

## YAML frontmatter

| Field     | Required | Type   | Description |
|-----------|----------|--------|-------------|
| `name`    | yes      | string | Display name and map tooltip. |
| `lat, lng`| yes      | string | Comma-separated latitude/longitude pair (WGS84). Example: `47.6278, -122.3096`. |
| `address` | no       | string | Street or general location line. |
| `year`    | no       | number | Year built, displayed in the modal header when present. |
| `image`   | no       | string | Legacy fallback image field. Prefer an image embed in markdown body instead. |

## Body

Everything after the closing `---` of the frontmatter is Markdown. It is turned into HTML at build time and shown in the building modal.

For images, prefer embedding the first image in the markdown body (Obsidian-style or markdown-style), for example:

- `![[Screenshot 2026-04-28 at 2.31.38 PM.png]]`
- `![](images/smith-tower.png)`

The first embedded image is used as the modal hero image.

## Example

See the sample files in `data/buildings/`.
