import { useState, type SubmitEvent } from 'react'
import { checkAccount, type Creds } from './api'
import { normalizePhone, type Chat } from './chat'

interface Props {
  creds: Creds
  chats: Chat[]
  selectedId: string | null
  onSelect: (chatId: string) => void
  onCreate: (chatId: string, title: string) => void
  onLogout: () => void
}

export function ChatList({ creds, chats, selectedId, onSelect, onCreate, onLogout }: Props) {
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: SubmitEvent) {
    e.preventDefault()
    const digits = normalizePhone(phone)
    if (!digits) return setError('Введите номер в формате +7 999 123-45-67')
    setBusy(true)
    setError('')
    try {
      const { exist, chatId } = await checkAccount(creds, digits)
      if (!exist || !chatId) throw new Error('номер не зарегистрирован в MAX')
      onCreate(chatId, `+${digits}`)
      setPhone('')
    } catch (err) {
      setError(`Не удалось создать чат: ${(err as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <aside className="sidebar">
      <header>
        <span>Чаты</span>
        <button className="link" onClick={onLogout}>
          Выйти
        </button>
      </header>
      <form className="new-chat" onSubmit={submit}>
        <input
          type="tel"
          placeholder="Номер телефона"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          aria-label="Номер телефона для нового чата"
        />
        <button disabled={busy || !phone} title="Новый чат">
          +
        </button>
      </form>
      {error && <div className="error">{error}</div>}
      <ul>
        {chats.map((c) => (
          <li key={c.chatId}>
            <button className={c.chatId === selectedId ? 'active' : ''} onClick={() => onSelect(c.chatId)}>
              <b>{c.title}</b>
              <small>{c.messages.at(-1)?.text ?? 'Нет сообщений'}</small>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  )
}
