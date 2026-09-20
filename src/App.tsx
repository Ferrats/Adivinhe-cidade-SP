import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { cities } from './data'
import { formatDistance, initialRound, MAX_ATTEMPTS, SESSION_SIZE, selectSession, submitGuess, summarizeResults, type Attempt, type RoundResult } from './game'
import { searchMunicipalities } from './municipalities'
import ShareResult from './ShareResult'

const MysteryMap = lazy(() => import('./MapView').then(module => ({ default: module.MysteryMap })))
type Screen = 'intro' | 'mystery' | 'result' | 'summary'

function AttemptHistory({ attempts }: { attempts: Attempt[] }) {
  return <ol className="attempt-list" aria-label="Palpites anteriores">
    {attempts.map((attempt, index) => <li className={`attempt-row ${attempt.correct ? 'attempt-row--correct' : ''}`} key={attempt.municipalityId}>
      <span className="attempt-number">{index + 1}</span>
      <strong className="attempt-city">{attempt.name}</strong>
      <span className="attempt-hint">{attempt.correct ? <><span aria-hidden="true">✓ </span>Acertou!</> : <>
        <span>{formatDistance(attempt.distanceKm)}</span>
        <span><span aria-hidden="true">{attempt.direction?.arrow} </span>{attempt.direction?.label}</span>
      </>}</span>
    </li>)}
  </ol>
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('intro')
  const [session, setSession] = useState(() => cities.slice(0, SESSION_SIZE))
  const [round, setRound] = useState(0)
  const [input, setInput] = useState('')
  const [state, setState] = useState(initialRound)
  const [results, setResults] = useState<RoundResult[]>([])
  const titleRef = useRef<HTMLHeadingElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const city = session[round]
  const latest = state.attempts.at(-1)
  const summary = useMemo(() => summarizeResults(results), [results])
  const matches = useMemo(() => searchMunicipalities(input, state.attempts.map(attempt => attempt.municipalityId)), [input, state.attempts])

  useEffect(() => { titleRef.current?.focus() }, [screen, round])

  const resetGame = () => {
    setSession(selectSession(cities))
    setRound(0)
    setResults([])
    setInput('')
    setState(initialRound)
    setScreen('mystery')
  }

  const handleGuess = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (screen !== 'mystery' || state.status !== 'playing') return
    const next = submitGuess(state, input, city.municipalityId)
    setState(next)
    if (next.error) { inputRef.current?.focus(); return }
    setInput('')
    if (next.status !== 'playing') {
      setResults(current => [...current, { city: city.name, solved: next.status === 'won', attempts: next.attempts.length }])
      setScreen('result')
    } else inputRef.current?.focus()
  }

  const nextRound = () => {
    setInput('')
    setState(initialRound)
    if (round === session.length - 1) setScreen('summary')
    else { setRound(value => value + 1); setScreen('mystery') }
  }

  return <main className="app-shell">
    <header className="topbar"><div className="brand">ADIVINHE A CIDADE</div><div className="alpha">SP · α 0.03</div></header>
    {screen === 'intro' && <section className="panel panel--intro">
      <div className="eyebrow">Seu mapa mental de São Paulo</div>
      <h1>Você reconhece uma cidade paulista só pelo mapa?</h1>
      <p>Três cidades sorteadas. Até cinco palpites por cidade. Observe a malha urbana sem nomes e descubra o município.</p>
      <ol className="rules">
        <li>Digite o nome de um município paulista e confirme.</li>
        <li>Errou? Use a distância e a seta: elas apontam do seu palpite para a cidade misteriosa.</li>
        <li>O acerto vale pelo município correto, mesmo que outro fique bem perto.</li>
      </ol>
      <button className="button button--primary" onClick={resetGame}>Jogar</button>
      <p className="fineprint">Sem conta e sem ranking. 645 municípios aceitos como palpite; 10 cidades como desafios nesta alpha.</p>
    </section>}

    {screen === 'mystery' && <section className="panel panel--game">
      <div className="round-row"><span>Cidade {round + 1}/{session.length}</span><span>Tentativa {state.attempts.length + 1}/{MAX_ATTEMPTS}</span></div>
      <h1 className="screen-title" tabIndex={-1} ref={titleRef}>Que cidade é essa?</h1>
      <div className="game-stage">
        <Suspense fallback={<div className="map map--mystery map-fallback">Carregando mapa…</div>}><MysteryMap city={city} /></Suspense>
      </div>
      <p className="attempt-feedback" role="status" aria-live="polite" aria-atomic="true">
        {latest ? <>A cidade misteriosa fica a aproximadamente <strong>{formatDistance(latest.distanceKm)}</strong>, a <strong>{latest.direction?.label} <span aria-hidden="true">{latest.direction?.arrow}</span></strong> de {latest.name}.</> : 'Observe a forma urbana e faça seu primeiro palpite.'}
      </p>
      {state.attempts.length > 0 && <>
        <AttemptHistory attempts={state.attempts} />
        <p className="guess-helper">Distância em linha reta entre pontos de referência municipais. A seta parte do seu palpite.</p>
      </>}
      <form className="guess-form" onSubmit={handleGuess}>
        <label htmlFor="city-guess">Digite o nome de uma cidade</label>
        <div className="guess-field-row">
          <input id="city-guess" className="guess-input" ref={inputRef} value={input}
            onChange={event => { setInput(event.target.value); if (state.error) setState(current => ({ ...current, error: '' })) }}
            list="municipality-options" placeholder="Ex.: Campinas" autoComplete="off" autoCapitalize="words"
            aria-invalid={!!state.error} aria-describedby={state.error ? 'guess-error' : undefined} />
          <datalist id="municipality-options">{matches.map(item => <option value={item.name} key={item.id} />)}</datalist>
          <button className="button button--primary guess-submit" type="submit" disabled={!input.trim()}>Palpitar</button>
        </div>
        {state.error && <p className="guess-error" id="guess-error" role="alert">{state.error}</p>}
      </form>
    </section>}

    {screen === 'result' && <section className="panel panel--result">
      <div className="eyebrow">{state.status === 'won' ? `Acertou na ${state.attempts.length}ª tentativa!` : 'Fim das cinco tentativas'}</div>
      <h1 tabIndex={-1} ref={titleRef}>{city.name}</h1>
      <p className="result-copy">{state.status === 'won' ? 'Boa leitura do mapa!' : 'A cidade misteriosa era esta. Agora você conhece mais um pedaço de São Paulo.'}</p>
      <AttemptHistory attempts={state.attempts} />
      <button className="button button--primary" onClick={nextRound}>{round === session.length - 1 ? 'Ver resultado final' : 'Próxima cidade'}</button>
    </section>}

    {screen === 'summary' && <section className="panel panel--summary">
      <div className="eyebrow">Sessão concluída</div><h1 tabIndex={-1} ref={titleRef}>Como foi seu mapa mental de São Paulo?</h1>
      <div className="stat-grid">
        <article className="stat-card"><strong>{summary.solved}/{session.length}</strong><span>cidades acertadas</span></article>
        <article className="stat-card"><strong>{summary.solved ? summary.averageAttempts.toFixed(1).replace('.', ',') : '—'}</strong><span>tentativas por acerto</span></article>
      </div>
      <ul className="session-results">{results.map(result => <li key={result.city}><strong>{result.city}</strong><span>{result.solved ? `Acertou em ${result.attempts} ${result.attempts === 1 ? 'tentativa' : 'tentativas'}` : 'Não encontrada · 5 tentativas'}</span></li>)}</ul>
      {summary.best && <p className="summary-copy">Seu acerto mais rápido foi <strong>{summary.best.city}</strong>.</p>}
      <ShareResult results={results} />
      <button className="button button--primary" onClick={resetGame}>Jogar outra sessão</button>
    </section>}
    <footer>Dados de mapa © OpenStreetMap · tiles por OpenFreeMap · <a href="https://github.com/kelvins/municipios-brasileiros">Catálogo de municípios</a> · <a href="/municipalities-LICENSE.txt">Licença dos dados</a></footer>
  </main>
}
