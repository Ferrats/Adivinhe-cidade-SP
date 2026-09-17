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

import { initialRound, MAX_ATTEMPTS, roundReducer, selectSession, SUCCESS_RADIUS_KM } from './game'
import { cities } from './data'
import { haversineKm } from './geo'

describe('five-attempt rounds', () => {
  const target: [number, number] = [-46.6333, -23.5505]
  const miss: [number, number] = [-51, -22]
  const confirm = { type: 'confirm' as const, target }

  it('does not spend an attempt until a selected marker is confirmed', () => {
    expect(roundReducer(initialRound, confirm)).toBe(initialRound)
    const marked = roundReducer(initialRound, { type: 'mark', guess: miss })
    const moved = roundReducer(marked, { type: 'mark', guess: [-50, -21] })
    expect(moved.attempts).toHaveLength(0)
    const submitted = roundReducer(moved, confirm)
    expect(submitted.attempts).toHaveLength(1)
    expect(submitted.attempts[0].guess).toEqual([-50, -21])
    expect(submitted.status).toBe('playing')
    expect(submitted.guess).toBeNull()
    expect(roundReducer(submitted, confirm)).toBe(submitted)
  })

  it('reveals defeat only after the fifth miss and rejects further attempts', () => {
    let state = initialRound
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      state = roundReducer(roundReducer(state, { type: 'mark', guess: miss }), confirm)
      expect(state.status).toBe(i === MAX_ATTEMPTS - 1 ? 'lost' : 'playing')
    }
    expect(state.attempts).toHaveLength(5)
    expect(roundReducer(state, { type: 'mark', guess: target })).toBe(state)
    expect(roundReducer(state, confirm)).toBe(state)
    expect(roundReducer(state, { type: 'reset' })).toEqual(initialRound)
  })

  it('allows a win on the fifth attempt', () => {
    let state = initialRound
    for (let i = 0; i < 4; i++) state = roundReducer(roundReducer(state, { type: 'mark', guess: miss }), confirm)
    state = roundReducer(roundReducer(state, { type: 'mark', guess: target }), confirm)
    expect(state.status).toBe('won')
    expect(state.attempts).toHaveLength(5)
    expect(roundReducer(state, confirm)).toBe(state)
  })

  it('uses unrounded distance for the 15 km success boundary', () => {
    for (const km of [14.999, 15.001]) {
      const guess: [number, number] = [target[0], target[1] + km / 6371.0088 * 180 / Math.PI]
      expect(haversineKm(guess, target)).toBeCloseTo(km, 6)
      const state = roundReducer(roundReducer(initialRound, { type: 'mark', guess }), confirm)
      expect(state.status).toBe(km <= SUCCESS_RADIUS_KM ? 'won' : 'playing')
    }
  })

  it('selects three distinct cities without changing the source pool', () => {
    const original = [...cities]
    const selected = selectSession(cities, () => 0)
    expect(selected).toHaveLength(3)
    expect(new Set(selected.map(city => city.id)).size).toBe(3)
    expect(cities).toEqual(original)
    expect(selectSession([], () => 0)).toEqual([])
  })
})
