import { describe, expect, it } from 'vitest'
import { summarizeResults, type RoundResult } from './game'

describe('summarizeResults', () => {
  it('returns an empty summary before the first round', () => {
    expect(summarizeResults([])).toEqual({ averageKm: 0, best: null })
  })

  it('calculates the average and keeps the closest guess', () => {
    const results: RoundResult[] = [
      { city: 'Campinas', distanceKm: 30, guess: [-47, -23] },
      { city: 'Santos', distanceKm: 10, guess: [-46, -24] },
      { city: 'Olímpia', distanceKm: 20, guess: [-49, -21] },
    ]

    expect(summarizeResults(results)).toEqual({ averageKm: 20, best: results[1] })
  })
})
