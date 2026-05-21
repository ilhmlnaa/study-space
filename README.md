<div align="center">

<img src="https://storage.hamdiv.me/project/portfolio/study-space.png" alt="StudySpace" width="100%" style="border-radius: 12px;" />

<p>
  <img src="https://img.shields.io/badge/Next.js-15+-000000?style=flat-square&logo=nextdotjs&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-5+-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma">
  <img src="https://img.shields.io/badge/NextAuth-Auth-000000?style=flat-square&logo=auth0&logoColor=white" alt="NextAuth">
  <img src="https://img.shields.io/badge/Socket.IO-Realtime-010101?style=flat-square&logo=socketdotio&logoColor=white" alt="Socket.IO">
  <img src="https://img.shields.io/badge/Excalidraw-Whiteboard-6965DB?style=flat-square&logo=excalidraw&logoColor=white" alt="Excalidraw">
  <img src="https://img.shields.io/badge/Tailwind_CSS-v3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker">
</p>

</div>

---

## Overview

**StudySpace** is a full-stack collaborative study room application. Mentors can create rooms, students can join using a room code, and everyone can interact through realtime chat, a collaborative Excalidraw whiteboard, polling, raise hand, announcements, and participant presence.

The application is built as a single full-stack Next.js app and focuses on client-server communication, authentication, relational database design, role-based access control, and realtime events.

## Features

- Landing page with modern LMS/SaaS-style UI
- Email/password registration and login
- Google OAuth login
- Role-based dashboards for Admin, Mentor, Moderator, and Student
- Mentor room creation with unique room codes
- Student join room by code
- Moderator assignment by mentor
- Realtime room chat with message history
- Realtime participant list
- Collaborative Excalidraw whiteboard
- Whiteboard snapshot persistence
- Whiteboard permissions:
  - `MENTOR_ONLY`
  - `MENTOR_MODERATOR`
  - `ALL_PARTICIPANTS`
- Realtime polling with one vote per student
- Raise hand and lower hand flow
- Mentor/moderator raise hand resolution
- Realtime announcements
- Closed room read-only history mode
- Light and dark mode
- Docker and GHCR image support

## Tech Stack

| Area | Stack |
|---|---|
| Framework | Next.js App Router, React, TypeScript |
| Styling | Tailwind CSS, next-themes, Lucide React |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | NextAuth/Auth.js, Prisma Adapter, bcrypt |
| Validation | Zod |
| Realtime | Socket.IO |
| Whiteboard | @excalidraw/excalidraw |
| Package Manager | pnpm |
| Container | Docker, Docker Compose, GHCR |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL

### Clone and install

```bash
git clone <your-repository-url>
cd study-space
pnpm install
```

### Environment variables

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Default local values:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/studyspace"
NEXTAUTH_SECRET="change-this-secret"
NEXTAUTH_URL="http://localhost:3000"
AUTH_SECRET="change-this-secret"
AUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST="true"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

For Google login, fill `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from Google Cloud Console.

### Database setup

For development (quick, no migration history):

```bash
pnpm db:generate
pnpm db:push
pnpm db:seed
```

For production (uses migration files):

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

### Run development server

```bash
pnpm dev
```

Open `http://localhost:3000`.

> The app uses `server.ts` as a custom Next.js server so Socket.IO can attach to the same HTTP server.

## Default Seed Accounts

All seeded users use the same password: `password123`.

| Role | Email | Password |
|---|---|---|
| Admin | `admin@studyspace.test` | `password123` |
| Mentor | `mentor@studyspace.test` | `password123` |
| Moderator | `moderator@studyspace.test` | `password123` |
| Student | `student@studyspace.test` | `password123` |
| Student Dummy | `student1@studyspace.test` | `password123` |
| Student Dummy | `student2@studyspace.test` | `password123` |
| Student Dummy | `student3@studyspace.test` | `password123` |

## Available Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start custom Next.js + Socket.IO development server |
| `pnpm dev:next` | Start plain Next.js dev server without custom Socket.IO server |
| `pnpm build` | Build production app using webpack |
| `pnpm build:turbo` | Build using default Next.js/Turbopack build |
| `pnpm start` | Start custom server |
| `pnpm lint` | Run ESLint |
| `pnpm db:generate` | Generate Prisma Client |
| `pnpm db:push` | Push schema to database (development) |
| `pnpm db:migrate` | Run migrations (production) |
| `pnpm db:deploy` | Alias for `db:migrate` |
| `pnpm db:migrate:dev` | Create new migration (development) |
| `pnpm db:seed` | Seed demo accounts |
| `pnpm db:studio` | Open Prisma Studio |

## Docker

### Build locally with Docker Compose

```bash
docker compose up -d --build
```

### Use prebuilt GHCR image

A prebuilt image is available at:

```bash
ghcr.io/ilhmlnaa/study-space:latest
```

Run with the production compose file:

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

If the package is private, login to GHCR first:

```bash
docker login ghcr.io -u ilhmlnaa
```

### Production notes

Update these variables for production:

```env
NEXTAUTH_SECRET="strong-secret"
AUTH_SECRET="strong-secret"
NEXTAUTH_URL="https://your-domain.com"
AUTH_URL="https://your-domain.com"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
AUTH_TRUST_HOST="true"
```

