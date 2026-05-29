# Implementation Plan: Scenario 4 — Result, Restart & Final Validation

**Branch**: `006-result-restart-validation` | **Date**: 2026-05-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/006-result-restart-validation/spec.md`  
**User directive**: Brownfield Scenario 4 — extend Express `roomStore` + Zod schemas + React `roomStore`/`GamePage` on top of Scenarios 1–3. Add room status `"result"` and host-only `playing` → `result` (host **End round**). In result, expose revealed `secretWord`, final `scores`, and ordered `guesses` to **all** players via snapshots (~2s poll on result UI). Host-only restart: `result` → `lobby`, preserve roster, clear round-scoped state. Reject restart from non-host or non-result phases. Preserve Scenarios 1–3 behavior.

## Summary

Close the single-round lifecycle: the **host** ends an active round with **End round** (`playing` → `result`). In **result**, the server reveals the **secret word to every viewer**, freezes **scores** and **guess history**, and clients poll on a dedicated **Result** page. The **host** then **restarts** (`result` → `lobby`), preserving **participant ids/names/host** while clearing **drawer**, **secretWord**, **canvas**, **guesses**, and **scores**. Non-host restart and restart outside `result` are rejected without mutation. Scenario 3 gameplay APIs remain blocked when not `playing`.

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

**Performance Goals**: Result snapshot consistent for all players (SC-001); restart visible in lobby within ~3s (SC-002); poll **2000 ms** on result page

**Constraints**: No WebSockets, DB, or auth; no multi-round rotation, timers, auto-start next round, or auto-end on correct guess

**Scale/Scope**: Lab-scale rooms; one round per start cycle; result is read-only until restart

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Reference: `.specify/memory/constitution.md` (v1.0.0)

| Gate | Status | Notes |
|------|--------|-------|
| Brownfield incremental | ✅ Pass | Extends Scenario 3; no rewrite |
| Server-authoritative | ✅ Pass | End round + restart in `roomStore`; 2s poll on result |
| Deterministic rules | ✅ Pass | Frozen result data; host-only transitions; word revealed only in `result` |
| TypeScript + Zod | ✅ Pass | Zod on `endRound` / `restart` bodies |
| Scope discipline | ✅ Pass | No multi-round, timers, WebSockets |
| Layout preserved | ✅ Pass | Same `api/`, `services/`, `models/`, `state/`, `pages/` paths |
| Multi-room isolation | ✅ Pass | Per-room status and round data |
| Graceful errors | ✅ Pass | 403/400 on invalid phase or role |

**Post-design re-check**: All gates pass. Secret word is drawer-only during `playing`; all viewers receive `secretWord` only when `status === "result"`. No Complexity Tracking entries required.

## Project Structure

### Documentation (this feature)

```text
specs/006-result-restart-validation/
├── plan.md              # This file
├── research.md          # Phase 0 decisions
├── data-model.md        # Phase 1 entities & transitions
├── quickstart.md        # Run, test, validate
├── contracts/
│   └── rooms-api.md     # REST contract (Scenario 4 delta)
├── spec.md
└── tasks.md             # Phase 2 — /speckit-tasks
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── rooms.ts              # POST end-round, restart routes
│   │   └── schemas.ts            # endRoundSchema, restartSchema
│   ├── models/game.ts            # RoomStatus += "result"
│   ├── services/roomStore.ts     # endRound, restartRoom, snapshot result branch
│   └── services/roomStore.test.ts

