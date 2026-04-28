import { useState } from 'react'
import buildings from 'virtual:buildings'
import { MapView } from './components/MapView.tsx'
import { BuildingModal } from './components/BuildingModal.tsx'
import type { Building } from './types/building.ts'

export default function App() {
  const [selected, setSelected] = useState<Building | null>(null)

  return (
    <div className="app">
      <main className="app-main">
        <MapView buildings={buildings} onSelectBuilding={setSelected} />
      </main>
      <BuildingModal building={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
