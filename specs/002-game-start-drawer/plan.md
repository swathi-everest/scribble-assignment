# Implementation Plan: Scenario 2 — Game Start & Drawer Flow

**Branch**: `003-game-start-drawer` (spec folder `002-game-start-drawer`) | **Date**: 2026-05-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-game-start-drawer/spec.md`  
**User directive**: Brownfield Scenario 2 — extend Express `roomStore` + Zod schemas + React `roomStore`/`GamePage`. Deliver trim + reject empty player names on create/join; on start assign host as drawer; deterministic secret word from `STARTER_WORDS`; word visible only to drawer via server-filtered snapshots. Keep HTTP poll ~2s on `GamePage`.

## Summary

Extend Scenario 1 so **player names** are trimmed and **empty/whitespace-only names rejected** on create and join. When the host **starts** the game, the backend sets **round-one drawer** to the host, picks a **deterministic secret word** from `STARTER_WORDS` based on room code, and returns **viewer-scoped snapshots**: guessers never receive `secretWord`; the drawer does. The React client adds **~2s polling on `GamePage`**, shows **drawer/guesser labels**, and displays the **secret word panel** only for the drawer session.

## Technical Context

**Language/Version**: TypeScript 5.6 (strict) on Node 18+ and modern browsers

**Primary Dependencies**:

| Layer | Stack |
|-------|--------|
| Backend | Express 4, Zod 3, `tsx` dev runner |
| Frontend | React 18, React Router 6, Vite 5 |
| Testing | Vitest 3 (+ jsdom / RTL where present) |

**Storage**: In-memory `Map` in `backend/src/services/roomStore.ts` only

**Testing**: Vitest on `roomStore`, Zod schemas, `api.ts`; manual two-browser validation per [quickstart.md](./quickstart.md)

**Target Platform**: Local dev; lab PR environment

**Project Type**: Brownfield web app (`backend/` + `frontend/`)

**Performance Goals**: Drawer/word/role visible within ~3s of start (SC-003); game poll interval **2000 ms**

**Constraints**: No WebSockets, DB, or auth; Scenario 3 canvas/guesses/scoring deferred; single round only

**Scale/Scope**: Lab-scale in-memory rooms; viewer-filtered GET/start/create/join responses

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Reference: `.specify/memory/constitution.md` (v1.0.0)

| Gate | Status | Notes |
|------|--------|-------|
| Brownfield incremental | ✅ Pass | Extends Scenario 1; no rewrite |
| Server-authoritative | ✅ Pass | Drawer, word, roles in `roomStore`; 2s poll on game |
| Deterministic rules | ✅ Pass | Word from fixed list via room-code hash; host = drawer |
| TypeScript + Zod | ✅ Pass | `trim().min(1)` on `playerName`; typed snapshot fields |
| Scope discipline | ✅ Pass | No canvas/scoring/multi-round |
| Layout preserved | ✅ Pass | Same `api/`, `services/`, `models/`, `state/` paths |
| Multi-room isolation | ✅ Pass | Per-room drawer/word; tests retained |
| Graceful errors | ✅ Pass | 400 on invalid name; no `secretWord` for guessers |

**Post-design re-check**: All gates pass. No Complexity Tracking entries required.

## Project Structure

### Documentation (this feature)

```text
specs/002-game-start-drawer/
├── plan.md              # This file
├── research.md          # Phase 0 decisions
├── data-model.md        # Phase 1 entities & transitions
├── quickstart.md        # Run, test, validate
├── contracts/
│   └── rooms-api.md     # REST contract (Scenario 2 delta)
├── spec.md
└── tasks.md             # Phase 2 — /speckit-tasks
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── rooms.ts              # pass participantId into toRoomSnapshot (already on GET)
│   │   └── schemas.ts            # trimmed required playerName
│   ├── models/game.ts            # Room playing fields, snapshot role + secretWord
│   ├── services/roomStore.ts     # validate name, startGame assigns drawer/word, filter snapshot
│   ├── services/roomStore.test.ts
│   └── seed/starterData.ts       # STARTER_WORDS (unchanged list)

