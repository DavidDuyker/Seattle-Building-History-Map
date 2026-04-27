import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'
import type { Building } from '../types/building'

import 'leaflet/dist/leaflet.css'

const SEATTLE_CENTER: [number, number] = [47.6062, -122.3321]
const SEATTLE_BOUNDS: [[number, number], [number, number]] = [
  [47.42, -122.5],
  [47.78, -122.12],
]

type MapViewProps = {
  buildings: Building[]
  onSelectBuilding: (building: Building) => void
}

export function MapView({ buildings, onSelectBuilding }: MapViewProps) {
  return (
    <MapContainer
      center={SEATTLE_CENTER}
      zoom={13}
      className="map-view"
      scrollWheelZoom
      maxBounds={SEATTLE_BOUNDS}
      maxBoundsViscosity={0.65}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {buildings.map((b) => (
        <CircleMarker
          key={b.id}
          center={[b.lat, b.lng]}
          radius={9}
          pathOptions={{
            color: '#ffffff',
            weight: 2,
            fillColor: '#1e3a5f',
            fillOpacity: 0.92,
          }}
          eventHandlers={{
            click: () => onSelectBuilding(b),
          }}
        >
          <Tooltip permanent={false} direction="top" offset={[0, -6]}>
            {b.name}
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
