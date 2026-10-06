export type Status = 'pending' | 'sent' | 'failed'

export interface Message {
  id: string
  text: string
  out: boolean
  ts: number
  status?: Status
}

export interface Chat {
  chatId: string
  title: string
  messages: Message[]
}

export type Action =
  | { type: 'addChat'; chatId: string; title: string }
  | { type: 'addMessage'; chatId: string; title?: string; message: Message }
  | { type: 'setStatus'; chatId: string; id: string; status: Status }
  | { type: 'reset' }

/** "+7 (999) 123-45-67" / "8 999 123 45 67" → "79991234567"; null if it doesn't look like a phone. */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('8')) digits = '7' + digits.slice(1)
  return digits.length >= 10 && digits.length <= 15 ? digits : null
}

/** Extracts an incoming text message from a GREEN-API notification body; null for anything else. */
export function parseIncoming(body: unknown): { chatId: string; title: string; message: Message } | null {
  const b = body as {
    typeWebhook?: string
    idMessage?: string
    timestamp?: number
    senderData?: { chatId?: string; chatName?: string; senderName?: string }
    messageData?: {
      typeMessage?: string
      textMessageData?: { textMessage?: string }
      extendedTextMessageData?: { text?: string }
    }
  } | null
  if (b?.typeWebhook !== 'incomingMessageReceived') return null
  const md = b.messageData
  const text =
    md?.typeMessage === 'textMessage'
      ? md.textMessageData?.textMessage
      : md?.typeMessage === 'extendedTextMessage'
        ? md.extendedTextMessageData?.text
        : undefined
  const chatId = b.senderData?.chatId
  if (!text || !chatId || !b.idMessage) return null
  return {
    chatId,
    title: b.senderData?.chatName || b.senderData?.senderName || chatId,
    message: { id: b.idMessage, text, out: false, ts: (b.timestamp ?? Date.now() / 1000) * 1000 },
  }
}

export function chatsReducer(chats: Chat[], a: Action): Chat[] {
  if (a.type === 'reset') return []
  const existing = chats.find((c) => c.chatId === a.chatId)
  const others = chats.filter((c) => c.chatId !== a.chatId)
  switch (a.type) {
    case 'addChat':
      return existing ? chats : [{ chatId: a.chatId, title: a.title, messages: [] }, ...chats]
    case 'addMessage': {
      // Dedupe: a notification can be redelivered if deleteNotification failed.
      if (existing?.messages.some((m) => m.id === a.message.id)) return chats
      const chat = existing ?? { chatId: a.chatId, title: a.title ?? a.chatId, messages: [] }
      return [{ ...chat, messages: [...chat.messages, a.message] }, ...others]
    }
    case 'setStatus':
      if (!existing) return chats
      return chats.map((c) =>
        c === existing
          ? { ...c, messages: c.messages.map((m) => (m.id === a.id ? { ...m, status: a.status } : m)) }
          : c,
      )
  }
}
