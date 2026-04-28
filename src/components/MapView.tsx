import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  MapContainer,
  TileLayer,
  Circle,
  CircleMarker,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import type { Building } from '../types/building'

import 'leaflet/dist/leaflet.css'

const SEATTLE_CENTER: [number, number] = [47.61965282347559, -122.32061416615362]
const SEATTLE_BOUNDS: [[number, number], [number, number]] = [
  [47.42, -122.5],
  [47.78, -122.12],
]

const DEFAULT_MAP_ZOOM = 15
const LOCATION_ZOOM = 17
const MAX_ACCURACY_RADIUS_METERS = 700
const BUILDING_MARKER_RADIUS = 12
const MARKER_RADIUS_MIN = 8
const MARKER_RADIUS_MAX = 18
const MARKER_RADIUS_ANIM_MS = 180

function markerRadiusForZoom(zoom: number): number {
  const scaled = BUILDING_MARKER_RADIUS + (zoom - DEFAULT_MAP_ZOOM) * 1.35
  return Math.max(MARKER_RADIUS_MIN, Math.min(MARKER_RADIUS_MAX, scaled))
}

function MarkerZoomAnimator({ onZoomEnd }: { onZoomEnd: (zoom: number) => void }) {
  useMapEvents({
    zoomend: (event) => {
      onZoomEnd(event.target.getZoom())
    },
  })
  return null
}

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
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number
    lng: number
    accuracy: number
  } | null>(null)
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
        const { latitude, longitude, accuracy } = pos.coords
        setCurrentLocation({
          lat: latitude,
          lng: longitude,
          accuracy,
        })
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
    <>
      <div className="map-locate-control" role="region" aria-label="Map location">
        <button
          type="button"
          className="map-locate-button"
          onClick={onLocate}
          disabled={status === 'loading'}
          aria-label="Use current location"
          aria-busy={status === 'loading'}
          aria-describedby={errorMessage ? errorId : undefined}
        >
          {status === 'loading' ? (
            <span aria-hidden="true">…</span>
          ) : (
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              width="22"
              height="22"
              focusable="false"
            >
              <circle
                cx="12"
                cy="12"
                r="8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <path
                d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
        <div
          id={errorId}
          className="map-locate-error"
          role="status"
          aria-live="polite"
        >
          {errorMessage}
        </div>
      </div>
      {currentLocation ? (
        <>
          <Circle
            center={[currentLocation.lat, currentLocation.lng]}
            radius={Math.min(currentLocation.accuracy, MAX_ACCURACY_RADIUS_METERS)}
            pathOptions={{
              color: '#4f8ef7',
              weight: 1,
              fillColor: '#4f8ef7',
              fillOpacity: 0.15,
              interactive: false,
            }}
          />
          <CircleMarker
            center={[currentLocation.lat, currentLocation.lng]}
            radius={7}
            pathOptions={{
              color: '#ffffff',
              weight: 2.5,
              fillColor: '#2f7cf6',
              fillOpacity: 1,
              interactive: false,
            }}
          />
        </>
      ) : null}
    </>,
    map.getContainer(),
  )
}

type MapViewProps = {
  buildings: Building[]
  onSelectBuilding: (building: Building) => void
}

/** Tooltips steal the first tap on touch; desktop hover still gets names. */
function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)')
    const onChange = () => setCoarse(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return coarse
}

export function MapView({ buildings, onSelectBuilding }: MapViewProps) {
  const coarsePointer = useCoarsePointer()
  const [markerRadius, setMarkerRadius] = useState(BUILDING_MARKER_RADIUS)
  const markerRadiusRef = useRef(BUILDING_MARKER_RADIUS)
  const markerAnimRef = useRef<number | null>(null)

  const animateMarkerRadius = useCallback((targetRadius: number) => {
    if (markerAnimRef.current) cancelAnimationFrame(markerAnimRef.current)
    const start = performance.now()
    const from = markerRadiusRef.current
    const delta = targetRadius - from

    const step = (now: number) => {
      const progress = Math.min((now - start) / MARKER_RADIUS_ANIM_MS, 1)
      const eased = 1 - (1 - progress) * (1 - progress)
      const next = from + delta * eased
      markerRadiusRef.current = next
      setMarkerRadius(next)
      if (progress < 1) {
        markerAnimRef.current = requestAnimationFrame(step)
      } else {
        markerAnimRef.current = null
      }
    }

    markerAnimRef.current = requestAnimationFrame(step)
  }, [])

  useEffect(
    () => () => {
      if (markerAnimRef.current) cancelAnimationFrame(markerAnimRef.current)
    },
    [],
  )
  const onZoomEnd = useCallback(
    (zoom: number) => {
      animateMarkerRadius(markerRadiusForZoom(zoom))
    },
    [animateMarkerRadius],
  )

  return (
    <MapContainer
      center={SEATTLE_CENTER}
      zoom={DEFAULT_MAP_ZOOM}
      zoomControl={false}
      className="map-view"
      scrollWheelZoom
      maxBounds={SEATTLE_BOUNDS}
      maxBoundsViscosity={0.65}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <MarkerZoomAnimator onZoomEnd={onZoomEnd} />
      <CurrentLocationControl />
      {buildings.map((b) => (
        <CircleMarker
          key={b.id}
          center={[b.lat, b.lng]}
          radius={markerRadius}
          pathOptions={{
            interactive: true,
            color: '#f5f5f5',
            weight: 2,
            fillColor: 'var(--building-dot)',
            fillOpacity: 0.9,
          }}
          eventHandlers={{
            click: () => onSelectBuilding(b),
          }}
        >
          {!coarsePointer ? (
            <Tooltip permanent={false} direction="top" offset={[0, -6]}>
              {b.name}
            </Tooltip>
          ) : null}
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
