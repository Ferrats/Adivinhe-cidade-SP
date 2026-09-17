import { lazy, Suspense, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { cities } from './data'
import type { LngLat } from './geo'
import { initialRound, MAX_ATTEMPTS, roundReducer, selectSession, SESSION_SIZE, SUCCESS_RADIUS_KM, summarizeResults, type Attempt, type RoundResult } from './game'

const MysteryMap = lazy(() => import('./MapView').then((module) => ({ default: module.MysteryMap })))
const GuessMap = lazy(() => import('./MapView').then((module) => ({ default: module.GuessMap })))
const ResultMap = lazy(() => import('./MapView').then((module) => ({ default: module.ResultMap })))

const distance = (km: number) => (Math.ceil(km * 10) / 10).toLocaleString('pt-BR', { maximumFractionDigits: 1 })

function AttemptHistory({ attempts }: { attempts: Attempt[] }) {
  if (!attempts.length) return null
  return <ol className="attempt-history" aria-label="Palpites confirmados">
    {attempts.map((attempt, index) => <li key={index}>
      <span className="attempt-number">{index + 1}</span>
      <strong>{distance(attempt.distanceKm)} km</strong>
      <span><span aria-hidden="true">{attempt.direction.arrow}</span> {attempt.direction.label}</span>
    </li>)}
  </ol>
}

type SessionResult = RoundResult & { won: boolean; attempts: number }

export default function App() {
  const [screen, setScreen] = useState<'intro' | 'game' | 'summary'>('intro')
  const [session, setSession] = useState(() => cities.slice(0, SESSION_SIZE))
  const [round, setRound] = useState(0)
  const [state, dispatch] = useReducer(roundReducer, initialRound)
  const [guessOpen, setGuessOpen] = useState(false)
  const [guessVisited, setGuessVisited] = useState(false)
  const [results, setResults] = useState<SessionResult[]>([])
  const guessLauncherRef = useRef<HTMLButtonElement>(null)
  const guessCloseRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const city = session[round]
  const finished = state.status !== 'playing'
  const bestAttempt = state.attempts.reduce<Attempt | null>((best, attempt) =>
    !best || attempt.distanceKm < best.distanceKm ? attempt : best, null)
  const lastAttempt = state.attempts.at(-1)
  const { averageKm, best } = useMemo(() => summarizeResults(results), [results])

  const closeGuess = useCallback(() => {
    setGuessOpen(false)
    window.setTimeout(() => guessLauncherRef.current?.focus(), 0)
  }, [])

  useEffect(() => {
    if (!guessOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    guessCloseRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeGuess()
      if (event.key !== 'Tab') return
      const nodes = dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], [tabindex="0"]')
      if (!nodes?.length) return
      const first = nodes[0], last = nodes[nodes.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [closeGuess, guessOpen])

  useEffect(() => { titleRef.current?.focus() }, [screen, round, finished])

  const resetGame = () => {
    setSession(selectSession(cities))
    setRound(0)
    dispatch({ type: 'reset' })
    setGuessOpen(false)
    setGuessVisited(false)
    setResults([])
    setScreen('game')
  }
  const handleGuess = useCallback((guess: LngLat) => dispatch({ type: 'mark', guess }), [])
  const confirmGuess = () => {
    if (!state.guess || finished) return
    dispatch({ type: 'confirm', target: city.center })
    closeGuess()
  }
  const nextRound = () => {
    if (!bestAttempt || !finished) return
    setResults(current => [...current, { city: city.name, distanceKm: bestAttempt.distanceKm,
      guess: bestAttempt.guess, won: state.status === 'won', attempts: state.attempts.length }])
    dispatch({ type: 'reset' })
    setGuessOpen(false)
    setGuessVisited(false)
    if (round === session.length - 1) setScreen('summary')
    else setRound(value => value + 1)
  }

  return <main className="app-shell">
    <header className="topbar"><div className="brand">ADIVINHE A CIDADE</div><div className="alpha">SP · α 0.02</div></header>
    {screen === 'intro' && <section className="panel panel--intro">
      <div className="eyebrow">Seu mapa mental de São Paulo</div>
      <h1>Você reconhece uma cidade paulista só pelo mapa?</h1>
      <p>Três cidades. Até cinco tentativas por cidade. Observe a malha urbana sem nomes e marque onde você acha que ela fica.</p>
      <ol className="rules"><li>Toque no mapa de SP e confirme seu palpite.</li><li>A distância e a direção ajudam você a se aproximar.</li><li>Chegou a até {SUCCESS_RADIUS_KM} km do centro? Acertou!</li></ol>
      <button className="button button--primary" onClick={resetGame}>Jogar</button>
      <p className="fineprint">A margem de acerto é uma distância do centro, não o limite do município.</p>
    </section>}

    {screen === 'game' && !finished && <section className="panel panel--game">
      <div className="round-row"><span>Cidade {round + 1}/{session.length}</span><span>Tentativa {state.attempts.length + 1}/{MAX_ATTEMPTS}</span></div>
      <h1 className="screen-title" tabIndex={-1} ref={titleRef}>Que cidade é essa?</h1>
      <div className="attempt-feedback" role="status">
        {lastAttempt ? <>Seu {state.attempts.length}º palpite ficou a <strong>{distance(lastAttempt.distanceKm)} km</strong>. A cidade está a <strong>{lastAttempt.direction.label} <span aria-hidden="true">{lastAttempt.direction.arrow}</span></strong> dele.</> : <>Observe a forma urbana. Você tem {MAX_ATTEMPTS} tentativas para chegar a até {SUCCESS_RADIUS_KM} km do centro.</>}
      </div>
      <div className="game-stage">
        <Suspense fallback={<div className="map map--mystery map-fallback">Carregando mapa…</div>}><MysteryMap city={city} /></Suspense>
        {!guessOpen && <button className="guess-launcher" ref={guessLauncherRef} onClick={() => { setGuessVisited(true); setGuessOpen(true) }} aria-label="Abrir mapa para fazer palpite"><span aria-hidden="true">⌖</span><span>{state.attempts.length ? 'Próximo palpite' : 'Fazer palpite'}</span></button>}
        {guessVisited && <div hidden={!guessOpen} className="guess-overlay" ref={dialogRef} role="dialog" aria-modal="true" aria-label="Mapa para fazer o palpite">
          <div className="guess-overlay__header"><div><strong>Tentativa {state.attempts.length + 1} de {MAX_ATTEMPTS}</strong><span>Marque e ajuste antes de confirmar</span></div><button className="guess-overlay__close" ref={guessCloseRef} onClick={closeGuess} aria-label="Fechar mapa de palpite">×</button></div>
          <div className="guess-overlay__body">
            <Suspense fallback={<div className="map map--guess map-fallback">Carregando mapa…</div>}><GuessMap value={state.guess} onChange={handleGuess} attempts={state.attempts} visible={guessOpen} /></Suspense>
            <AttemptHistory attempts={state.attempts} />
            <p className="guess-help">{lastAttempt ? `A cidade está a ${lastAttempt.direction.label} do palpite ${state.attempts.length}.` : 'O marcador laranja é o seu próximo palpite.'}</p>
          </div>
          <button className="button button--primary guess-overlay__confirm" disabled={!state.guess} onClick={confirmGuess}>Confirmar palpite</button>
        </div>}
      </div>
      <AttemptHistory attempts={state.attempts} />
    </section>}

    {screen === 'game' && finished && bestAttempt && <section className="panel panel--result">
      <div className="eyebrow">{state.status === 'won' ? `Acertou na ${state.attempts.length}ª tentativa!` : 'Cinco tentativas concluídas'}</div>
      <h1 tabIndex={-1} ref={titleRef}>{city.name}</h1>
      <p>Seu melhor palpite ficou a</p><div className="distance">{distance(bestAttempt.distanceKm)} km</div><p>do centro da cidade.</p>
      <Suspense fallback={<div className="map map--result map-fallback">Preparando comparação…</div>}><ResultMap city={city} guess={bestAttempt.guess} /></Suspense>
      <div className="result-note">{state.status === 'won' ? `Dentro da margem de ${SUCCESS_RADIUS_KM} km. Boa leitura do mapa!` : 'Agora você conhece mais um pedaço de São Paulo.'}</div>
      <button className="button button--primary" onClick={nextRound}>{round === session.length - 1 ? 'Ver resultado final' : 'Próxima cidade'}</button>
    </section>}

    {screen === 'summary' && <section className="panel panel--summary">
      <div className="eyebrow">Sessão concluída</div><h1 tabIndex={-1} ref={titleRef}>Como foi seu mapa mental de São Paulo?</h1>
      <div className="stat-grid"><article className="stat-card"><strong>{results.filter(result => result.won).length}/{session.length}</strong><span>cidades encontradas</span></article><article className="stat-card"><strong>{distance(averageKm)} km</strong><span>média dos melhores palpites</span></article></div>
      <ul className="session-results">{results.map(result => <li key={result.city}><strong>{result.city}</strong><span>{result.won ? `Acertou em ${result.attempts}` : 'Não encontrada'} · {distance(result.distanceKm)} km</span></li>)}</ul>
      {best && <p>Sua melhor cidade foi <strong>{best.city}</strong>.</p>}
      <button className="button button--primary" onClick={resetGame}>Jogar outra sessão</button>
    </section>}
    <footer>Dados de mapa © OpenStreetMap · tiles por OpenFreeMap</footer>
  </main>
}
