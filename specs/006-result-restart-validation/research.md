# Research: Scenario 4 — Result, Restart & Final Validation

**Date**: 2026-05-29  
**Plan**: [plan.md](./plan.md)

## Stack (lab directive)

| Layer | Decision |
|-------|----------|
| Frontend | **React 18** + **TypeScript** + **Vite 5** — new `ResultPage`, extend `GamePage`/`LobbyPage`, `roomStore`, `api.ts` |
| Backend | **Node.js** + **Express 4** + **TypeScript** + **Zod** — extend `roomStore`, `game.ts`, `rooms.ts` |
| Sync | HTTP polling **2000 ms** on `ResultPage`; mutations via **POST** then poll reflects shared state |
| Tests | **Vitest** in both packages |

**Rationale**: User `/speckit-plan` directive; brownfield extension of Scenario 3.

## R1 — Round-end trigger (`playing` → `result`)

**Decision**: **Host-only “End round”** action via `POST /api/rooms/:code/end-round` while `status === "playing"`.

**Rationale**:

- Spec says “when a round has ended” but does not mandate auto-end on correct guess; Scenario 3 explicitly deferred auto-end.
- Host control matches existing **Start game** pattern and lab README flow (host drives phase transitions).
- Deterministic for two-browser testing: host clicks End round after desired guesses.

**Alternatives considered**:

| Alternative | Rejected because |
|-------------|------------------|
| Auto-end on first correct guess | Out of scope per Scenario 3 plan; changes gameplay without spec requirement |
| Timer-based end | Timers forbidden in constitution / README |
| Any player ends round | Violates host authority pattern from Scenario 1 |

## R2 — Result state semantics

**Decision**:

- Add `RoomStatus` value `"result"`.
- On enter `result`: **freeze** `secretWord`, `guesses`, `scores` (no further mutations).
- **Reveal** `secretWord` to **all** viewers in `toRoomSnapshot` when `status === "result"`.
- Include `guesses` (ordered) and `scores` in result snapshots for every viewer.
- Do **not** expose `canvas` on result snapshots (spec requires word, scores, history only).

**Rationale**: FR-002–FR-004, FR-001; minimizes UI scope; canvas cleared on restart anyway.

**Alternatives considered**: Include final canvas on result screen (optional polish) — deferred to keep result page focused.

## R3 — Restart (`result` → `lobby`)

**Decision**: Host-only `POST /api/rooms/:code/restart` when `status === "result"`.

**Atomic reset** (single service function):

| Clear | Preserve |
|-------|----------|
| `secretWord` | `code` |
| `drawerParticipantId` | `hostParticipantId` |
| `canvasStrokes` | `participants[]` (id, name, joinedAt) |
| `guesses` | |
| `scores` | |
| `status` → `"lobby"` | |

**Rationale**: FR-008–FR-011; SC-004; aligns with “players preserved, round state cleared.”

**Alternatives considered**: Soft-reset keeping scores for “series” play — rejected (multi-round out of scope).

## R4 — Permission and phase guards

**Decision**:

| Action | Valid phase | Who |
|--------|-------------|-----|
| `endRound` | `playing` | Host |
| `restartRoom` | `result` | Host |
| `startGame` | `lobby` only | Host |
| canvas/guess POST | `playing` | Scenario 3 rules |

Error mapping:

- Not host → **403** with clear message (e.g. `Only the host can end the round`).
- Wrong phase → **400** (e.g. `Game is not in progress` / `Room is not in result state`).
- Unknown room → **404**.

**Rationale**: FR-005–FR-007; constitution backend-enforced permissions.

## R5 — Frontend routing and polling

**Decision**:

| Route | When | Poll |
|-------|------|------|
| `/lobby` | `status === "lobby"` | 2s (existing) |
| `/game` | `status === "playing"` | 2s (existing) |
| `/result` | `status === "result"` | 2s (new) |

- `GamePage`: host **End round** button; on poll detecting `result`, navigate to `/result`.
- `LobbyPage`: if poll returns `result`, navigate to `/result` (reconnect path).
- `ResultPage`: all players see word/scores/history; host **Restart** → API → navigate `/lobby`.
- Non-host: no restart button; poll only.

**Rationale**: SC-001, SC-002; separates result UX from active play; matches React Router patterns in starter.

**Alternatives considered**: Single `GamePage` with conditional sections — rejected to avoid entangled playing/result logic.

## R6 — Idempotency and edge cases

**Decision**:

- Second `endRound` while already `result` → **400** `Room is not in progress` (no-op mutation).
- Second `restart` while already `lobby` → **400** `Room is not in result state`.
- Empty guess history in result → UI shows explicit empty state (reuse `ResultPanel` placeholder).
- Reconnect during `result` → `GET` snapshot with `participantId` returns same revealed word/scores/guesses (SC-001).

**Rationale**: Spec edge cases; prevents duplicate transitions corrupting state.

## R7 — `startGame` interaction after restart

**Decision**: After restart, room is `lobby`; host may **Start game** again (new round with fresh word/scores per Scenario 2–3 rules). No drawer rotation — host remains default drawer per Scenario 2.

**Rationale**: Assumption in spec (“prepares room for a future round”); no multi-round rotation in scope.
