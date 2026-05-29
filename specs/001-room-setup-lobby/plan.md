# Implementation Plan: Scenario 1 — Room Setup & Lobby

**Branch**: `001-room-setup-lobby` | **Date**: 2026-05-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-room-setup-lobby/spec.md`  
**User directive**: **Frontend** — React + Vite + TypeScript. **Backend** — Node.js + Express + TypeScript (+ Zod validation).

## Summary

Deliver brownfield enhancements so players can **create** and **join** isolated rooms by code, see a **live lobby** (HTTP poll ~2s), and let the **host start** only when **≥2** players are present. The Express backend `roomStore` remains authoritative: add `hostParticipantId`, `status: "lobby" | "playing"`, and `POST /rooms/:code/start`. The React/Vite client updates `roomStore`, `LobbyPage`, and `JoinRoomPage`—no new state libraries. Existing **Vitest** suites in both packages cover service logic, schemas, API client, and optional React page tests.

## Technical Context

**Language/Version**: TypeScript 5.6 (strict) on Node 18+ and modern browsers

**Primary Dependencies**:

| Layer | Stack |
|-------|--------|
| Backend | Express 4, Zod 3, `tsx` dev runner |
| Frontend | React 18, React Router 6, Vite 5 |
| Testing | Vitest 3 (+ jsdom frontend; add `@testing-library/react` for page tests) |

**Storage**: In-memory `Map` in `backend/src/services/roomStore.ts` only

**Testing**: Vitest unit/integration tests in `backend/src/**/*.test.ts` and `frontend/src/**/*.test.ts`; manual two-browser validation per quickstart.md

**Target Platform**: Local dev (macOS/Linux/Windows); lab PR environment

**Project Type**: Brownfield web app (`backend/` + `frontend/`)

**Performance Goals**: Lobby snapshot visible to other clients within ~3s of join (SC-003); poll interval 2000 ms

**Constraints**: No WebSockets, DB, or auth (constitution); extend existing folders only; Scenario 2+ gameplay not implemented here

**Scale/Scope**: Single-process in-memory rooms; lab-scale concurrent rooms (tens, not thousands)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Reference: `.specify/memory/constitution.md` (v1.0.0)

| Gate | Status | Notes |
|------|--------|-------|
| Brownfield incremental | ✅ Pass | Extends starter; Scenario 1 only |
| Server-authoritative | ✅ Pass | `roomStore` + new start endpoint; 2s HTTP poll |
| Deterministic rules | ✅ Pass (partial) | Scoring/word/drawer deferred; host/start rules backend-enforced |
| TypeScript + Zod | ✅ Pass | Extend schemas; trim/reject empty room code |
| Scope discipline | ✅ Pass | No DB/auth/WS; no multi-round/timer features |
| Layout preserved | ✅ Pass | `api/`, `services/`, `models/`, `state/roomStore.ts` |
| Multi-room isolation | ✅ Pass | Map keyed by code; tests for two rooms |
| Graceful errors | ✅ Pass | HttpError + frontend error state (existing pattern) |

**Post-design re-check**: All gates pass. No Complexity Tracking entries required.

## Project Structure

### Documentation (this feature)

```text
specs/001-room-setup-lobby/
├── plan.md              # This file
├── research.md          # Phase 0 decisions
├── data-model.md        # Phase 1 entities & transitions
├── quickstart.md        # Run, test, validate
├── contracts/
│   └── rooms-api.md     # REST contract
├── spec.md
└── tasks.md             # Phase 2 — /speckit-tasks ✅
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── rooms.ts          # + POST /:code/start
│   │   ├── schemas.ts        # trim code, startGameSchema
│   │   └── router.ts
│   ├── models/game.ts        # hostParticipantId, status playing
│   ├── services/roomStore.ts # host, startGame, snapshot isHost
│   └── services/roomStore.test.ts
└── package.json                # vitest

