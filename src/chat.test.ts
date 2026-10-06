import { describe, expect, it } from 'vitest'
import { chatsReducer, normalizePhone, parseIncoming, type Message } from './chat'

const notification = (messageData: object, typeWebhook = 'incomingMessageReceived') => ({
  typeWebhook,
  timestamp: 1763115112,
  idMessage: 'm1',
  senderData: { chatId: '10000000', chatName: 'Иван', senderName: 'Ivan' },
  messageData,
})

describe('parseIncoming', () => {
  it('reads textMessage', () => {
    expect(
      parseIncoming(notification({ typeMessage: 'textMessage', textMessageData: { textMessage: 'привет' } })),
    ).toEqual({
      chatId: '10000000',
      title: 'Иван',
      message: { id: 'm1', text: 'привет', out: false, ts: 1763115112000 },
    })
  })

  it('reads extendedTextMessage', () => {
    const n = notification({
      typeMessage: 'extendedTextMessage',
      extendedTextMessageData: { text: 'https://max.ru' },
    })
    expect(parseIncoming(n)?.message.text).toBe('https://max.ru')
  })

  it('ignores other notifications and non-text messages', () => {
    expect(parseIncoming(notification({ typeMessage: 'imageMessage' }))).toBeNull()
    expect(parseIncoming(notification({}, 'outgoingAPIMessageReceived'))).toBeNull()
    expect(parseIncoming({ typeWebhook: 'stateInstanceChanged' })).toBeNull()
    expect(parseIncoming(null)).toBeNull()
  })
})

describe('normalizePhone', () => {
  it.each([
    ['+7 (999) 123-45-67', '79991234567'],
    ['8 999 123 45 67', '79991234567'],
    ['77011234567', '77011234567'],
    ['12345', null],
    ['', null],
  ])('%s → %s', (input, expected) => expect(normalizePhone(input)).toBe(expected))
})

describe('chatsReducer', () => {
  const msg = (id: string): Message => ({ id, text: id, out: false, ts: 0 })

  it('maps an incoming message to an existing chat by chatId and moves it to the top', () => {
    let s = chatsReducer([], { type: 'addChat', chatId: 'a', title: '+79991234567' })
    s = chatsReducer(s, { type: 'addChat', chatId: 'b', title: 'B' })
    s = chatsReducer(s, { type: 'addMessage', chatId: 'a', title: 'Иван', message: msg('1') })
    expect(s.map((c) => c.chatId)).toEqual(['a', 'b'])
    expect(s[0].title).toBe('+79991234567') // keeps the title the user created the chat with
    expect(s[0].messages).toHaveLength(1)
  })

  it('creates a chat for an unknown sender and dedupes redelivered messages', () => {
    let s = chatsReducer([], { type: 'addMessage', chatId: 'x', title: 'Иван', message: msg('1') })
    s = chatsReducer(s, { type: 'addMessage', chatId: 'x', title: 'Иван', message: msg('1') })
    expect(s).toEqual([{ chatId: 'x', title: 'Иван', messages: [msg('1')] }])
  })

  it('updates message status', () => {
    let s = chatsReducer([], {
      type: 'addMessage',
      chatId: 'x',
      message: { ...msg('l'), out: true, status: 'pending' },
    })
    s = chatsReducer(s, { type: 'setStatus', chatId: 'x', id: 'l', status: 'failed' })
    expect(s[0].messages[0].status).toBe('failed')
  })
})
