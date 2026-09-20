import { directionTo, haversineKm } from './geo'
import { findMunicipality, getMunicipality } from './municipalities'

export const MAX_ATTEMPTS = 5
export const SESSION_SIZE = 3
export type Attempt = {
  municipalityId: number
  name: string
  correct: boolean
  distanceKm: number
  direction: ReturnType<typeof directionTo> | null
}
export type RoundState = {
  attempts: Attempt[]
  status: 'playing' | 'won' | 'lost'
  error: string
}
export const initialRound: RoundState = { attempts: [], status: 'playing', error: '' }

export function submitGuess(state: RoundState, input: string, targetId: number): RoundState {
  if (state.status !== 'playing') return state
  const guess = findMunicipality(input)
  if (!guess) return { ...state, error: 'Escolha um município válido do estado de São Paulo.' }
  if (state.attempts.some(attempt => attempt.municipalityId === guess.id)) {
    return { ...state, error: 'Você já tentou essa cidade.' }
  }
  const target = getMunicipality(targetId)
  const correct = guess.id === target.id
  const attempt: Attempt = {
    municipalityId: guess.id, name: guess.name, correct,
    distanceKm: correct ? 0 : haversineKm(guess.center, target.center),
    direction: correct ? null : directionTo(guess.center, target.center),
  }
  const attempts = [...state.attempts, attempt]
  return { attempts, error: '', status: correct ? 'won' : attempts.length >= MAX_ATTEMPTS ? 'lost' : 'playing' }
}

export function selectSession<T>(pool: readonly T[], random = Math.random): T[] {
  const shuffled = [...pool]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, SESSION_SIZE)
}

export function formatDistance(km: number) {
  return km > 0 && km < 1 ? '< 1 km' : `${Math.round(km).toLocaleString('pt-BR')} km`
}

export type RoundResult = {
  city: string
  solved: boolean
  attempts: number
}

export function summarizeResults(results: RoundResult[]) {
  const solvedResults = results.filter((item) => item.solved)
  const solved = solvedResults.length
  const averageAttempts = solved
    ? solvedResults.reduce((sum, item) => sum + item.attempts, 0) / solved
    : 0

  const best = solvedResults.length
    ? solvedResults.reduce((currentBest, item) =>
        item.attempts < currentBest.attempts ? item : currentBest,
      )
    : null

  return { solved, averageAttempts, best }
}
