# Implementation Plan: Scenario 3 — Gameplay Interaction

**Branch**: `004-gameplay-interaction` (spec folder `003-gameplay-interaction`) | **Date**: 2026-05-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-gameplay-interaction/spec.md`  
**User directive**: Brownfield Scenario 3 — extend Express `roomStore` + Zod schemas + React `roomStore`/`GamePage` on top of Scenarios 1–2. Canvas (drawer-only draw/clear, persist per room, local drawer feedback + ~2s poll sync). Guesses (guesser-only, trim, case-insensitive compare, empty rejected). Scores (0 at round start, +100 correct) and ordered guess history via viewer-filtered snapshots. Preserve Scenario 1–2 isolation, host start, drawer-only `secretWord`, trimmed names. Defer Scenario 4 round-end/restart.

## Summary

Extend the playing state so the **drawer** can **append strokes** and **clear** a server-persisted canvas; **guessers** see the canvas via existing **2s `GamePage` polling**. **Guessers** submit text guesses through a new API; the backend **trims**, rejects **empty** input, compares **case-insensitively** to `secretWord`, awards **100 / 0** points, and appends to **guess history**. **`startGame`** initializes **scores to 0** for every participant. Snapshots expose `canvas`, `scores`, and `guesses` to **all** viewers; `secretWord` remains **drawer-only**. Frontend replaces canvas/guess/scoreboard placeholders with wired components and permission-aware UX.

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

**Performance Goals**: Canvas and guess history visible to all participants within ~3s (SC-002, SC-005); game poll **2000 ms**

**Constraints**: No WebSockets, DB, or auth; no round-end/result phase (Scenario 4); single round; no auto-end on correct guess

**Scale/Scope**: Lab-scale rooms; stroke list + guess array per playing room

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Reference: `.specify/memory/constitution.md` (v1.0.0)

| Gate | Status | Notes |
|------|--------|-------|
| Brownfield incremental | ✅ Pass | Extends Scenario 2; no rewrite |
| Server-authoritative | ✅ Pass | Canvas, guesses, scores in `roomStore`; 2s poll on game |
| Deterministic rules | ✅ Pass | 100/0 scoring; trim + case-insensitive compare; drawer/guesser permissions on server |
| TypeScript + Zod | ✅ Pass | Zod on new endpoints; typed stroke/guess models |
| Scope discipline | ✅ Pass | No result phase, multi-round, timers, WebSockets |
| Layout preserved | ✅ Pass | Same `api/`, `services/`, `models/`, `state/`, `pages/` paths |
| Multi-room isolation | ✅ Pass | Per-room canvas/guesses/scores |
| Graceful errors | ✅ Pass | 400/403 on invalid guess or wrong role; UI surfaces `message` |

**Post-design re-check**: All gates pass. No Complexity Tracking entries required.

## Project Structure

### Documentation (this feature)

```text
specs/003-gameplay-interaction/
├── plan.md              # This file
├── research.md          # Phase 0 decisions
├── data-model.md        # Phase 1 entities & transitions
├── quickstart.md        # Run, test, validate
├── contracts/
│   └── rooms-api.md     # REST contract (Scenario 3 delta)
├── spec.md
└── tasks.md             # Phase 2 — /speckit-tasks
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── rooms.ts              # POST strokes, clear, guess routes
│   │   └── schemas.ts            # stroke + guess Zod schemas
│   ├── models/game.ts            # CanvasStroke, Guess, scores on Room
│   ├── services/roomStore.ts     # appendStroke, clearCanvas, submitGuess, snapshot fields
│   └── services/roomStore.test.ts

