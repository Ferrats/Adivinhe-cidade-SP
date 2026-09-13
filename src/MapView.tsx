import { useEffect, useRef } from 'react'
import { Map, Marker, setWorkerUrl, type Map as MapInstance } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { SP_BOUNDS, type City } from './data'
import type { LngLat } from './geo'

setWorkerUrl(workerUrl)

const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron'

function hideLabels(map: MapInstance) {
  const layers = map.getStyle().layers ?? []
  for (const layer of layers) {
    if (layer.type === 'symbol') {
      try {
        map.setLayoutProperty(layer.id, 'visibility', 'none')
      } catch {
        // Provider styles can mutate while loading; safe to ignore in this alpha.
      }
    }
  }
}

type MysteryMapProps = { city: City }

export function MysteryMap({ city }: MysteryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const map = new Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: city.center,
      zoom: city.zoom,
      interactive: false,
      attributionControl: true,
      fadeDuration: 0,
      pitchWithRotate: false,
    })

    map.once('load', () => hideLabels(map))
    return () => map.remove()
  }, [city])

  return <div className="map map--mystery" ref={containerRef} aria-label="Mapa da cidade misteriosa" />
}

type GuessMapProps = {
  value: LngLat | null
  onChange: (value: LngLat) => void
}

export function GuessMap({ value, onChange }: GuessMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const markerRef = useRef<Marker | null>(null)
  const mapRef = useRef<MapInstance | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const map = new Map({
      container: containerRef.current,
      style: STYLE_URL,
      bounds: SP_BOUNDS,
      fitBoundsOptions: { padding: 20 },
      minZoom: 5.4,
      maxZoom: 9,
      attributionControl: true,
      dragRotate: false,
      pitchWithRotate: false,
    })

    mapRef.current = map
    map.touchZoomRotate.disableRotation()
    map.once('load', () => hideLabels(map))

    map.on('click', (event) => {
      onChange([event.lngLat.lng, event.lngLat.lat])
    })

    return () => {
      markerRef.current?.remove()
      markerRef.current = null
      mapRef.current = null
      map.remove()
    }
  }, [onChange])

  useEffect(() => {
    if (!value || !mapRef.current) return
    markerRef.current?.remove()
    markerRef.current = new Marker({ color: '#111111' })
      .setLngLat(value)
      .addTo(mapRef.current)
  }, [value])

  return <div className="map map--guess" ref={containerRef} aria-label="Mapa do estado de São Paulo para fazer o palpite" />
}
