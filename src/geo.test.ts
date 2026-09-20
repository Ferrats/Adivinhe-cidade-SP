import { describe, expect, it } from 'vitest'
import { haversineKm } from './geo'

describe('haversineKm', () => {
  it('returns zero for the same point', () => {
    expect(haversineKm([-46.6333, -23.5505], [-46.6333, -23.5505])).toBe(0)
  })

  it('calculates a plausible distance between São Paulo and Santos', () => {
    const distance = haversineKm([-46.6333, -23.5505], [-46.3289, -23.9608])
    expect(distance).toBeGreaterThan(50)
    expect(distance).toBeLessThan(60)
  })
})

import { directionTo } from './geo'

describe('direction from the guess toward the target', () => {
  it.each([
    [0, 1, 'norte'], [1, 1, 'nordeste'], [1, 0, 'leste'], [1, -1, 'sudeste'],
    [0, -1, 'sul'], [-1, -1, 'sudoeste'], [-1, 0, 'oeste'], [-1, 1, 'noroeste'],
  ])('points from origin to (%s, %s): %s', (lng, lat, label) => {
    expect(directionTo([0, 0], [Number(lng), Number(lat)]).label).toBe(label)
  })
  it('points from Santos toward São Paulo, not the reverse', () => {
    expect(directionTo([-46.3289, -23.9608], [-46.6333, -23.5505]).label).toBe('noroeste')
  })
})
