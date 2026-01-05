# SquiggleSync

**SquiggleSync** is a real-time collaborative whiteboard built to demonstrate **concurrency handling**, **state synchronization**, and **event-driven architecture** using **Angular**, **WebSockets**, and **Redis**.

Think Google Docs-style collaboration — but for doodles

---

## Why This Project Exists

This project was built as a **learning and upskilling exercise** to prove understanding of:

- Real-time communication using WebSockets
- Concurrent updates from multiple clients
- Distributed state synchronization
- Event ordering and conflict handling
- Scalable, stateless backend design
- Reactive frontend patterns with Angular & RxJS

It is intentionally designed like a **production system**, not a toy demo.

---

## Core Concepts Demonstrated

- **Event-based synchronization** (instead of syncing full canvas state)
- **Optimistic UI updates** on the client
- **Server-authoritative ordering** of events
- **Redis Pub/Sub** for horizontal scalability
- **Room-based collaboration** (multiple whiteboards)

---

## High-Level Architecture

```
┌──────────┐        WebSocket        ┌────────────┐
│  Angular │  ───────────────────▶  │ WS Server  │
│ Frontend │                         │ (Node.js) │
└──────────┘                         └─────┬──────┘
▲                                     │
│           Redis Pub/Sub             │
└──────────────◀─────────────────────┘
```

### Responsibilities

#### Frontend (Angular)
- Renders the canvas
- Captures user input (draw, erase, move)
- Sends drawing events via WebSocket
- Applies incoming events in real time

#### Backend (WebSocket Server)
- Manages active connections
- Validates and orders events
- Broadcasts events to room participants
- Publishes events to Redis

#### Redis
- Shared event stream across servers
- Pub/Sub fanout
- Optional state snapshots & presence data

---

## State Synchronization Strategy

Instead of syncing the entire canvas, SquiggleSync uses an **event-based model**.

Example event:

```json
{
  "type": "DRAW_LINE",
  "userId": "user-123",
  "points": [[10, 10], [20, 20]],
  "color": "#000000",
  "timestamp": 1700000000
}
```

**Why event-based?**
- Lower bandwidth usage
- Replayable history
- Easier conflict resolution
- Scales better for real-time collaboration

This approach resembles lightweight event sourcing.

---

## Concurrency Handling

Concurrency is handled explicitly using:
- Server-side event ordering
- Timestamps / sequence numbers
- Last-write-wins strategy for simple tools
- Room-level isolation

Multiple users can draw at the same time without corrupting shared state.

---

## Repository Structure (Monorepo)

```
squigglesync/
├── frontend/        # Angular application
│   └── package.json
│
├── backend/         # WebSocket server
│   └── package.json
│
└── README.md
```

- Single Git repository (monorepo)
- Frontend and backend are independently deployable
- Clear separation of concerns

---

## Tech Stack

**Frontend**
- Angular
- RxJS
- HTML Canvas API
- WebSocket client

**Backend**
- Node.js
- WebSockets (Socket.IO or ws)
- Redis Pub/Sub

**Infrastructure**
- Redis (Railway / Upstash / Redis Cloud)
- Vercel (Frontend hosting)
- Railway / Fly.io / Render (Backend hosting)

---

## Deployment

**Frontend**
- Hosted as static files on Vercel / Netlify / Cloudflare Pages

**Backend**
- Hosted on Railway / Fly.io / Render
- Connects to managed Redis instance

**Deployment Flow**
1. Push code to GitHub
2. Deploy frontend from `/frontend`
3. Deploy backend from `/backend`
4. Configure Redis connection
5. Update WebSocket URL in Angular environment

---

## Optional Enhancements

- Live cursor tracking
- User presence indicators
- Undo / redo
- Read-only spectator mode
- Whiteboard history replay
- Authentication

---

## Resume Description

**SquiggleSync** – Real-time collaborative whiteboard built using Angular, WebSockets, and Redis to demonstrate concurrent state synchronization, event-driven architecture, and scalable real-time systems.

---

## Author

Built as a side project to deepen understanding of real-time systems, distributed state, and modern frontend architecture.

---

## License

MIT

