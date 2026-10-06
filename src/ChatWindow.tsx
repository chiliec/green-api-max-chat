import { useEffect, useRef, useState, type SubmitEvent } from 'react'
import type { Chat } from './chat'

const STATUS = { pending: '🕓', sent: '✓', failed: '⚠ не отправлено' }

interface Props {
  chat: Chat
  onSend: (text: string) => void
  error: string
}

export function ChatWindow({ chat, onSend, error }: Props) {
  const [text, setText] = useState('')
  const bottom = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottom.current?.scrollIntoView()
  }, [chat.messages.length, chat.chatId])

  function submit(e: SubmitEvent) {
    e.preventDefault()
    if (!text.trim()) return
    onSend(text.trim())
    setText('')
  }

  return (
    <main className="thread">
      <header>
        <b>{chat.title}</b>
        {error && <span className="error">{error}</span>}
      </header>
      <div className="messages">
        {chat.messages.map((m) => (
          <div key={m.id} className={`bubble ${m.out ? 'out' : 'in'} ${m.status ?? ''}`}>
            {m.text}
            <time>
              {new Date(m.ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              {m.status && ` ${STATUS[m.status]}`}
            </time>
          </div>
        ))}
        <div ref={bottom} />
      </div>
      <form className="composer" onSubmit={submit}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Сообщение"
          maxLength={4000}
          autoFocus
          aria-label="Текст сообщения"
        />
        <button disabled={!text.trim()}>Отправить</button>
      </form>
    </main>
  )
}
