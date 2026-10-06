# MAX-чат на GREEN-API

Минимальный веб-клиент для отправки и получения текстовых сообщений в мессенджере **MAX** через [GREEN-API](https://green-api.com/max). Внешний вид — упрощённый web.max.ru: список чатов слева, переписка справа, поле ввода снизу.

**Демо:** https://chiliec.github.io/green-api-max-chat/

## Как пользоваться

1. Ввести `apiUrl`, `idInstance` и `apiTokenInstance` из [консоли GREEN-API](https://console.green-api.com). При входе приложение вызывает `getStateInstance` и пускает только с авторизованным инстансом.
2. Ввести номер телефона получателя и нажать «+». Номер превращается в `chatId` MAX через [`CheckAccount`](https://green-api.com/v3/docs/api/service/CheckAccount/), и открывается новый чат.
3. Написать сообщение: оно отправляется через [`SendMessage`](https://green-api.com/v3/docs/api/sending/SendMessage/).
4. Ответ собеседника приходит через [HTTP API](https://green-api.com/v3/docs/api/receiving/technology-http-api/) (`receiveNotification` → `deleteNotification`) и появляется в чате. Сообщение от нового собеседника создаёт чат автоматически.

## Локальный запуск

Нужен Node.js 20+.

```bash
npm i && npm run dev
```

Откройте http://localhost:5173/green-api-max-chat/

Другие команды: `npm test` (vitest), `npm run lint` (oxlint из шаблона Vite), `npm run format` (prettier), `npm run build`.

## Настройка инстанса GREEN-API

1. Создайте инстанс MAX в [консоли](https://console.green-api.com) и авторизуйте его по QR-коду из приложения MAX.
2. В настройках инстанса включите **получение входящих уведомлений** (`incomingWebhook = yes`) и оставьте **`webhookUrl` пустым**. Иначе уведомления уходят на webhook, а не в очередь HTTP API. То же самое можно сделать через [`SetSettings`](https://green-api.com/v3/docs/api/account/SetSettings/):
   ```json
   { "webhookUrl": "", "incomingWebhook": "yes" }
   ```
3. Скопируйте `apiUrl`, `idInstance` и `apiTokenInstance` со страницы инстанса. В форме входа по умолчанию стоит `https://3100.api.green-api.com/v3`; если в консоли указан другой `apiUrl`, используйте его.

API GREEN-API отдаёт `Access-Control-Allow-Origin: *`, поэтому браузер ходит в него напрямую — без бэкенда и прокси.

## Устройство

```
src/
  api.ts         типизированные обёртки над fetch: getStateInstance, checkAccount, sendMessage, receive/deleteNotification
  chat.ts        логика без React: разбор уведомлений, нормализация телефона, reducer чатов
  chat.test.ts   тесты этой логики
  App.tsx        состояние (useReducer + localStorage), цикл опроса, отправка
  Login.tsx  ChatList.tsx  ChatWindow.tsx
```

- **Опрос.** Один цикл `receiveNotification(receiveTimeout=20)` → обработка → `deleteNotification`. Цикл останавливается через `AbortController` при выходе или размонтировании, поэтому двойной запуск эффекта в React StrictMode не создаёт второй цикл. Уведомления, которые не являются входящим текстом (статусы, исходящие, медиа), удаляются без отображения. При ошибке сети цикл повторяет запрос через 5 секунд.
- **Отправка.** Сообщение появляется сразу (🕓), после ответа API получает ✓, а при HTTP-ошибке помечается «не отправлено».
- **Хранение.** Учётные данные и чаты лежат в `localStorage`. Кнопка «Выйти» очищает и то и другое.

## Ограничения

- Только текст (`textMessage` и `extendedTextMessage`). Медиа, статусы доставки и прочтения, группы не поддерживаются.
- Входящие сообщения получаются опросом HTTP API, а не через webhook, поэтому возможна задержка в несколько секунд. Если открыть приложение в двух вкладках, вкладки будут делить одну очередь уведомлений.
- История чатов хранится только в этом браузере. Сообщения, отправленные до первого входа, и сообщения, отправленные с телефона, в приложении не отображаются.
- Токен инстанса хранится в `localStorage` в открытом виде. Для тестового клиента это допустимо, для продакшена — нет.

## Статус проверки

- Логика (разбор уведомлений, телефон → чат, reducer) покрыта тестами vitest.
- Интерфейс прогнан в headless Chrome против замоканного API: вход, создание чата, отправка, ошибка отправки, получение ответа, выход, единственный цикл опроса в StrictMode.
- ⚠️ Сквозная проверка с реальным инстансом MAX **ещё не выполнена**. Раздел обновится после неё.