frontend/
├── src/
│   ├── pages/
│   │   ├── LobbyPage.tsx     # poll 2s, host start UX
│   │   └── JoinRoomPage.tsx  # empty code validation
│   ├── state/roomStore.ts    # startGame, fetchRoom used by poll
│   └── services/
│       ├── api.ts            # startRoom()
│       └── api.test.ts
└── package.json                # vitest (+ @testing-library/react devDep)
```

**Structure Decision**: Dual-package monorepo per starter; all Scenario 1 changes stay in listed files unless tests require `frontend/src/pages/LobbyPage.test.tsx`.

## Gap Analysis (starter → spec)

| Area | Current starter | Required for Scenario 1 |
|------|-----------------|-------------------------|
| Host | Not tracked | `hostParticipantId` on create |
| Start game | Client navigates to `/game` | `POST .../start`; backend phase `playing` |
| Lobby sync | Manual Refresh button | Auto poll every 2000 ms on lobby |
| Join validation | API 404 only | + empty/whitespace code (client + Zod) |
| Host UI | No host badge | Show host in participant list |
| Start permissions | Any client | Host-only; ≥2 players |

## Implementation Sequence

### Phase A — Backend model & service

1. Extend `Room` / `RoomSnapshot` in `game.ts` (`hostParticipantId`, `status: "lobby" | "playing"`).
2. `createRoom`: set `hostParticipantId` to creator id.
3. `toRoomSnapshot`: include `hostParticipantId`; map `isHost` on participants.
4. Add `startGame(code, participantId)` with host + min-players checks; return typed errors for API layer.
5. Expand `roomStore.test.ts` (host, start guards, isolation, case-insensitive join).

### Phase B — Backend API

1. Zod: `normalizedRoomCodeSchema` (trim, min length 1); `startGameSchema`.
2. `POST /rooms/:code/start` in `rooms.ts` → 403/400/404 per [contracts/rooms-api.md](./contracts/rooms-api.md).
3. Extend `schemas.test.ts` for empty code paths.

### Phase C — Frontend API & state

1. Update `api.ts` types + `startGame(code, participantId)`.
2. `roomStore.startGame()` with loading/error handling.
3. `api.test.ts` for start request shape.

### Phase D — Frontend UI (React)

1. `JoinRoomPage`: block submit if `roomCode.trim() === ""` with inline error.
2. `LobbyPage`:
   - `useEffect` poll `fetchRoom` every 2000 ms while `room?.status === "lobby"`; cleanup on unmount.
   - Show host label on participant row (`isHost` or compare `hostParticipantId`).
   - Start button: visible to host only; `disabled` when `participants.length < 2`; helper text.
   - On start success: update snapshot; navigate to `/game` when `status === "playing"`.
3. Non-host: hide or disable Start (defense in depth with backend 403).

### Phase E — Vitest (React + TS)

1. **Backend**: run `npm test` — cover new `startGame`, host on create, join empty code via schema.
2. **Frontend**: add devDependencies `@testing-library/react` `@testing-library/jest-dom` `@testing-library/user-event` if not present.
3. Add `LobbyPage.test.tsx`: host sees disabled start with 1 player; polling calls `fetchRoom` (fake timers).
4. Add `JoinRoomPage.test.tsx`: empty code shows error without calling API.
5. Keep tests colocated (`*.test.ts(x)` next to source) per starter convention.

### Phase F — Manual & build gate

1. Follow [quickstart.md](./quickstart.md) two-browser checklist.
2. `npm run build` in both packages.

## Testing Strategy

| Layer | Tool | Focus |
|-------|------|--------|
| `roomStore` | Vitest | Host, join, start authorization, isolation, status transition |
| Zod schemas | Vitest | Trim/empty code, start body |
| `api` client | Vitest | Mock `fetch` for create/join/fetch/start |
| React pages | Vitest + RTL | Lobby poll/start UX; join validation |
| E2E | Manual | Two browsers per constitution |

**Out of test scope for Scenario 1**: drawer, secret word, canvas, scoring (Scenario 2–3).

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Poll timer leaks | Clear interval in `useEffect` cleanup |
| Double start | Backend idempotent check: reject start if already `playing` |
| Stale client navigates to game | Gate `/game` route on `room.status === "playing"` (light guard in `GamePage` or router) |
| Debug `console.log` in roomStore | Remove stray log during implementation |

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
