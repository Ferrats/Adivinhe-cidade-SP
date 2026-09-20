import { useRef, useState } from 'react'
import type { RoundResult } from './game'
import { buildShareText } from './share'

export default function ShareResult({ results }: { results: RoundResult[] }) {
  const text = buildShareText(results)
  const textRef = useRef<HTMLTextAreaElement>(null)
  const [status, setStatus] = useState<'idle' | 'copying' | 'copied' | 'manual'>('idle')

  const copyResult = async () => {
    setStatus('copying')
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(text)
      setStatus('copied')
    } catch {
      setStatus('manual')
      textRef.current?.focus()
      textRef.current?.select()
    }
  }

  return <section className="share-result" aria-labelledby="share-title">
    <h2 id="share-title">Compartilhar resultado</h2>
    <p className="guess-helper">Copie e cole no WhatsApp ou onde quiser. Sem revelar as cidades.</p>
    <label className="share-label" htmlFor="share-text">Texto para compartilhar</label>
    <textarea id="share-text" className="share-text" ref={textRef} value={text} readOnly rows={9}
      onFocus={event => event.currentTarget.select()} />
    <button type="button" className="button button--primary" onClick={copyResult} disabled={status === 'copying'}>
      {status === 'copying' ? 'Copiando…' : 'Copiar resultado'}
    </button>
    <p className="guess-helper share-status" role="status" aria-live="polite">
      {status === 'copied' ? 'Resultado copiado! Agora é só colar na conversa.'
        : status === 'manual' ? 'Não foi possível copiar automaticamente. O texto está selecionado: use Copiar no celular ou Ctrl+C / ⌘C.' : ''}
    </p>
  </section>
}
