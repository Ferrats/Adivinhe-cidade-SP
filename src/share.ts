import { MAX_ATTEMPTS, type RoundResult } from './game'

export function buildShareText(results: RoundResult[]) {
  const solved = results.filter(result => result.solved).length
  const rows = results.map((result, index) => {
    const misses = result.attempts - (result.solved ? 1 : 0)
    const grid = '🟥'.repeat(misses) + (result.solved ? '🟩' : '')
      + '⬜'.repeat(MAX_ATTEMPTS - result.attempts)
    return `${index + 1}: ${grid} ${result.solved ? result.attempts : 'X'}/${MAX_ATTEMPTS}`
  })
  return [
    '🗺️ Adivinhe a Cidade — SP',
    `Sessão aleatória · ${solved}/${results.length} cidades acertadas`,
    '', ...rows, '',
    'Consegue reconhecer as cidades pelo mapa?',
    'https://adivinhe-cidade-sp.pages.dev/',
  ].join('\n')
}
