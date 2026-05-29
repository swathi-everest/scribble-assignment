# Research: Scenario 3 — Gameplay Interaction

**Date**: 2026-05-29  
**Plan**: [plan.md](./plan.md)

## Stack (lab directive)

| Layer | Decision |
|-------|----------|
| Frontend | **React 18** + **TypeScript** + **Vite 5** — `DrawingCanvas`, wire `GuessForm`/`Scoreboard`/`ResultPanel`, `GamePage` |
| Backend | **Node.js** + **Express 4** + **TypeScript** + **Zod** — extend `roomStore`, `game.ts`, `rooms.ts` |
| Sync | HTTP polling **2000 ms** on `GamePage` (unchanged); mutation via **POST** then poll reflects shared state |
| Tests | **Vitest** in both packages |

**Rationale**: User `/speckit-plan` directive; brownfield extension of Scenario 2.

## R1 — Canvas data model

**Decision**: Store an ordered array of **strokes** on the room:

```ts
interface CanvasStroke {
  points: [number, number][]; // normalized 0–1 or pixel coords (pick one, document in contract)
  color: string;
  lineWidth: number;
}
```

Room field: `canvasStrokes: CanvasStroke[]`. Snapshot exposes `canvas: { strokes: CanvasStroke[] }` to **all** participants when `status === "playing"`.

**Rationale**: FR-003, FR-005; sufficient to replay on HTML canvas; append-only matches drawer drawing UX; clear = reset array.

**Alternatives considered**: Base64 PNG snapshot (rejected — heavy, not stroke-editable); WebSocket stroke stream (forbidden); client-only canvas (rejected — violates server-authoritative).

## R2 — Canvas mutation API

**Decision**:

| Endpoint | Who | Action |
|----------|-----|--------|
| `POST /api/rooms/:code/canvas/strokes` | Drawer only | Append one stroke |
| `POST /api/rooms/:code/canvas/clear` | Drawer only | Set `canvasStrokes = []` |

Body always includes `participantId` for permission checks (same pattern as start).

**Rationale**: FR-001, FR-002, FR-015; explicit mutations easier to test than full-canvas PUT from client.

**Alternatives considered**: Single `PATCH /canvas` with full state (acceptable but larger payloads and race-prone); embedding strokes in GET only (rejected — no mutation path).

## R3 — Drawer local feedback vs poll sync

**Decision**:

- Drawer maintains **local stroke list** for immediate render on pointer up.
- On stroke complete, **POST** stroke to server (fire-and-forget or await).
- On poll, **replace** local canvas from `room.canvas.strokes` (server wins). If flicker appears, tasks may add shallow merge by stroke count — not required for lab MVP.
- Guessers **only** render from polled `room.canvas.strokes` (no POST).

**Rationale**: FR-004, FR-005, SC-001, SC-002.

**Alternatives considered**: Poll-only for drawer (rejected — fails SC-001 immediate feedback).

## R4 — Guess submission and validation

**Decision**:

- `POST /api/rooms/:code/guesses` with `{ participantId, guessText: string }`.
- **Zod**: `guessText: z.string().trim().min(1, "Guess cannot be empty")`.
- **Service**: reject if `participantId === drawerParticipantId` (403); trim before compare; `isCorrect = trimmed.toLowerCase() === secretWord.toLowerCase()`.
- Internal spaces preserved after outer trim (spec edge case).

**Rationale**: FR-007–FR-010, FR-015; constitution deterministic scoring rules.

**Alternatives considered**: Client-only trim (rejected); reveal word on wrong guess (rejected — spec US2.5).

## R5 — Scores and guess history

**Decision**:

- On `startGame`: `scores = Object.fromEntries(participants.map(p => [p.id, 0]))`, `guesses = []`, `canvasStrokes = []`.
- On accepted guess: append `GuessRecord`; if correct, `scores[participantId] += 100` (no cap; multiple correct guesses allowed per spec).
- Snapshot includes full `guesses` array and `scores` record for **all** viewers (not viewer-filtered).

**Rationale**: FR-006, FR-011–FR-013; US3.

**Alternatives considered**: Hide guess text from drawer (rejected — spec says all participants see same history).

## R6 — Snapshot fields (playing)

**Decision**: Extend `toRoomSnapshot` when `playing`:

| Field | Visibility |
|-------|------------|
| `canvas` | All |
| `guesses` | All |
| `scores` | All |
| `secretWord` | Drawer only (unchanged Scenario 2) |

**Rationale**: FR-013; guessers need canvas without word.

## R7 — Frontend components

**Decision**:

- New `DrawingCanvas.tsx` using `<canvas>` + 2D context; normalized coordinates relative to canvas size for resolution independence.
- Wire existing `GuessForm`, `Scoreboard`, `ResultPanel` to `useRoomState()`.
- `roomStore` methods: `submitGuess(text)`, `appendStroke(stroke)`, `clearCanvas()`.

**Rationale**: Minimal new surface; placeholders already in layout.

## R8 — Coordinate system

**Decision**: Store stroke points as **fractions of canvas width/height** in `[0, 1]` (clamp on server Zod). Render by multiplying by current canvas client size.

**Rationale**: Consistent replay when layout/CSS changes between drawer and guesser browsers.

**Alternatives considered**: Raw pixel coords (rejected — breaks across different canvas sizes).

## R9 — Testing approach

**Decision**:

| Area | Tests |
|------|--------|
| `appendStroke` / `clearCanvas` | Drawer ok; guesser 403; not playing 400 |
| `submitGuess` | Trim, case, empty 400, drawer 403, +100 score |
| `startGame` | All scores 0 |
| Snapshot | Guesser has canvas/guesses/scores, no `secretWord` |
| Zod | Whitespace guess |

Manual: [quickstart.md](./quickstart.md).

## R10 — Out of scope confirmation

**Decision**: No result status, no host restart, no auto-end round on correct guess, no drawer rotation — deferred to Scenario 4.

**Rationale**: Spec "Out of Scope" section; plan scope discipline.
