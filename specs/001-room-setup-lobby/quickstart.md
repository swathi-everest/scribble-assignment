# Quickstart: Scenario 1 — Room Setup & Lobby

## Prerequisites

- Node.js 18+, npm 9+
- Two browser windows or profiles (host + guest)

## Run locally

**Terminal 1 — backend (Express + TypeScript)**

```bash
cd backend && npm install && npm run dev
```

Default: `http://localhost:3001`

**Terminal 2 — frontend (React + Vite + TypeScript)**

```bash
cd frontend && npm install && npm run dev
```

Default: `http://localhost:5173` (Vite). Set `VITE_API_URL` if backend port differs.

## Automated tests (optional)

```bash
cd backend && npm test
cd frontend && npm test
```

## Build gate (constitution)

```bash
cd backend && npm run build
cd frontend && npm run build
```

## Two-browser validation checklist

### 1. Create room (host)

- [ ] Open app → **Create Room** → enter name → submit
- [ ] Land on **Lobby** with visible 4-character room code
- [ ] Participant list shows you with **host** indication
- [ ] Count shows 1 player
- [ ] **Start** disabled or blocked with message about needing 2 players

### 2. Join room (guest)

- [ ] Second browser → **Join Room** → enter same code (try lowercase) → submit
- [ ] Guest lands in same lobby; both names visible
- [ ] Within ~3s, host lobby updates **without** clicking Refresh

### 3. Join validation

- [ ] Empty code on join → inline error, stay on join screen
- [ ] Invalid code `ZZZZ` → clear error, no lobby

### 4. Multi-room isolation

- [ ] Host creates **Room A**; second host creates **Room B** in another tab
- [ ] Guest joins only Room A → Room B lobby unchanged (1 player only)

### 5. Start game (host only)

- [ ] With 2+ players, host clicks **Start** → both see game phase (`playing`)
- [ ] Guest cannot start (button hidden/disabled or API error)
- [ ] Room B still in lobby if only Room A started

### 6. Errors

- [ ] Stop backend briefly → lobby shows recoverable error, app does not white-screen

## Done when

All checklist items pass and both `npm run build` commands succeed.