## Realtime Architecture

StudySpace uses a custom `server.ts` to run Next.js and Socket.IO on the same HTTP server.

Flow example for chat:

```text
Client emits chat:send
  -> Socket.IO server receives event
  -> Message is saved with Prisma
  -> Server broadcasts chat:new to users in the room
  -> Clients update UI without refreshing
```

Important realtime events:

| Feature | Client Event | Server Event |
|---|---|---|
| Room presence | `room:join`, `room:leave` | `room:participants`, `room:user_joined`, `room:user_left` |
| Chat | `chat:send` | `chat:new`, `chat:error` |
| Whiteboard | `whiteboard:sync`, `whiteboard:save`, `whiteboard:clear` | `whiteboard:update`, `whiteboard:cleared` |
| Polls | `poll:create`, `poll:vote`, `poll:close` | `poll:new`, `poll:result`, `poll:closed` |
| Raise hand | `hand:raise`, `hand:resolve` | `hand:raised`, `hand:resolved` |
| Announcements | `announcement:send` | `announcement:new` |

Realtime scalability safeguards included in the Socket.IO server:

- Socket membership validation so a connected client can only emit events for the room it joined.
- Debounced participant list broadcast to reduce database queries during join/leave spikes.
- Chat rate limiting to reduce spam and excessive database writes.
- Whiteboard sync rate limiting and payload size guard.
- Reconnect handling on the client to automatically rejoin the room.

For single-instance deployments, Redis is optional. For multiple app instances behind a load balancer, configure `REDIS_URL` and use a Socket.IO Redis adapter so room broadcasts work across instances.

## API Endpoints

Most endpoints require an authenticated session cookie from NextAuth/Auth.js.

### Auth

| Method | Endpoint | Description |
|---|---|---|
| `GET/POST` | `/api/auth/[...nextauth]` | NextAuth handlers |
| `POST` | `/api/register` | Register email/password user |

### Users

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users` | List users (admin only) |
| `PATCH` | `/api/users/[id]` | Update user role (admin only) |
| `DELETE` | `/api/users/[id]` | Delete user (admin only) |

### Rooms

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/rooms` | List rooms by current role |
| `POST` | `/api/rooms` | Create room (mentor only) |
| `POST` | `/api/rooms/join` | Join active room by code |
| `GET` | `/api/rooms/[roomId]` | Get room details |
| `PATCH` | `/api/rooms/[roomId]` | Update room (creator only) |
| `DELETE` | `/api/rooms/[roomId]` | Delete room (admin/creator) |
| `PATCH` | `/api/rooms/[roomId]/close` | Close room (creator only) |

### Moderators

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/rooms/[roomId]/moderators` | Assign moderator |
| `DELETE` | `/api/rooms/[roomId]/moderators/[userId]` | Remove moderator |

### Messages

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/rooms/[roomId]/messages` | Get chat history |
| `POST` | `/api/rooms/[roomId]/messages` | Send chat message |

### Polls

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/rooms/[roomId]/polls` | Get room polls |
| `POST` | `/api/rooms/[roomId]/polls` | Create poll (mentor only) |
| `POST` | `/api/polls/[pollId]/vote` | Vote poll option |
| `PATCH` | `/api/polls/[pollId]/close` | Close poll (mentor/moderator) |

### Announcements

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/rooms/[roomId]/announcements` | Get announcements |
| `POST` | `/api/rooms/[roomId]/announcements` | Send announcement |

### Raise Hand

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/rooms/[roomId]/raise-hand` | Get raise hand list |
| `POST` | `/api/rooms/[roomId]/raise-hand` | Raise hand |
| `PATCH` | `/api/raise-hand/[id]` | Resolve/lower hand |

### Whiteboard

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/rooms/[roomId]/whiteboard` | Get latest whiteboard snapshot |
| `PUT` | `/api/rooms/[roomId]/whiteboard` | Save whiteboard snapshot |

## Testing API with Postman

A Postman collection is included in the root of this project: `StudySpace Postman Collection.json`. Import it into Postman to quickly test all available API endpoints.

Protected routes need the session cookie from the browser after login.

1. Login in the browser
2. Open DevTools > Application > Cookies
3. Copy the NextAuth session cookie
4. Add it to Postman request headers:

```http
Cookie: next-auth.session-token=<value>
```

Then call any protected endpoint, for example:

```http
POST http://localhost:3000/api/rooms
Content-Type: application/json
Cookie: next-auth.session-token=<value>

{
  "title": "Networking Class",
  "description": "TCP/IP discussion",
  "topic": "Computer Networking",
  "whiteboardPermission": "MENTOR_MODERATOR"
}
```

## Project Structure

```text
app/                  Next.js App Router pages and API routes
components/           UI, layout, dashboard, landing, and room components
hooks/                Realtime client hooks
lib/                  Auth, Prisma, socket, permissions, validations, utils
prisma/               Prisma schema and seed file
public/               Static assets
server.ts             Custom Next.js + Socket.IO server
proxy.ts              Auth route protection
```

## License

This project is created for academic coursework and demonstration purposes.