frontend/
├── src/
│   ├── pages/
│   │   ├── CreateRoomPage.tsx    # surface name validation errors
│   │   ├── JoinRoomPage.tsx      # + optional client trim guard
│   │   └── GamePage.tsx          # poll 2s, roles, drawer-only word UI
│   ├── state/roomStore.ts        # fetchRoom passes participantId (already)
│   └── services/
│       ├── api.ts                # RoomSnapshot types: role, secretWord?, drawerParticipantId
│       └── api.test.ts
```

**Structure Decision**: Dual-package monorepo; minimal diff to Scenario 1 files plus `GamePage` gameplay shell.

## Gap Analysis (Scenario 1 → Scenario 2)

| Area | After Scenario 1 | Required for Scenario 2 |
|------|------------------|-------------------------|
| Player name | Optional; default `"Player"` | Trim; reject empty/whitespace; required |
| Start game | `status = playing` only | Set `drawerParticipantId`, `secretWord`, per-participant `role` |
| Snapshot | Same for all viewers | `secretWord` only when `viewer === drawer` |
| Game UI | Placeholder canvas | Role badges; word panel for drawer; guesser placeholder |
| Game sync | No poll on game | Poll `GET /rooms/:code` every 2000 ms while `playing` |
| Word selection | `availableWords` listed | Pick one word deterministically at start |

## Implementation Sequence

### Phase A — Backend model & word selection

1. Extend `Room` in `game.ts`:
   - `drawerParticipantId?: string`
   - `secretWord?: string` (internal; never in unfiltered snapshot)
2. Extend `Participant` snapshot shape: `role?: "drawer" | "guesser"` (set when `status === "playing"`).
3. Extend `RoomSnapshot`: `drawerParticipantId`, optional `secretWord`, participants include `role`.
4. Add `selectSecretWord(code: string): string` — sum `charCodeAt` of uppercase room code, `index = sum % STARTER_WORDS.length` (see [research.md](./research.md#r3--deterministic-secret-word)).
5. Remove `displayName()` `"Player"` fallback for create/join; use `normalizePlayerName(name)` that trims and throws/returns error type if empty.

### Phase B — Backend service (`roomStore.ts`)

1. `createRoom` / `joinRoom`: validate trimmed name; reject empty with service error mapped to HTTP 400.
2. `startGame` on success:
   - `drawerParticipantId = room.hostParticipantId`
   - `secretWord = selectSecretWord(room.code)`
   - `status = "playing"`
3. `toRoomSnapshot(room, viewerParticipantId?)`:
   - Map each participant `role`: drawer if `id === drawerParticipantId`, else guesser (when playing).
   - Include `drawerParticipantId` when playing.
   - Set `secretWord` on snapshot **only if** `viewerParticipantId === drawerParticipantId`.
   - Omit `secretWord` key entirely for guessers (not `null` string).
4. Expand `roomStore.test.ts`: name rejection, host-as-drawer, deterministic word per code, snapshot leak tests.

### Phase C — Backend API & Zod

1. `playerNameSchema = z.string().trim().min(1, "Player name is required")` on create/join (required field).
2. Map service name errors → `HttpError(400, ...)`.
3. Ensure all routes call `toRoomSnapshot(room, participantId)` with viewer id from body/query.
4. Extend `schemas.test.ts` for whitespace-only names.

### Phase D — Frontend types & API

1. Update `RoomSnapshot` / `Participant` in `api.ts`: `role`, `drawerParticipantId`, optional `secretWord`.
2. Ensure `fetchRoom` always passes `participantId` query (already in `roomStore.fetchRoom`).
3. Update `api.test.ts` fixtures for filtered snapshot.

### Phase E — Frontend UI

1. `CreateRoomPage` / `JoinRoomPage`: optional client-side `playerName.trim() === ""` guard; rely on API message for server validation.
2. `GamePage`:
   - `useEffect` poll `roomStore.fetchRoom()` every **2000 ms** while `room.status === "playing"` (mirror `LobbyPage` pattern).
   - Show drawer name/role in header or participant strip.
   - If `viewer.role === "drawer"` and `room.secretWord`, show **Word to draw** card.
   - If guesser, show **Guess the drawing** / no word (never read word from client cache of other sessions).
3. Keep canvas/guess form as placeholders (Scenario 3).

### Phase F — Tests & manual gate

1. `cd backend && npm test` — snapshot filtering, deterministic word, names.
2. `cd frontend && npm test`.
3. [quickstart.md](./quickstart.md) two-browser checklist.
4. `npm run build` both packages.

## Testing Strategy

| Layer | Tool | Focus |
|-------|------|--------|
| `roomStore` | Vitest | Trim names, start assigns drawer/word, snapshot filter |
| Zod | Vitest | `"   "` → 400 |
| `api` client | Vitest | Types + fetch query includes participantId |
| `GamePage` | Vitest + RTL (optional) | Poll interval; drawer sees word mock |
| E2E | Manual | Drawer vs guesser browsers; same room → same word |

**Out of scope**: canvas strokes, guesses, scores, round end (Scenarios 3–4).

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Secret word leaks in JSON | Unit test guesser snapshot has no `secretWord`; manual Network tab check |
| Client infers word from `availableWords` | Acceptable for lab; only one word selected per room; do not send `secretWord` to guessers |
| Stale poll shows wrong role | Server sets roles atomically on start; poll uses viewer-scoped GET |
| Empty name via API bypass | Zod + service double validation |

## Complexity Tracking

> No constitution violations requiring justification.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Artifacts Generated

| Artifact | Path |
|----------|------|
| Research | [research.md](./research.md) |
| Data model | [data-model.md](./data-model.md) |
| API contract | [contracts/rooms-api.md](./contracts/rooms-api.md) |
| Quickstart | [quickstart.md](./quickstart.md) |

## Next Step

Run **`/speckit-tasks`** to produce `tasks.md` with ordered, file-level work items.
