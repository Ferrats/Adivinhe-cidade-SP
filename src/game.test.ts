import { describe, expect, it } from 'vitest'
import { summarizeResults, type RoundResult } from './game'

describe('summarizeResults', () => {
  it('returns an empty summary before the first round', () => {
    expect(summarizeResults([])).toEqual({ solved: 0, averageAttempts: 0, best: null })
  })

  it('counts solved rounds and calculates attempts only from solved rounds', () => {
    const results: RoundResult[] = [
      { city: 'Campinas', solved: true, attempts: 3 },
      { city: 'Santos', solved: false, attempts: 5 },
      { city: 'Olímpia', solved: true, attempts: 1 },
    ]

    expect(summarizeResults(results)).toEqual({
      solved: 2,
      averageAttempts: 2,
      best: results[2],
    })
  })
})
