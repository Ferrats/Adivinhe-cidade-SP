import { directionTo, haversineKm, type LngLat } from './geo'
import type { City } from './data'

export const MAX_ATTEMPTS = 5
export const SUCCESS_RADIUS_KM = 15
export const SESSION_SIZE = 3

export type Attempt = {
  guess: LngLat
  distanceKm: number
  direction: ReturnType<typeof directionTo>
}

export type RoundState = {
  guess: LngLat | null
  attempts: Attempt[]
  status: 'playing' | 'won' | 'lost'
}

export const initialRound: RoundState = { guess: null, attempts: [], status: 'playing' }

type RoundAction = { type: 'mark'; guess: LngLat } | { type: 'confirm'; target: LngLat } | { type: 'reset' }

export function roundReducer(state: RoundState, action: RoundAction): RoundState {
  if (action.type === 'reset') return initialRound
  if (state.status !== 'playing') return state
  if (action.type === 'mark') return { ...state, guess: action.guess }
  if (!state.guess) return state
  const distanceKm = haversineKm(state.guess, action.target)
  const attempts = [...state.attempts, {
    guess: state.guess, distanceKm, direction: directionTo(state.guess, action.target),
  }]
  return {
    guess: null, attempts,
    status: distanceKm <= SUCCESS_RADIUS_KM ? 'won' : attempts.length >= MAX_ATTEMPTS ? 'lost' : 'playing',
  }
}

export function selectSession(pool: City[], random = Math.random) {
  const shuffled = [...pool]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, SESSION_SIZE)
}

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
