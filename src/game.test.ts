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

import { formatDistance, initialRound, MAX_ATTEMPTS, selectSession, submitGuess } from './game'
import { cities } from './data'
import { findMunicipality, getMunicipality, municipalities, normalizeName, searchMunicipalities } from './municipalities'
import { haversineKm } from './geo'

const sp = findMunicipality('São Paulo')!
const wrongNames = ['Santos', 'Campinas', 'Olímpia', 'Sorocaba', 'Barretos']

describe('named guesses with geographic hints', () => {
  it('accepts accents, case and whitespace variations, with no arrow on a correct answer', () => {
    const state = submitGuess(initialRound, '  SAO   PAULO  ', sp.id)
    expect(state.status).toBe('won')
    expect(state.attempts[0]).toMatchObject({ name: 'São Paulo', correct: true, distanceKm: 0, direction: null })
  })
  it('does not spend attempts on invalid or repeated municipalities', () => {
    expect(submitGuess(initialRound, 'Curitiba', sp.id).attempts).toHaveLength(0)
    expect(submitGuess(initialRound, '', sp.id).error).toBeTruthy()
    const first = submitGuess(initialRound, 'olimpia', sp.id)
    const repeated = submitGuess(first, ' OLÍMPIA ', sp.id)
    expect(repeated.attempts).toHaveLength(1)
    expect(repeated.error).toContain('já tentou')
    expect(submitGuess(repeated, 'Santos', sp.id).error).toBe('')
  })
  it('points from Santos toward São Paulo with a plausible straight-line distance', () => {
    const attempt = submitGuess(initialRound, 'Santos', sp.id).attempts[0]
    expect(attempt.direction?.label).toBe('noroeste')
    expect(attempt.distanceKm).toBeGreaterThan(40)
    expect(attempt.distanceKm).toBeLessThan(70)
    const reverse = submitGuess(initialRound, 'São Paulo', findMunicipality('Santos')!.id).attempts[0]
    expect(reverse.direction?.label).toBe('sudeste')
    expect(reverse.distanceKm).toBeCloseTo(attempt.distanceKm)
  })
  it('does not award a win for a different municipality within 15 km', () => {
    const close = municipalities.find(item => item.id !== sp.id && haversineKm(item.center, sp.center) < 15)!
    expect(close).toBeDefined()
    const state = submitGuess(initialRound, close.name, sp.id)
    expect(state.status).toBe('playing')
    expect(state.attempts[0].correct).toBe(false)
  })
  it('loses only on the fifth valid miss and rejects attempts after the round', () => {
    let state = initialRound
    for (const [index, name] of wrongNames.entries()) {
      state = submitGuess(state, name, sp.id)
      expect(state.status).toBe(index === MAX_ATTEMPTS - 1 ? 'lost' : 'playing')
    }
    expect(submitGuess(state, 'São Paulo', sp.id)).toBe(state)
    const won = submitGuess(initialRound, 'São Paulo', sp.id)
    expect(submitGuess(won, 'Santos', sp.id)).toBe(won)
  })
  it('can still win on the fifth attempt', () => {
    let state = initialRound
    for (const name of wrongNames.slice(0, 4)) state = submitGuess(state, name, sp.id)
    state = submitGuess(state, 'São Paulo', sp.id)
    expect(state.status).toBe('won')
    expect(state.attempts).toHaveLength(5)
  })
  it('does not display zero km for a close incorrect guess', () => {
    expect(formatDistance(0.3)).toBe('< 1 km')
    expect(formatDistance(42.6)).toBe('43 km')
  })
})

describe('local municipality catalog and sessions', () => {
  it('contains all 645 unique SP municipalities with finite coordinates in the state region', () => {
    expect(municipalities).toHaveLength(645)
    expect(new Set(municipalities.map(item => item.id)).size).toBe(645)
    expect(new Set(municipalities.map(item => normalizeName(item.name))).size).toBe(645)
    for (const item of municipalities) {
      expect(String(item.id)).toMatch(/^35\d{5}$/)
      expect(item.center[0]).toBeGreaterThan(-54)
      expect(item.center[0]).toBeLessThan(-44)
      expect(item.center[1]).toBeGreaterThan(-26)
      expect(item.center[1]).toBeLessThan(-19)
    }
  })
  it('has a matching named municipality for every challenge and nearby reference coordinates', () => {
    for (const city of cities) {
      const municipality = getMunicipality(city.municipalityId)
      expect(normalizeName(municipality.name)).toBe(normalizeName(city.name))
      expect(haversineKm(city.center, municipality.center)).toBeLessThan(5)
    }
  })
  it('suggests normalized partial names and omits previous guesses', () => {
    expect(searchMunicipalities('sao pa')[0].id).toBe(sp.id)
    expect(searchMunicipalities('sao pa', [sp.id]).some(item => item.id === sp.id)).toBe(false)
    expect(searchMunicipalities('')).toEqual([])
  })
  it('accepts source spelling variants but uses official IBGE names', () => {
    expect(findMunicipality('Florínia')).toEqual(findMunicipality('Florínea'))
    expect(findMunicipality('Biritiba-Mirim')?.name).toBe('Biritiba Mirim')
    expect(findMunicipality('Itaóca')?.name).toBe('Itaoca')
  })
  it('draws three distinct cities without mutating the challenge pool', () => {
    const original = [...cities]
    const selected = selectSession(cities, () => 0)
    expect(selected).toHaveLength(3)
    expect(new Set(selected.map(item => item.id)).size).toBe(3)
    expect(cities).toEqual(original)
    expect(selectSession([], () => 0)).toEqual([])
  })
})
