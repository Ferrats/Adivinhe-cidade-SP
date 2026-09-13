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