frontend/
├── src/
│   ├── components/
│   │   ├── DrawingCanvas.tsx     # drawer: draw + clear + optimistic local strokes
│   │   ├── GuessForm.tsx         # guesser: submit + error display
│   │   ├── Scoreboard.tsx        # scores from room snapshot
│   │   └── ResultPanel.tsx       # guess history from snapshot
│   ├── pages/GamePage.tsx        # wire canvas; keep 2s poll
│   ├── state/roomStore.ts        # submitGuess, appendStroke, clearCanvas helpers
│   └── services/api.ts           # new API methods + snapshot types
```

**Structure Decision**: Dual-package monorepo; add `DrawingCanvas` component; extend existing game shell components rather than new state library.

## Gap Analysis (Scenario 2 → Scenario 3)

| Area | After Scenario 2 | Required for Scenario 3 |
|------|------------------|-------------------------|
| Canvas | Placeholder div | Persisted `strokes[]`; drawer append/clear APIs; render on poll |
| Guesses | `GuessForm` no-op | `POST` guess; trim/validate; history entry |
| Scores | Placeholder 0 | `scores` map init on start; +100 on correct |
| Guess history | Placeholder text | Ordered `guesses[]` in snapshot |
| `startGame` | Drawer + word only | Reset/init `canvas`, `guesses`, `scores` |
| Snapshot | Roles + optional `secretWord` | + `canvas`, `scores`, `guesses` (all viewers) |
| Permissions | Drawer word filter | Drawer-only canvas mutations; guesser-only guesses |

## Implementation Sequence

### Phase A — Backend model (`game.ts`)

1. Add `CanvasStroke`: `{ points: [number, number][]; color: string; lineWidth: number }`.
2. Add `GuessRecord`: `{ id, participantId, participantName, text, isCorrect, submittedAt }`.
3. Extend `Room`: `canvasStrokes: CanvasStroke[]`, `guesses: GuessRecord[]`, `scores: Record<string, number>`.
4. Extend `RoomSnapshot`: `canvas: { strokes: CanvasStroke[] }`, `guesses`, `scores` (when `playing`).

### Phase B — Backend service (`roomStore.ts`)

1. **`startGame`**: after setting playing/drawer/word, set `canvasStrokes = []`, `guesses = []`, `scores[id] = 0` for each participant.
2. **`appendStroke(code, participantId, stroke)`**: require `playing`; require `participantId === drawerParticipantId`; push stroke; bump `updatedAt`.
3. **`clearCanvas(code, participantId)`**: same guards; `canvasStrokes = []`.
4. **`submitGuess(code, participantId, rawText)`**:
   - Require `playing`; reject if drawer.
   - Trim; if empty → `InvalidGuessError`.
   - Compare `trimmed.toLowerCase()` to `secretWord.toLowerCase()`.
   - Append guess record; if correct, `scores[participantId] += 100`.
5. **`toRoomSnapshot`**: when playing, include `canvas`, `guesses`, `scores` for **all** viewers; keep `secretWord` drawer-only.
6. Expand `roomStore.test.ts`: permissions, trim/case, scoring, isolation, canvas clear preserves history.

### Phase C — Backend API & Zod

1. `POST /:code/canvas/strokes` — body `{ participantId, stroke }`; Zod validate points array.
2. `POST /:code/canvas/clear` — body `{ participantId }`.
3. `POST /:code/guesses` — body `{ participantId, guessText }`; Zod trim + min 1 after trim.
4. Map service errors: `403` wrong role, `400` empty guess / not playing, `404` room.
5. `schemas.test.ts` for guess whitespace and stroke shape.

### Phase D — Frontend API & store

1. Extend `RoomSnapshot` in `api.ts` with `canvas`, `guesses`, `scores`.
2. Add `api.appendStroke`, `api.clearCanvas`, `api.submitGuess`.
3. `roomStore`: thin wrappers calling API then optional `fetchRoom()` (or rely on poll).
4. Update `api.test.ts` fixtures.

### Phase E — Frontend UI

1. **`DrawingCanvas`**: HTML canvas; pointer events when `isDrawer`; optimistic local stroke list; on stroke end POST to server; **Clear** button POST clear then reset local; guessers render read-only from `room.canvas.strokes` (no pointer handlers).
2. **`GuessForm`**: call `roomStore.submitGuess`; show API error; disable when not guesser.
3. **`Scoreboard`**: map `room.scores` + participants to rows.
4. **`ResultPanel`**: list `room.guesses` (name, trimmed text, correct/incorrect).
5. **`GamePage`**: replace placeholder with `DrawingCanvas`; keep `GAME_POLL_MS = 2000`.

### Phase F — Tests & manual gate

1. `cd backend && npm test`
2. `cd frontend && npm test`
3. [quickstart.md](./quickstart.md) two-browser checklist
4. `npm run build` both packages

## Testing Strategy

| Layer | Tool | Focus |
|-------|------|--------|
| `roomStore` | Vitest | Drawer-only stroke/clear; guesser guess; trim; case; +100; empty reject |
| Zod | Vitest | Whitespace guess; stroke validation |
| `api` client | Vitest | New methods + snapshot types |
| `DrawingCanvas` | Vitest + RTL (optional) | Drawer vs guesser interaction flags |
| E2E | Manual | Two browsers: draw sync, guess history, scores |

**Out of scope**: result phase, host restart, round auto-end (Scenario 4).

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Large canvas payload on poll | Lab scale; stroke array only; no image blobs |
| Drawer poll overwrites optimistic strokes | Merge server strokes on poll; or skip overwrite if local pending (document in tasks if needed) |
| Guesser draws via forged API | Backend enforces drawer id on stroke/clear |
| Secret word in guess response | Never return `secretWord` in guess endpoint; only `isCorrect` flag |
| Score drift across clients | Single server `scores` map; poll is source of truth |

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
