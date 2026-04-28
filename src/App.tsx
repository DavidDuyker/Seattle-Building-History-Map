import { useCallback, useEffect, useRef, useState } from 'react'
import buildings from 'virtual:buildings'
import { MapView } from './components/MapView.tsx'
import { BuildingModal } from './components/BuildingModal.tsx'
import type { Building } from './types/building.ts'

const MODAL_ANIMATION_MS = 240

export default function App() {
  const [selected, setSelected] = useState<Building | null>(null)
  const [isModalClosing, setIsModalClosing] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    },
    [],
  )

  const onSelectBuilding = useCallback((building: Building) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    setIsModalClosing(false)
    setSelected(building)
  }, [])

  const onCloseModal = useCallback(() => {
    if (!selected || isModalClosing) return
    setIsModalClosing(true)
    closeTimerRef.current = setTimeout(() => {
      setSelected(null)
      setIsModalClosing(false)
      closeTimerRef.current = null
    }, MODAL_ANIMATION_MS)
  }, [selected, isModalClosing])

  return (
    <div className="app">
      <main className="app-main">
        <MapView buildings={buildings} onSelectBuilding={onSelectBuilding} />
      </main>
      <BuildingModal
        building={selected}
        isClosing={isModalClosing}
        onClose={onCloseModal}
      />
    </div>
  )
}
