/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module 'virtual:buildings' {
  import type { Building } from './types/building'
  const buildings: Building[]
  export default buildings
}
