import { describe, expect, it } from 'vitest'
import { buildShareText } from './share'

describe('share result without spoilers', () => {
  it('distinguishes an early win, a fifth-attempt win and a loss without revealing cities', () => {
    const results = [
      { city: 'Santos', solved: true, attempts: 1 },
      { city: 'Campinas', solved: true, attempts: 5 },
      { city: 'Olímpia', solved: false, attempts: 5 },
    ]
    const text = buildShareText(results)
    expect(text).toContain('Sessão aleatória · 2/3 cidades acertadas')
    expect(text).toContain('1: 🟩⬜⬜⬜⬜ 1/5')
    expect(text).toContain('2: 🟥🟥🟥🟥🟩 5/5')
    expect(text).toContain('3: 🟥🟥🟥🟥🟥 X/5')
    for (const result of results) expect(text).not.toContain(result.city)
    expect(text).toContain('\nhttps://adivinhe-cidade-sp.pages.dev/')
  })
})