frontend/
├── src/
│   ├── pages/
│   │   ├── GamePage.tsx          # host "End round"; redirect on result poll
│   │   ├── ResultPage.tsx        # NEW: word + scores + history; host restart; 2s poll
│   │   └── LobbyPage.tsx         # redirect result → /result; playing → /game
│   ├── components/
│   │   ├── RoundResultSummary.tsx  # NEW (optional): revealed word + final scores
│   │   └── ResultPanel.tsx         # reuse for guess history on result page
│   ├── state/roomStore.ts        # endRound, restartRoom
│   ├── services/api.ts             # types + API methods
│   └── routes/index.tsx            # /result route
```

**Structure Decision**: Add `ResultPage` rather than overloading `GamePage` for result UI; keeps playing vs result concerns separate and matches route-based navigation used elsewhere.

## Gap Analysis (Scenario 3 → Scenario 4)

| Area | After Scenario 3 | Required for Scenario 4 |
|------|------------------|-------------------------|
| `RoomStatus` | `lobby` \| `playing` | Add `result` |
| Round end | None (round runs indefinitely) | Host `POST end-round` → `result` |
| `secretWord` visibility | Drawer-only while `playing` | All viewers while `result` |
| Result UI | N/A | `ResultPage` + 2s poll |
| Restart | N/A | Host `POST restart` → `lobby`, clear round fields |
| `startGame` | Blocks if `playing` | Also block if `result` |
| Canvas/guess APIs | Require `playing` | Unchanged (blocked in `result`) |
| Navigation | `playing` → `/game` | `result` → `/result`; restart → `/lobby` |

## Implementation Sequence

### Phase A — Backend model (`game.ts`)

1. `RoomStatus = "lobby" | "playing" | "result"`.
2. Document snapshot rules: `secretWord` in snapshot when `result` for **all** viewers; when `playing`, drawer-only (unchanged).

### Phase B — Backend service (`roomStore.ts`)

1. **`endRound(code, participantId)`**:
   - Require room exists; `status === "playing"`; caller is host.
   - Set `status = "result"`; do **not** mutate `guesses`, `scores`, `secretWord`, or canvas (freeze).
   - Return typed failure: `NOT_FOUND`, `NOT_HOST`, `NOT_PLAYING`.
2. **`restartRoom(code, participantId)`**:
   - Require `status === "result"`; caller is host.
   - Set `status = "lobby"`.
   - Delete/clear: `drawerParticipantId`, `secretWord`, `canvasStrokes`, `guesses`, `scores`.
   - Preserve: `code`, `hostParticipantId`, `participants` (ids, names, `joinedAt`).
   - Return typed failure: `NOT_FOUND`, `NOT_HOST`, `NOT_IN_RESULT`.
3. **`startGame`**: treat `status === "result"` like `playing` → `ALREADY_PLAYING` (or dedicated `NOT_IN_LOBBY`).
4. **`toRoomSnapshot`**:
   - When `result`: include `secretWord`, `guesses`, `scores` for **all** viewers; omit `canvas` (not required by spec); omit drawer `role` or keep drawer id for display-only if useful.
   - When `playing`: unchanged Scenario 3 behavior.
   - When `lobby`: unchanged; no round fields.
5. **`roomStore.test.ts`**: end round permissions; result snapshot word for guesser; restart clears fields; roster preserved; double restart idempotent or second call rejected.

### Phase C — Backend API & Zod

1. `POST /:code/end-round` — body `{ participantId }`.
2. `POST /:code/restart` — body `{ participantId }`.
3. Map errors: `403` not host; `400` wrong phase; `404` room.
4. `schemas.test.ts` for participantId presence.

### Phase D — Frontend API & store

1. Extend `RoomSnapshot.status` with `"result"`.
2. `api.endRound`, `api.restartRoom`.
3. `roomStore.endRound`, `roomStore.restartRoom`.
4. Update tests/fixtures.

### Phase E — Frontend UI & routing

1. **`GamePage`**: host-only **End round** button → `endRound()` then navigate `/result` (or rely on poll).
2. **`ResultPage`**: show revealed word, `Scoreboard`, `ResultPanel` (full history); host **Restart** → `restartRoom()` → `/lobby`; `RESULT_POLL_MS = 2000`.
3. **`LobbyPage`**: if `status === "result"`, navigate `/result`; keep `playing` → `/game`.
4. **`routes/index.tsx`**: add `/result`.
5. Disable canvas/guess actions when not on game page (already isolated by route).

### Phase F — Tests & manual gate

1. `cd backend && npm test`
2. `cd frontend && npm test`
3. [quickstart.md](./quickstart.md) two-browser checklist (full lab Scenario 4)
4. `npm run build` both packages

## Testing Strategy

| Layer | Tool | Focus |
|-------|------|--------|
| `roomStore` | Vitest | Host end round; guesser sees word in result; restart clears; non-host denied |
| Zod | Vitest | Body schemas |
| `api` client | Vitest | New methods + `result` status |
| E2E | Manual | Two browsers: play → end → verify result parity → restart → clean lobby |

**Out of scope**: multi-round rotation, timers, auto-end on correct guess, spectator mode.

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Guesser still sees word after restart | Clear `secretWord` in `restartRoom`; lobby snapshot omits it |
| Stale `/game` after end round | Poll + redirect to `/result` on `status === "result"` |
| Double restart | Second `restart` returns `NOT_IN_RESULT` without corrupting roster |
| Host leaves before restart | Other players stay on result until host reconnects or manual test uses same host session |
| `Exit Game` from game bypasses result | Document as dev escape only; lab flow uses End round |

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
