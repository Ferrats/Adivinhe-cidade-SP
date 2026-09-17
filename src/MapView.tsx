import { useEffect, useRef, useState } from 'react'
import { LngLatBounds, Map, Marker, setWorkerUrl, type Map as MapInstance } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { SP_BOUNDS, SP_OUTLINE, type City } from './data'
import type { LngLat } from './geo'
import type { Attempt } from './game'

setWorkerUrl(workerUrl)

const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron'
const MAP_TIMEOUT_MS = 15_000

type MapStatus = 'loading' | 'ready' | 'error'

function hideLabels(map: MapInstance) {
  const layers = map.getStyle().layers ?? []
  for (const layer of layers) {
    if (layer.type === 'symbol') {
      try {
        map.setLayoutProperty(layer.id, 'visibility', 'none')
      } catch {
        // Provider styles can mutate while loading; safe to ignore.
      }
    }
  }
}

function addSpOutline(map: MapInstance, showFill = false) {
  if (map.getSource('sp-outline')) return

  map.addSource('sp-outline', { type: 'geojson', data: SP_OUTLINE })
  if (showFill) {
    map.addLayer({
      id: 'sp-area',
      type: 'fill',
      source: 'sp-outline',
      paint: { 'fill-color': '#d9d4c8', 'fill-opacity': 0.16 },
    })
  }
  map.addLayer({
    id: 'sp-border',
    type: 'line',
    source: 'sp-outline',
    paint: { 'line-color': '#282620', 'line-width': 2, 'line-opacity': 0.72 },
  })
}

function MapFeedback({ status }: { status: MapStatus }) {
  if (status === 'ready') return null
  return (
    <div className={`map-feedback map-feedback--${status}`} role={status === 'error' ? 'alert' : 'status'}>
      {status === 'loading' ? 'Carregando mapa…' : 'Não foi possível carregar o mapa. Verifique sua conexão.'}
    </div>
  )
}

function useMapTimeout(status: MapStatus, setStatus: (status: MapStatus) => void) {
  useEffect(() => {
    if (status !== 'loading') return
    const timeout = window.setTimeout(() => setStatus('error'), MAP_TIMEOUT_MS)
    return () => window.clearTimeout(timeout)
  }, [setStatus, status])
}

type MysteryMapProps = { city: City }

export function MysteryMap({ city }: MysteryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<MapStatus>('loading')
  useMapTimeout(status, setStatus)

  useEffect(() => {
    if (!containerRef.current) return
    setStatus('loading')

    let active = true
    let map: MapInstance | null = null
    try {
      map = new Map({
        container: containerRef.current,
        style: STYLE_URL,
        center: city.center,
        zoom: city.zoom,
        interactive: false,
        fadeDuration: 0,
        pitchWithRotate: false,
        renderWorldCopies: false,
      })

      map.once('load', () => {
        if (!active || !map) return
        hideLabels(map)
        setStatus('ready')
      })
    } catch {
      setStatus('error')
    }

    return () => {
      active = false
      map?.remove()
    }
  }, [city])

  return (
    <div className="map-frame" aria-busy={status === 'loading'}>
      <div className={`map map--mystery ${status !== 'ready' ? 'map--loading' : ''}`} ref={containerRef} aria-label="Mapa da cidade misteriosa" />
      <MapFeedback status={status} />
    </div>
  )
}

type GuessMapProps = {
  value: LngLat | null
  onChange: (value: LngLat) => void
  attempts: Attempt[]
  visible: boolean
}

