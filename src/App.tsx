import { useCallback, useMemo, useState } from 'react'
import { cities } from './data'
import { haversineKm, type LngLat } from './geo'
import { GuessMap, MysteryMap } from './MapView'

type Screen = 'intro' | 'mystery' | 'result' | 'summary'

type RoundResult = {
  city: string
  distanceKm: number
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('intro')
  const [round, setRound] = useState(0)
  const [guess, setGuess] = useState<LngLat | null>(null)
  const [guessOpen, setGuessOpen] = useState(false)
  const [results, setResults] = useState<RoundResult[]>([])

  const city = cities[round]
  const latest = results.at(-1)

  const averageKm = useMemo(() => {
    if (!results.length) return 0
    return results.reduce((sum, item) => sum + item.distanceKm, 0) / results.length
  }, [results])

  const best = useMemo(() => {
    if (!results.length) return null
    return [...results].sort((a, b) => a.distanceKm - b.distanceKm)[0]
  }, [results])

  const resetGame = () => {
    setRound(0)
    setGuess(null)
    setGuessOpen(false)
    setResults([])
    setScreen('mystery')
  }

  const handleGuess = useCallback((value: LngLat) => setGuess(value), [])

  const confirmGuess = () => {
    if (!guess || !city) return
    const distanceKm = haversineKm(guess, city.center)
    setResults((current) => [...current, { city: city.name, distanceKm }])
    setGuessOpen(false)
    setScreen('result')
  }

  const nextRound = () => {
    setGuess(null)
    setGuessOpen(false)
    if (round >= cities.length - 1) {
      setScreen('summary')
      return
    }
    setRound((value) => value + 1)
    setScreen('mystery')
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">ADIVINHE A CIDADE</div>
        <div className="alpha">SP · α 0.01</div>
      </header>

      {screen === 'intro' && (
        <section className="panel panel--intro">
          <div className="eyebrow">Experimento geográfico</div>
          <h1>Você reconhece uma cidade paulista só pelo mapa?</h1>
          <p>
            Observe a malha urbana sem nomes e marque no mapa onde você acha que a cidade fica.
            São 10 rodadas nesta primeira versão.
          </p>
          <button className="button button--primary" onClick={resetGame}>Jogar</button>
          <p className="fineprint">Sem conta, sem ranking, sem pegadinha. Só mapa.</p>
        </section>
      )}

      {screen === 'mystery' && city && (
        <section className="panel panel--game">
          <div className="round-row">
            <span>Cidade {round + 1}/{cities.length}</span>
            <span>Observe a forma urbana</span>
          </div>
          <h1 className="screen-title">Que cidade é essa?</h1>

          <div className="game-stage">
            <MysteryMap city={city} />

            {!guessOpen && (
              <button
                className="guess-launcher"
                onClick={() => setGuessOpen(true)}
                aria-label="Abrir mapa para fazer palpite"
              >
                <span className="guess-launcher__icon">⌖</span>
                <span>Fazer palpite</span>
              </button>
            )}

            {guessOpen && (
              <div className="guess-overlay" role="dialog" aria-label="Mapa para fazer o palpite">
                <div className="guess-overlay__header">
                  <div>
                    <strong>Onde ela fica?</strong>
                    <span>Toque no mapa para marcar</span>
                  </div>
                  <button
                    className="guess-overlay__close"
                    onClick={() => setGuessOpen(false)}
                    aria-label="Fechar mapa de palpite"
                  >
                    ×
                  </button>
                </div>

                <GuessMap value={guess} onChange={handleGuess} />

                <button
                  className="button button--primary guess-overlay__confirm"
                  disabled={!guess}
                  onClick={confirmGuess}
                >
                  Confirmar palpite
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {screen === 'result' && city && latest && (
        <section className="panel panel--result">
          <div className="eyebrow">Resultado</div>
          <div className="distance">{Math.round(latest.distanceKm)} km</div>
          <p>de distância do centro de</p>
          <h1>{city.name}</h1>
          <div className="result-note">
            {latest.distanceKm < 25 ? 'Quase em cima.' : latest.distanceKm < 80 ? 'Você pegou bem a região.' : 'Ainda tem chão para conhecer SP.'}
          </div>
          <button className="button button--primary" onClick={nextRound}>
            {round === cities.length - 1 ? 'Ver resultado final' : 'Próxima cidade'}
          </button>
        </section>
      )}

      {screen === 'summary' && (
        <section className="panel panel--summary">
          <div className="eyebrow">Alpha concluído</div>
          <h1>Como foi seu mapa mental de São Paulo?</h1>
          <div className="stat-grid">
            <article className="stat-card"><strong>{Math.round(averageKm)} km</strong><span>erro médio</span></article>
            <article className="stat-card"><strong>{best ? `${Math.round(best.distanceKm)} km` : '—'}</strong><span>melhor palpite</span></article>
          </div>
          {best && <p className="summary-copy">Sua melhor cidade foi <strong>{best.city}</strong>.</p>}
          <button className="button button--primary" onClick={resetGame}>Jogar de novo</button>
        </section>
      )}

      <footer>Dados de mapa © OpenStreetMap · tiles por OpenFreeMap</footer>
    </main>
  )
}
