import { useState } from 'react'
import buildings from 'virtual:buildings'
import { MapView } from './components/MapView.tsx'
import { BuildingModal } from './components/BuildingModal.tsx'
import type { Building } from './types/building.ts'

export default function App() {
  const [selected, setSelected] = useState<Building | null>(null)

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Seattle Buildings History Map</h1>
        <p className="app-tagline">
          Tap a dot to read about a historic place. Works offline after your first visit.
        </p>
      </header>
      <main className="app-main">
        <MapView buildings={buildings} onSelectBuilding={setSelected} />
      </main>
      <BuildingModal building={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
