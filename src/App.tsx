import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { cities } from './data'
import { summarizeResults, type RoundResult } from './game'

const MysteryMap = lazy(() => import('./MapView').then((module) => ({ default: module.MysteryMap })))

type Screen = 'intro' | 'mystery' | 'result' | 'summary'
type Attempt = { name: string; correct: boolean }
type IbgeMunicipality = { nome: string }

const MAX_ATTEMPTS = 5

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim()
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('intro')
  const [round, setRound] = useState(0)
  const [input, setInput] = useState('')
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [results, setResults] = useState<RoundResult[]>([])
  const [municipalities, setMunicipalities] = useState<string[]>([])
  const [municipalityStatus, setMunicipalityStatus] = useState<'loading' | 'ready' | 'fallback'>('loading')
  const [inputError, setInputError] = useState('')

  const city = cities[round]
  const latest = results.at(-1)
  const { solved, averageAttempts, best } = useMemo(() => summarizeResults(results), [results])

  useEffect(() => {
    let active = true

    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados/35/municipios?orderBy=nome')
      .then((response) => {
        if (!response.ok) throw new Error('IBGE request failed')
        return response.json() as Promise<IbgeMunicipality[]>
      })
      .then((data) => {
        if (!active) return
        setMunicipalities(data.map((item) => item.nome))
        setMunicipalityStatus('ready')
      })
      .catch(() => {
        if (!active) return
        setMunicipalities(cities.map((item) => item.name))
        setMunicipalityStatus('fallback')
      })

    return () => {
      active = false
    }
  }, [])

  const municipalityMatches = useMemo(() => {
    const query = normalize(input)
    if (!query) return []

    return municipalities
      .filter((name) => normalize(name).includes(query))
      .sort((a, b) => {
        const aStarts = normalize(a).startsWith(query)
        const bStarts = normalize(b).startsWith(query)
        if (aStarts !== bStarts) return aStarts ? -1 : 1
        return a.localeCompare(b, 'pt-BR')
      })
      .slice(0, 10)
  }, [input, municipalities])

  const resetRound = () => {
    setInput('')
    setAttempts([])
    setInputError('')
  }

  const resetGame = () => {
    setRound(0)
    setResults([])
    resetRound()
    setScreen('mystery')
  }

  const submitGuess = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!city || municipalityStatus === 'loading') return

    const normalizedInput = normalize(input)
    const selectedName = municipalities.find((name) => normalize(name) === normalizedInput)

    if (!selectedName) {
      setInputError('Escolha um município válido do estado de São Paulo.')
      return
    }

    if (attempts.some((attempt) => normalize(attempt.name) === normalize(selectedName))) {
      setInputError('Você já tentou essa cidade.')
      return
    }

    const correct = normalize(selectedName) === normalize(city.name)
    const nextAttempts = [...attempts, { name: selectedName, correct }]
    const finished = correct || nextAttempts.length >= MAX_ATTEMPTS

    setAttempts(nextAttempts)
    setInput('')
    setInputError('')

    if (finished) {
      setResults((current) => [
        ...current,
        { city: city.name, solved: correct, attempts: nextAttempts.length },
      ])
      setScreen('result')
    }
  }

  const nextRound = () => {
    resetRound()

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
        <div className="alpha">SP · α 0.02</div>
      </header>

      {screen === 'intro' && (
        <section className="panel panel--intro">
          <div className="eyebrow">Experimento geográfico</div>
          <h1>Você reconhece uma cidade paulista só pelo mapa?</h1>
          <p>
            Observe a malha urbana sem nomes e tente descobrir o município. Você tem até
            cinco palpites por cidade.
          </p>
          <button className="button button--primary" onClick={resetGame}>Jogar</button>
          <p className="fineprint">Sem conta e sem ranking. Só mapa, memória e 645 possibilidades.</p>
        </section>
      )}

      {screen === 'mystery' && city && (
        <section className="panel panel--game">
          <div className="round-row">
            <span>Cidade {round + 1}/{cities.length}</span>
            <span>Tentativa {Math.min(attempts.length + 1, MAX_ATTEMPTS)}/{MAX_ATTEMPTS}</span>
          </div>
          <h1 className="screen-title">Que cidade é essa?</h1>

          <div className="game-stage">
            <Suspense fallback={<div className="map map--mystery map-fallback">Carregando mapa…</div>}>
              <MysteryMap city={city} />
            </Suspense>
          </div>

          {attempts.length > 0 && (
            <div className="attempt-list" aria-label="Palpites anteriores">
              {attempts.map((attempt, index) => (
                <div className={`attempt-row ${attempt.correct ? 'attempt-row--correct' : ''}`} key={attempt.name}>
                  <span className="attempt-number">{index + 1}</span>
                  <strong>{attempt.name}</strong>
                  <span>{attempt.correct ? '✓' : '×'}</span>
                </div>
              ))}
            </div>
          )}

          <form className="guess-form" onSubmit={submitGuess}>
            <label htmlFor="city-guess">Digite o nome de uma cidade</label>
            <div className="guess-field-row">
              <input
                id="city-guess"
                className="guess-input"
                value={input}
                onChange={(event) => {
                  setInput(event.target.value)
                  setInputError('')
                }}
                list="municipality-options"
                placeholder={municipalityStatus === 'loading' ? 'Carregando municípios…' : 'Ex.: Campinas'}
                autoComplete="off"
                disabled={municipalityStatus === 'loading'}
                aria-describedby={inputError ? 'guess-error' : undefined}
              />
              <datalist id="municipality-options">
                {municipalityMatches.map((name) => <option value={name} key={name} />)}
              </datalist>
              <button
                className="button button--primary guess-submit"
                type="submit"
                disabled={!input.trim() || municipalityStatus === 'loading'}
              >
                Palpitar
              </button>
            </div>
            {inputError && <p className="guess-error" id="guess-error" role="alert">{inputError}</p>}
            {municipalityStatus === 'fallback' && (
              <p className="guess-helper">A lista completa do IBGE não carregou; o modo offline está usando apenas as cidades desta alpha.</p>
            )}
          </form>
        </section>
      )}

      {screen === 'result' && city && latest && (
        <section className="panel panel--result">
          <div className="eyebrow">{latest.solved ? 'Acertou' : 'Fim das tentativas'}</div>
          <h1>{city.name}</h1>
          <p className="result-copy">
            {latest.solved
              ? `Você encontrou a cidade em ${latest.attempts} ${latest.attempts === 1 ? 'tentativa' : 'tentativas'}.`
              : 'A cidade misteriosa era esta. Vale guardar a forma urbana para a próxima.'}
          </p>

          <div className="attempt-list attempt-list--result">
            {attempts.map((attempt, index) => (
              <div className={`attempt-row ${attempt.correct ? 'attempt-row--correct' : ''}`} key={attempt.name}>
                <span className="attempt-number">{index + 1}</span>
                <strong>{attempt.name}</strong>
                <span>{attempt.correct ? '✓' : '×'}</span>
              </div>
            ))}
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
            <article className="stat-card">
              <strong>{solved}/{cities.length}</strong>
              <span>cidades acertadas</span>
            </article>
            <article className="stat-card">
              <strong>{solved ? averageAttempts.toFixed(1).replace('.', ',') : '—'}</strong>
              <span>tentativas por acerto</span>
            </article>
          </div>
          {best && (
            <p className="summary-copy">
              Seu acerto mais rápido foi <strong>{best.city}</strong>, em {best.attempts} {best.attempts === 1 ? 'tentativa' : 'tentativas'}.
            </p>
          )}
          <button className="button button--primary" onClick={resetGame}>Jogar de novo</button>
        </section>
      )}

      <footer>Dados de mapa © OpenStreetMap · tiles por OpenFreeMap · municípios via IBGE</footer>
    </main>
  )
}
