export interface Creds {
  apiUrl: string
  idInstance: string
  apiTokenInstance: string
}

export interface Notification {
  receiptId: number
  body: unknown
}

async function call<T>(c: Creds, method: string, init: RequestInit = {}, suffix = ''): Promise<T> {
  const base = c.apiUrl.trim().replace(/\/+$/, '')
  const res = await fetch(`${base}/waInstance${c.idInstance}/${method}/${c.apiTokenInstance}${suffix}`, {
    ...init,
    headers: init.body ? { 'Content-Type': 'application/json' } : undefined,
  })
  if (!res.ok) throw new Error(`${method}: HTTP ${res.status}`)
  const text = await res.text()
  return (text ? JSON.parse(text) : null) as T
}

export const getStateInstance = (c: Creds) => call<{ stateInstance: string }>(c, 'getStateInstance')

export const checkAccount = (c: Creds, phoneNumber: string) =>
  call<{ exist: boolean; chatId: string }>(c, 'checkAccount', {
    method: 'POST',
    body: JSON.stringify({ phoneNumber: Number(phoneNumber) }),
  })

export const sendMessage = (c: Creds, chatId: string, message: string) =>
  call<{ idMessage: string }>(c, 'sendMessage', {
    method: 'POST',
    body: JSON.stringify({ chatId, message }),
  })

/** Long-polls up to `timeout` seconds; null when the queue is empty. */
export const receiveNotification = (c: Creds, signal: AbortSignal, timeout = 20) =>
  call<Notification | null>(c, 'receiveNotification', { signal }, `?receiveTimeout=${timeout}`)

export const deleteNotification = (c: Creds, receiptId: number, signal?: AbortSignal) =>
  call<{ result: boolean }>(c, 'deleteNotification', { method: 'DELETE', signal }, `/${receiptId}`)
