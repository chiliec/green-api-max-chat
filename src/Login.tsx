import { useState, type SubmitEvent } from 'react'
import { getStateInstance, type Creds } from './api'

export function Login({ onLogin }: { onLogin: (c: Creds) => void }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const c: Creds = {
      apiUrl: String(f.get('apiUrl')).trim(),
      idInstance: String(f.get('idInstance')).trim(),
      apiTokenInstance: String(f.get('apiTokenInstance')).trim(),
    }
    setBusy(true)
    setError('')
    try {
      const { stateInstance } = await getStateInstance(c)
      if (stateInstance !== 'authorized') throw new Error(`инстанс не авторизован (${stateInstance})`)
      onLogin(c)
    } catch (err) {
      setError(`Не удалось войти: ${(err as Error).message}`)
      setBusy(false)
    }
  }

  return (
    <form className="login" onSubmit={submit}>
      <h1>MAX × GREEN-API</h1>
      <p>Данные инстанса из консоли console.green-api.com</p>
      <label>
        apiUrl
        <input name="apiUrl" defaultValue="https://3100.api.green-api.com/v3" required />
      </label>
      <label>
        idInstance
        <input name="idInstance" inputMode="numeric" required autoFocus />
      </label>
      <label>
        apiTokenInstance
        <input name="apiTokenInstance" type="password" required />
      </label>
      {error && <div className="error">{error}</div>}
      <button disabled={busy}>{busy ? 'Проверка…' : 'Войти'}</button>
    </form>
  )
}
