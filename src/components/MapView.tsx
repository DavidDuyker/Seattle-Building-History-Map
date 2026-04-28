import { Fragment, useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
  useMap,
} from 'react-leaflet'
import type { Building } from '../types/building'

import 'leaflet/dist/leaflet.css'

const SEATTLE_CENTER: [number, number] = [47.6062, -122.3321]
const SEATTLE_BOUNDS: [[number, number], [number, number]] = [
  [47.42, -122.5],
  [47.78, -122.12],
]

const DEFAULT_MAP_ZOOM = 13
const LOCATION_ZOOM = 14

function geoErrorMessage(code: number): string {
  switch (code) {
    case GeolocationPositionError.PERMISSION_DENIED:
      return 'Location permission denied.'
    case GeolocationPositionError.POSITION_UNAVAILABLE:
      return 'Location unavailable.'
    case GeolocationPositionError.TIMEOUT:
      return 'Location request timed out.'
    default:
      return 'Could not get your location.'
  }
}

function CurrentLocationControl() {
  const map = useMap()
  const errorId = useId()
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current)
    }
  }, [])

  const scheduleClearError = useCallback(() => {
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current)
    clearTimerRef.current = setTimeout(() => {
      setErrorMessage(null)
      setStatus('idle')
      clearTimerRef.current = null
    }, 5000)
  }, [])

  const onLocate = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('error')
      setErrorMessage('Geolocation is not supported by this browser.')
      scheduleClearError()
      return
    }

    setStatus('loading')
    setErrorMessage(null)
    if (clearTimerRef.current) {
      clearTimeout(clearTimerRef.current)
      clearTimerRef.current = null
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        map.flyTo([latitude, longitude], LOCATION_ZOOM)
        setStatus('idle')
        setErrorMessage(null)
      },
      (err) => {
        setStatus('error')
        setErrorMessage(geoErrorMessage(err.code))
        scheduleClearError()
      },
      { timeout: 10_000, maximumAge: 60_000 },
    )
  }, [map, scheduleClearError])

  return createPortal(
    <div className="map-locate-control" role="region" aria-label="Map location">
      <button
        type="button"
        className="map-locate-button"
        onClick={onLocate}
        disabled={status === 'loading'}
        aria-busy={status === 'loading'}
        aria-describedby={errorMessage ? errorId : undefined}
      >
        {status === 'loading' ? 'Locating…' : 'Use current location'}
      </button>
      <div
        id={errorId}
        className="map-locate-error"
        role="status"
        aria-live="polite"
      >
        {errorMessage}
      </div>
    </div>,
    map.getContainer(),
  )
}

type MapViewProps = {
  buildings: Building[]
  onSelectBuilding: (building: Building) => void
}

/** Tooltips steal the first tap on touch; desktop hover still gets names. */
function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(() =>
    typeof window !== 'undefined' &&
    window.matchMedia('(pointer: coarse)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)')
    const onChange = () => setCoarse(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return coarse
}

/** Wider invisible hit target; visual dot stays radius 9. */
const MARKER_HIT_RADIUS = 22
const MARKER_VISUAL_RADIUS = 9

export function MapView({ buildings, onSelectBuilding }: MapViewProps) {
  const coarsePointer = useCoarsePointer()

  return (
    <MapContainer
      center={SEATTLE_CENTER}
      zoom={DEFAULT_MAP_ZOOM}
      className="map-view"
      scrollWheelZoom
      maxBounds={SEATTLE_BOUNDS}
      maxBoundsViscosity={0.65}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <CurrentLocationControl />
      {buildings.map((b) => (
        <Fragment key={b.id}>
          <CircleMarker
            center={[b.lat, b.lng]}
            radius={MARKER_HIT_RADIUS}
            pathOptions={{
              interactive: true,
              stroke: false,
              fillColor: '#000000',
              fillOpacity: 0.001,
              className: 'map-marker-hit',
            }}
            eventHandlers={{
              click: () => onSelectBuilding(b),
            }}
          />
          <CircleMarker
            center={[b.lat, b.lng]}
            radius={MARKER_VISUAL_RADIUS}
            pathOptions={{
              interactive: false,
              color: '#f5f5f5',
              weight: 2,
              fillColor: '#2a2a2a',
              fillOpacity: 0.9,
            }}
          >
            {!coarsePointer ? (
              <Tooltip permanent={false} direction="top" offset={[0, -6]}>
                {b.name}
              </Tooltip>
            ) : null}
          </CircleMarker>
        </Fragment>
      ))}
    </MapContainer>
  )
}
