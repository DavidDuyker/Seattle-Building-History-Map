import fs from 'node:fs'
import path from 'node:path'
import type { Plugin, ViteDevServer } from 'vite'
import matter from 'gray-matter'
import { marked as renderMarkdown } from 'marked'
import type { Building } from '../src/types/building'

const VIRTUAL_ID = 'virtual:buildings'
const RESOLVED_VIRTUAL = '\0' + VIRTUAL_ID

function slugFromFilename(file: string): string {
  return path.basename(file, path.extname(file))
}

function normalizeImageToPublicUrl(
  root: string,
  base: string,
  image: string | undefined,
): string | undefined {
  if (!image || typeof image !== 'string') return undefined
  const trimmed = image.trim()
  if (!trimmed) return undefined

  const withoutLeading = trimmed.replace(/^\/+/, '')
  const publicPath = path.join(root, 'public', withoutLeading)
  if (fs.existsSync(publicPath)) {
    const rel = withoutLeading.split(path.sep).join('/')
    const prefix = base.endsWith('/') ? base : `${base}/`
    return prefix === '/' ? `/${rel}` : `${prefix}${rel}`
  }

  console.warn(
    `[buildings-data] image not found under public/: ${trimmed} (resolved ${publicPath})`,
  )
  return undefined
}

function parseNumber(value: unknown, field: string, file: string): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  throw new Error(`[buildings-data] ${file}: invalid or missing ${field}`)
}

function parseCoordinatePair(value: unknown, file: string): [number, number] {
  if (Array.isArray(value) && value.length === 2) {
    return [
      parseNumber(value[0], 'lat, lng[0]', file),
      parseNumber(value[1], 'lat, lng[1]', file),
    ]
  }
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`[buildings-data] ${file}: invalid or missing "lat, lng"`)
  }

  const parts = value.trim().split(',').map((part) => part.trim())
  if (parts.length !== 2) {
    throw new Error(
      `[buildings-data] ${file}: "lat, lng" must be two values like "47.6, -122.3"`,
    )
  }

  return [
    parseNumber(parts[0], 'lat, lng[0]', file),
    parseNumber(parts[1], 'lat, lng[1]', file),
  ]
}

function compileBuildings(root: string, base: string): Building[] {
  const dir = path.join(root, 'data', 'buildings')
  if (!fs.existsSync(dir)) {
    console.warn(`[buildings-data] missing folder ${dir}, using empty list`)
    return []
  }

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort()

  const buildings: Building[] = []

  for (const file of files) {
    const full = path.join(dir, file)
    const raw = fs.readFileSync(full, 'utf8')
    const { data, content } = matter(raw)
    const name = data.name
    if (typeof name !== 'string' || !name.trim()) {
      throw new Error(`[buildings-data] ${file}: frontmatter "name" is required`)
    }
    const hasSeparateLatLng = data.lat != null || data.lng != null
    const hasPairLatLng = data['lat, lng'] != null
    const [lat, lng] = hasPairLatLng
      ? parseCoordinatePair(data['lat, lng'], file)
      : [
          parseNumber(data.lat, 'lat', file),
          parseNumber(data.lng, 'lng', file),
        ]

    if (hasSeparateLatLng && hasPairLatLng) {
      throw new Error(
        `[buildings-data] ${file}: use either "lat/lng" or "lat, lng", not both`,
      )
    }
    const address =
      typeof data.address === 'string' && data.address.trim()
        ? data.address.trim()
        : undefined
    const imageUrl = normalizeImageToPublicUrl(root, base, data.image)

    const html = renderMarkdown(content.trim() || '', { async: false })

    buildings.push({
      id: slugFromFilename(file),
      name: name.trim(),
      lat,
      lng,
      address,
      imageUrl,
      html,
    })
  }

  return buildings
}

function invalidateBuildings(server: ViteDevServer) {
  const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL)
  if (mod) server.moduleGraph.invalidateModule(mod)
}

export function buildingsDataPlugin(): Plugin {
  let root = process.cwd()
  let base = '/'

  return {
    name: 'buildings-data',
    configResolved(config) {
      root = config.root
      base = config.base
    },
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_VIRTUAL
    },
    load(id) {
      if (id !== RESOLVED_VIRTUAL) return
      const buildings = compileBuildings(root, base)
      return `export default ${JSON.stringify(buildings)}`
    },
    configureServer(server) {
      const watchDir = path.join(root, 'data', 'buildings')
      server.watcher.add(watchDir)
      const onChange = (file: string) => {
        if (file.startsWith(watchDir) && file.endsWith('.md')) {
          invalidateBuildings(server)
        }
      }
      server.watcher.on('change', onChange)
      server.watcher.on('add', onChange)
      server.watcher.on('unlink', onChange)
    },
  }
}