export function GuessMap({ value, onChange, attempts, visible }: GuessMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const markerRef = useRef<Marker | null>(null)
  const mapRef = useRef<MapInstance | null>(null)
  const [status, setStatus] = useState<MapStatus>('loading')
  useMapTimeout(status, setStatus)

  useEffect(() => {
    if (!containerRef.current) return
    setStatus('loading')

    let active = true
    let map: MapInstance | null = null
    try {
      map = new Map({
        container: containerRef.current,
        style: STYLE_URL,
        bounds: SP_BOUNDS,
        maxBounds: SP_BOUNDS,
        fitBoundsOptions: { padding: 20 },
        minZoom: 4.5,
        maxZoom: 9,
        dragRotate: false,
        pitchWithRotate: false,
        renderWorldCopies: false,
      })

      mapRef.current = map
      map.touchZoomRotate.disableRotation()
      map.once('load', () => {
        if (!active || !map) return
        hideLabels(map)
        addSpOutline(map, true)
        setStatus('ready')
      })

      map.on('click', (event) => onChange([event.lngLat.lng, event.lngLat.lat]))
    } catch {
      setStatus('error')
    }

    return () => {
      active = false
      markerRef.current?.remove()
      markerRef.current = null
      mapRef.current = null
      map?.remove()
    }
  }, [onChange])

  useEffect(() => {
    markerRef.current?.remove()
    markerRef.current = null
    if (!value || !mapRef.current) return
    markerRef.current = new Marker({ color: '#d14b32' }).setLngLat(value).addTo(mapRef.current)
  }, [value])

  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current
    const markers = attempts.map((attempt, index) => {
      const element = document.createElement('div')
      element.className = 'past-guess-marker'
      element.textContent = String(index + 1)
      element.setAttribute('aria-label', `Palpite ${index + 1}`)
      return new Marker({ element }).setLngLat(attempt.guess).addTo(map)
    })
    return () => markers.forEach(marker => marker.remove())
  }, [attempts])

  useEffect(() => {
    if (!visible) return
    const frame = window.requestAnimationFrame(() => mapRef.current?.resize())
    return () => window.cancelAnimationFrame(frame)
  }, [visible])

  return (
    <div className="map-frame" aria-busy={status === 'loading'}>
      <div className="guess-map-tools">
        <button type="button" disabled={status !== 'ready'} onClick={() => mapRef.current?.fitBounds(SP_BOUNDS, { padding: 20, duration: 0 })}>Ver todo o estado</button>
      </div>
      <div className={`map map--guess ${status !== 'ready' ? 'map--loading' : ''}`} ref={containerRef} aria-label="Mapa do estado de São Paulo para fazer o palpite" />
      <MapFeedback status={status} />
    </div>
  )
}

type ResultMapProps = {
  city: City
  guess: LngLat
}

export function ResultMap({ city, guess }: ResultMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<MapStatus>('loading')
  useMapTimeout(status, setStatus)

  useEffect(() => {
    if (!containerRef.current) return
    setStatus('loading')

    const bounds = new LngLatBounds().extend(guess).extend(city.center)
    let active = true
    let map: MapInstance | null = null
    const markers: Marker[] = []

    try {
      map = new Map({
        container: containerRef.current,
        style: STYLE_URL,
        bounds,
        fitBoundsOptions: { padding: 64, maxZoom: 8.5 },
        interactive: false,
        fadeDuration: 0,
        renderWorldCopies: false,
      })

      map.once('load', () => {
        if (!active || !map) return
        addSpOutline(map)
        map.addSource('result-line', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: [guess, city.center] },
          },
        })
        map.addLayer({
          id: 'result-line',
          type: 'line',
          source: 'result-line',
          paint: { 'line-color': '#171717', 'line-width': 2, 'line-dasharray': [2, 2] },
        })

        markers.push(
          new Marker({ color: '#171717' }).setLngLat(guess).addTo(map),
          new Marker({ color: '#d14b32' }).setLngLat(city.center).addTo(map),
        )
        setStatus('ready')
      })
    } catch {
      setStatus('error')
    }

    return () => {
      active = false
      markers.forEach((marker) => marker.remove())
      map?.remove()
    }
  }, [city, guess])

  return (
    <div className="result-map-wrap" aria-busy={status === 'loading'}>
      <div className={`map map--result ${status !== 'ready' ? 'map--loading' : ''}`} ref={containerRef} aria-label={`Comparação entre seu palpite e ${city.name}`} />
      <MapFeedback status={status} />
      {status === 'ready' && (
        <div className="result-map-legend" aria-label="Legenda do mapa">
          <span><i className="legend-dot legend-dot--guess" />Melhor palpite</span>
          <span><i className="legend-dot legend-dot--city" />Local correto</span>
        </div>
      )}
    </div>
  )
}
