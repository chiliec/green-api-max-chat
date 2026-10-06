import { useEffect, useReducer, useState } from 'react'
import * as api from './api'
import { chatsReducer, parseIncoming, type Chat } from './chat'
import { Login } from './Login'
import { ChatList } from './ChatList'
import { ChatWindow } from './ChatWindow'

const load = <T,>(key: string): T | null => JSON.parse(localStorage.getItem(key) ?? 'null')
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export default function App() {
  const [creds, setCreds] = useState(() => load<api.Creds>('creds'))
  const [chats, dispatch] = useReducer(chatsReducer, null, () => load<Chat[]>('chats') ?? [])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pollError, setPollError] = useState('')

  useEffect(() => {
    localStorage.setItem('chats', JSON.stringify(chats))
  }, [chats])

  // Single polling loop per login. Cleanup aborts it, so StrictMode's double effect leaves exactly one.
  useEffect(() => {
    if (!creds) return
    const ctrl = new AbortController()
    ;(async () => {
      while (!ctrl.signal.aborted) {
        try {
          const n = await api.receiveNotification(creds, ctrl.signal)
          setPollError('')
          if (!n) continue
          const incoming = parseIncoming(n.body)
          if (incoming) dispatch({ type: 'addMessage', ...incoming })
          await api.deleteNotification(creds, n.receiptId, ctrl.signal)
        } catch (e) {
          if (ctrl.signal.aborted) return
          setPollError(`Ошибка получения сообщений (${(e as Error).message}), повтор через 5 с`)
          await sleep(5000)
        }
      }
    })()
    return () => ctrl.abort()
  }, [creds])

  function login(c: api.Creds) {
    localStorage.setItem('creds', JSON.stringify(c))
    setCreds(c)
  }

  function logout() {
    localStorage.removeItem('creds')
    dispatch({ type: 'reset' }) // the persist effect then stores an empty list
    setCreds(null)
    setSelectedId(null)
  }

  async function send(chatId: string, text: string) {
    const id = `local-${crypto.randomUUID()}`
    dispatch({
      type: 'addMessage',
      chatId,
      message: { id, text, out: true, ts: Date.now(), status: 'pending' },
    })
    try {
      await api.sendMessage(creds!, chatId, text)
      dispatch({ type: 'setStatus', chatId, id, status: 'sent' })
    } catch {
      dispatch({ type: 'setStatus', chatId, id, status: 'failed' })
    }
  }

  if (!creds) return <Login onLogin={login} />

  const selected = chats.find((c) => c.chatId === selectedId)
  return (
    <div className="app">
      <ChatList
        creds={creds}
        chats={chats}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreate={(chatId, title) => {
          dispatch({ type: 'addChat', chatId, title })
          setSelectedId(chatId)
        }}
        onLogout={logout}
      />
      {selected ? (
        <ChatWindow chat={selected} onSend={(text) => send(selected.chatId, text)} error={pollError} />
      ) : (
        <main className="empty">{pollError || 'Выберите чат или создайте новый по номеру телефона'}</main>
      )}
    </div>
  )
}
