# КТЖ CRM — Система обработки обращений пассажиров

Production-ready CRM для обработки жалоб пассажиров Казахстанских железных дорог (КТЖ) через WhatsApp.

## Архитектура

```
WhatsApp → Wazzup (транспорт) → Webhook → FastAPI Backend → MongoDB
                                                     ↕
                           Next.js CRM Frontend ← WebSocket
```

## Стек

| Слой | Технология |
|------|-----------|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS |
| Backend | FastAPI (Python 3.12), Uvicorn |
| БД | MongoDB 7.0 (Motor async driver) |
| Realtime | WebSocket (встроен в FastAPI) |
| Транспорт | [Wazzup](https://wazzup24.com) API |
| Запуск | Docker Compose |

## Быстрый старт

### 1. Клонировать и настроить переменные

```bash
git clone <repo>
cd КТЖ
cp .env.example backend/.env
```

Отредактируйте `backend/.env`:
```env
SECRET_KEY=your_long_random_secret
WAZZUP_API_KEY=your_wazzup_api_key
WAZZUP_CHANNEL_ID=your_channel_id
```

### 2. Запуск через Docker Compose

```bash
docker-compose up --build
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### 3. Создать первого оператора

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "operator@ktz.kz",
    "password": "password123",
    "full_name": "Асхат Сейткали",
    "role": "operator"
  }'
```

### 4. Настроить Wazzup Webhook

В личном кабинете Wazzup укажите URL вашего сервера:
```
https://your-domain.com/api/v1/webhook/wazzup
```

Или через API:
```bash
curl -X PATCH https://api.wazzup24.com/v3/webhooks \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"webhooksUri": "https://your-domain.com/api/v1/webhook/wazzup"}'
```

## Структура проекта

```
КТЖ/
├── docker-compose.yml
├── .env.example
│
├── backend/
│   ├── app/
│   │   ├── main.py           ← FastAPI app, WebSocket endpoint
│   │   ├── config.py         ← Настройки (pydantic-settings)
│   │   ├── database.py       ← MongoDB client (Motor)
│   │   ├── models/           ← MongoDB / Pydantic models
│   │   ├── schemas/          ← Request/Response schemas
│   │   ├── api/v1/           ← REST API endpoints
│   │   │   ├── auth.py       ← POST /login, GET /me
│   │   │   ├── contacts.py   ← Контакты пассажиров
│   │   │   ├── conversations.py ← Диалоги
│   │   │   ├── messages.py   ← Сообщения + отправка через Wazzup
│   │   │   ├── cases.py      ← Обращения (CRM core)
│   │   │   └── webhook.py    ← POST /webhook/wazzup
│   │   ├── services/         ← Бизнес-логика
│   │   │   └── wazzup_service.py ← Wazzup REST API client
│   │   └── websocket/        ← ConnectionManager (broadcast)
│   └── requirements.txt
│
└── frontend/
    └── src/
        ├── app/
        │   ├── login/page.tsx     ← Авторизация
        │   └── inbox/page.tsx     ← Главный экран (3 панели)
        ├── components/
        │   ├── inbox/
        │   │   ├── ConversationList.tsx ← Список диалогов
        │   │   ├── ChatWindow.tsx       ← Окно чата
        │   │   ├── MessageBubble.tsx    ← Пузырёк сообщения
        │   │   ├── MessageInput.tsx     ← Поле ввода
        │   │   └── CasePanel.tsx        ← Карточка обращения
        │   └── ui/
        ├── hooks/
        │   ├── useWebSocket.ts     ← WS с auto-reconnect
        │   ├── useConversations.ts
        │   └── useMessages.ts
        └── lib/
            ├── api.ts              ← Axios + JWT interceptor
            └── auth.ts
```

## API Endpoints

| Method | Path | Описание |
|--------|------|----------|
| POST | `/api/v1/auth/login` | Авторизация |
| GET | `/api/v1/auth/me` | Текущий пользователь |
| POST | `/api/v1/auth/register` | Создать оператора |
| GET | `/api/v1/conversations` | Список диалогов |
| GET | `/api/v1/conversations/{id}` | Конкретный диалог |
| PATCH | `/api/v1/conversations/{id}` | Обновить статус/назначение |
| GET | `/api/v1/conversations/{id}/messages` | Сообщения диалога |
| POST | `/api/v1/conversations/{id}/messages` | Отправить сообщение |
| GET | `/api/v1/cases/conversation/{id}` | Обращение по диалогу |
| POST | `/api/v1/cases/conversation/{id}` | Создать обращение |
| PATCH | `/api/v1/cases/{id}` | Обновить обращение |
| GET | `/api/v1/contacts` | Список контактов |
| POST | `/api/v1/webhook/wazzup` | **Webhook от Wazzup** |
| WS | `/ws?token=<jwt>` | WebSocket realtime |

## Тестирование Webhook (без Wazzup)

Симулировать входящее сообщение от пассажира:

```bash
curl -X POST http://localhost:8000/api/v1/webhook/wazzup \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "messageId": "test_001",
        "channelId": "test_channel",
        "chatType": "whatsapp",
        "chatId": "77012345678",
        "text": "Здравствуйте! Мой поезд задержался на 3 часа.",
        "timestamp": 1700000000,
        "type": "text",
        "from_me": false,
        "contact": {
          "name": "Асхат Сейткали"
        }
      }
    ]
  }'
```

## Разработка без Docker

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Переменные окружения

| Переменная | Описание | По умолчанию |
|-----------|----------|-------------|
| `MONGODB_URL` | MongoDB connection string | `mongodb://mongodb:27017` |
| `MONGODB_DB` | Имя базы данных | `ktz_crm` |
| `SECRET_KEY` | JWT secret | ⚠️ Обязательно изменить |
| `WAZZUP_API_KEY` | Ключ API Wazzup | — |
| `WAZZUP_CHANNEL_ID` | ID канала Wazzup | — |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Срок жизни токена | `480` (8 ч.) |
