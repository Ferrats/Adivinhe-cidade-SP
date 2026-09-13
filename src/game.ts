import type { LngLat } from './geo'

export type RoundResult = {
  city: string
  distanceKm: number
  guess: LngLat
}

export function summarizeResults(results: RoundResult[]) {
  if (!results.length) {
    return { averageKm: 0, best: null }
  }

  const averageKm = results.reduce((sum, item) => sum + item.distanceKm, 0) / results.length
  const best = results.reduce((currentBest, item) =>
    item.distanceKm < currentBest.distanceKm ? item : currentBest,
  )

  return { averageKm, best }
}
