# Building data schema

Each historic place is one Markdown file under `data/buildings/`. The filename (without `.md`) becomes the building `id` in the app (for example `smith-tower.md` → `smith-tower`).

## YAML frontmatter

| Field     | Required | Type   | Description |
|-----------|----------|--------|-------------|
| `name`    | yes      | string | Display name and map tooltip. |
| `lat`     | yes      | number | Latitude (WGS84). |
| `lng`     | yes      | number | Longitude (WGS84). |
| `address` | no       | string | Street or general location line. |
| `image`   | no       | string | Path to a file under `public/` (with or without a leading `/`). The file must exist at build time. Example: `images/smith-tower.svg` or `/images/smith-tower.svg`. |

## Body

Everything after the closing `---` of the frontmatter is Markdown. It is turned into HTML at build time and shown in the building modal.

## Example

See the sample files in `data/buildings/`.
