export type LngLat = [number, number]

const directions = [
  { label: 'norte', arrow: '↑' }, { label: 'nordeste', arrow: '↗' },
  { label: 'leste', arrow: '→' }, { label: 'sudeste', arrow: '↘' },
  { label: 'sul', arrow: '↓' }, { label: 'sudoeste', arrow: '↙' },
  { label: 'oeste', arrow: '←' }, { label: 'noroeste', arrow: '↖' },
]

export function directionTo([lng1, lat1]: LngLat, [lng2, lat2]: LngLat) {
  const radians = Math.PI / 180
  const delta = (lng2 - lng1) * radians
  const y = Math.sin(delta) * Math.cos(lat2 * radians)
  const x = Math.cos(lat1 * radians) * Math.sin(lat2 * radians)
    - Math.sin(lat1 * radians) * Math.cos(lat2 * radians) * Math.cos(delta)
  const bearing = (Math.atan2(y, x) / radians + 360) % 360
  return directions[Math.round(bearing / 45) % 8]
}

export function haversineKm([lng1, lat1]: LngLat, [lng2, lat2]: LngLat) {
  const toRad = (value: number) => (value * Math.PI) / 180
  const earthRadiusKm = 6371.0088
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
