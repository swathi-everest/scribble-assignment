---
description: "Task list for Scenario 3 — Gameplay Interaction"
---

# Tasks: Scenario 3 — Gameplay Interaction

**Input**: Design documents in `/specs/003-gameplay-interaction/`  
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/rooms-api.md, research.md, quickstart.md; **Scenarios 1–2 complete**

**Tests**: Vitest tasks included per implementation plan (backend required; frontend optional).

**Organization**: Tasks grouped by user story for independent implementation and validation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete dependencies)
- **[Story]**: Maps to spec user stories US1–US3

## Path Conventions

- Backend: `backend/src/`
- Frontend: `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm brownfield environment and Scenario 3 scope before code changes.

- [x] T001 Verify backend and frontend dev servers start per `specs/003-gameplay-interaction/quickstart.md`
- [x] T002 [P] Review gap analysis in `specs/003-gameplay-interaction/plan.md` against `backend/src/services/roomStore.ts`, `backend/src/models/game.ts`, and `frontend/src/pages/GamePage.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared playing-state fields for canvas, guesses, and scores. **No user story work until this phase completes.**

**Checkpoint**: `startGame` initializes empty canvas/guesses and zero scores; `toRoomSnapshot` exposes `canvas`, `guesses`, `scores` when `playing`.

- [x] T003 Add `CanvasStroke` and `GuessRecord` types; extend `Room` with `canvasStrokes`, `guesses`, `scores` in `backend/src/models/game.ts`
- [x] T004 [P] Extend `RoomSnapshot` with `canvas`, `guesses`, and `scores` when playing in `backend/src/models/game.ts`
- [x] T005 [P] Mirror `CanvasStroke`, `GuessRecord`, and playing snapshot fields in `frontend/src/services/api.ts`
- [x] T006 Initialize `canvasStrokes = []`, `guesses = []`, and `scores[id] = 0` for each participant in `startGame` in `backend/src/services/roomStore.ts`
- [x] T007 Include `canvas`, `guesses`, and `scores` in `toRoomSnapshot` for all viewers when `status === "playing"` in `backend/src/services/roomStore.ts`
- [x] T008 [P] Add Vitest: `startGame` yields empty canvas/guesses and all scores `0` in `backend/src/services/roomStore.test.ts`

---

## Phase 3: User Story 1 — Drawer Draws and Clears the Canvas (Priority: P1) 🎯 MVP

**Goal**: Drawer draws with immediate local feedback, clears canvas, and guessers see synced strokes via poll; non-drawers cannot mutate canvas.

**Independent Test**: Two-browser game; drawer strokes appear locally; clear empties canvas; guesser cannot draw; guesser sees drawing within ~3s.

### Implementation for User Story 1

- [x] T009 [US1] Implement `appendStroke(code, participantId, stroke)` with playing + drawer-only guards in `backend/src/services/roomStore.ts`
- [x] T010 [US1] Implement `clearCanvas(code, participantId)` with playing + drawer-only guards in `backend/src/services/roomStore.ts`
- [x] T011 [P] [US1] Add Vitest: drawer append/clear succeed; guesser gets 403; not playing 400 in `backend/src/services/roomStore.test.ts`
- [x] T012 [P] [US1] Add Vitest: clear canvas preserves `guesses` and `scores` in `backend/src/services/roomStore.test.ts`
- [x] T013 [P] [US1] Add `canvasStrokeSchema` and `appendStrokeSchema` in `backend/src/api/schemas.ts`
- [x] T014 [US1] Add `clearCanvasSchema` in `backend/src/api/schemas.ts`
- [x] T015 [US1] Add `POST /:code/canvas/strokes` per `specs/003-gameplay-interaction/contracts/rooms-api.md` in `backend/src/api/rooms.ts`
- [x] T016 [US1] Add `POST /:code/canvas/clear` per contract in `backend/src/api/rooms.ts`
- [x] T017 [P] [US1] Map canvas errors to `403` / `400` / `404` in `backend/src/api/rooms.ts`
- [x] T018 [P] [US1] Add Vitest for stroke point bounds and shape in `backend/src/api/schemas.test.ts`
- [x] T019 [P] [US1] Add `appendStroke` and `clearCanvas` methods in `frontend/src/services/api.ts`
- [x] T020 [US1] Add `appendStroke` and `clearCanvas` wrappers in `frontend/src/state/roomStore.ts`
- [x] T021 [P] [US1] Update `frontend/src/services/api.test.ts` for canvas endpoints
- [x] T022 [US1] Create `DrawingCanvas.tsx` with HTML canvas, normalized `[0,1]` coordinates, and drawer-only pointer handlers
- [x] T023 [US1] Add optimistic local stroke render and `POST` stroke on pointer up in `frontend/src/components/DrawingCanvas.tsx`
- [x] T024 [US1] Add **Clear** button calling `clearCanvas` and resetting local strokes in `frontend/src/components/DrawingCanvas.tsx`
- [x] T025 [US1] Render read-only strokes for guessers from `room.canvas.strokes` in `frontend/src/components/DrawingCanvas.tsx`
- [x] T026 [US1] Replace canvas placeholder with `DrawingCanvas` in `frontend/src/pages/GamePage.tsx`
- [x] T027 [US1] Reconcile local strokes with polled `room.canvas.strokes` on `GamePage` poll in `frontend/src/components/DrawingCanvas.tsx`

**Checkpoint**: US1 complete — drawer draw/clear works; guesser sees synced canvas; API rejects guesser strokes.

---

## Phase 4: User Story 2 — Guessers Submit Validated Guesses (Priority: P1)

**Goal**: Guessers submit trimmed guesses; empty rejected; case-insensitive match; drawer cannot guess; correct/incorrect recorded server-side.

**Independent Test**: Guesser submits `"  rocket  "`, `"ROCKET"`, `"   "`, wrong word — trim/case/empty/drawer rules per spec.

### Implementation for User Story 2

- [x] T028 [US2] Add `InvalidGuessError` and `submitGuess(code, participantId, rawText)` with trim, case compare, and `+100` on correct in `backend/src/services/roomStore.ts`
- [x] T029 [P] [US2] Add Vitest: trim and case-insensitive correct guess in `backend/src/services/roomStore.test.ts`
- [x] T030 [P] [US2] Add Vitest: empty/whitespace guess rejected; drawer submit rejected in `backend/src/services/roomStore.test.ts`
- [x] T031 [P] [US2] Add Vitest: incorrect guess adds `0` to score in `backend/src/services/roomStore.test.ts`
- [x] T032 [P] [US2] Add `submitGuessSchema` with `guessText: z.string().trim().min(1, "Guess cannot be empty")` in `backend/src/api/schemas.ts`
- [x] T033 [US2] Add `POST /:code/guesses` handler per contract in `backend/src/api/rooms.ts`
- [x] T034 [P] [US2] Add Vitest for whitespace-only `guessText` in `backend/src/api/schemas.test.ts`
- [x] T035 [P] [US2] Add `submitGuess` to `frontend/src/services/api.ts`
- [x] T036 [US2] Add `submitGuess` wrapper with error surfacing in `frontend/src/state/roomStore.ts`
- [x] T037 [P] [US2] Update `frontend/src/services/api.test.ts` for `submitGuess`
- [x] T038 [US2] Wire `GuessForm` submit to `roomStore.submitGuess` in `frontend/src/components/GuessForm.tsx`
- [x] T039 [US2] Display API validation errors in `GuessForm.tsx` without crashing UI
- [x] T040 [US2] Confirm guess form remains hidden for drawer in `frontend/src/pages/GamePage.tsx`

**Checkpoint**: US2 complete — guesses validated server-side; history entries created; scores update on correct guess.

---

## Phase 5: User Story 3 — Shared Guess History and Scores via Polling (Priority: P2)

**Goal**: All participants see same scores (starting at 0) and ordered guess history via existing 2s game poll; room isolation preserved.

**Independent Test**: Two browsers after start show score `0`; after correct/incorrect guesses both show same history and scores within ~3s; second room unchanged.

### Implementation for User Story 3

- [x] T041 [US3] Render per-participant scores from `room.scores` and participant names in `frontend/src/components/Scoreboard.tsx`
- [x] T042 [US3] Render ordered guess list (name, trimmed text, correct/incorrect) from `room.guesses` in `frontend/src/components/ResultPanel.tsx`
- [x] T043 [P] [US3] Add Vitest: accepted guess appears in `toRoomSnapshot` guesses for all viewers in `backend/src/services/roomStore.test.ts`
- [x] T044 [P] [US3] Add Vitest: correct guess increases score by exactly `100` in `backend/src/services/roomStore.test.ts`
- [x] T045 [P] [US3] Add Vitest: canvas/guesses/scores in room A do not change room B in `backend/src/services/roomStore.test.ts`
- [x] T046 [US3] Confirm `GamePage` poll (`GAME_POLL_MS = 2000`) updates `Scoreboard` and `ResultPanel` without manual refresh in `frontend/src/pages/GamePage.tsx`

**Checkpoint**: US3 complete — shared scores/history sync via poll; isolation tests pass.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Builds, regression, manual validation.

- [x] T047 [P] Run `npm test` in `backend/` and fix failures
- [x] T048 [P] Run `npm test` in `frontend/` and fix failures
- [x] T049 [P] Run `npm run build` in `backend/` and `frontend/`
- [x] T050 Execute two-browser checklist in `specs/003-gameplay-interaction/quickstart.md`
- [x] T051 [P] Regression: Scenario 2 drawer-only `secretWord`, name trim, and game poll still pass
- [x] T052 [P] Optional: add `frontend/src/components/DrawingCanvas.test.tsx` for drawer vs guesser modes (Vitest + RTL)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → **Foundational (Phase 2)** → **User Stories (Phases 3–5)** → **Polish (Phase 6)**
- User stories are sequential by priority: **US1 → US2 → US3**

### User Story Dependencies

| Story | Depends on | Notes |
|-------|------------|--------|
| US1 | Foundational (T003–T008) | Canvas APIs + `DrawingCanvas`; MVP |
| US2 | US1 + Foundational | Guesses on playing game; uses snapshot fields from T007 |
| US3 | US2 | Scoreboard/ResultPanel need guess/score data from US2 |

### Within Each User Story

- Backend service before API routes
- API/types before frontend components
- Vitest alongside or immediately after service/schema changes
- Story checkpoint before next story

### Parallel Opportunities

**Phase 2**: T003–T005 parallel after reading `game.ts`; T008 parallel once `startGame` updated.

**US1**: T011–T012, T013, T018–T019, T021 parallel after T009–T010; T022–T027 sequential on `DrawingCanvas.tsx` / `GamePage.tsx`.

**US2**: T029–T031, T032, T034–T035, T037 parallel after T028; T038–T040 sequential on `GuessForm.tsx`.

**US3**: T043–T045 parallel after US2 backend; T041–T042 parallel on components.

**Polish**: T047–T049, T051–T052 parallel.

---

## Parallel Example: User Story 1

```bash
# After T009–T010 service methods exist, launch in parallel:
# T011–T012 roomStore.test.ts | T013 schemas.ts | T018 schemas.test.ts | T019 api.ts

# Then sequentially:
# T015–T016 rooms.ts → T020 roomStore.ts → T022–T027 DrawingCanvas + GamePage
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1–2
2. Complete Phase 3 (US1)
3. **STOP and VALIDATE**: Drawer draw/clear; guesser sees canvas via poll; guesser cannot POST strokes
4. Demo before guess/score UI

### Incremental Delivery

1. US1 → validate canvas draw/sync
2. US2 → validate guess trim/case/permissions and server scoring
3. US3 → validate shared scoreboard/history via poll
4. Phase 6 → builds + quickstart checklist

### Suggested MVP Scope

**Minimum for first demo**: Phases 1–3 (through T027) — interactive drawer canvas with poll sync.

**Scenario 3 complete**: All phases through T050 quickstart checklist.

---

## Task Summary

| Phase | Task IDs | Count |
|-------|----------|-------|
| Setup | T001–T002 | 2 |
| Foundational | T003–T008 | 6 |
| US1 Canvas | T009–T027 | 19 |
| US2 Guesses | T028–T040 | 13 |
| US3 History & scores | T041–T046 | 6 |
| Polish | T047–T052 | 6 |
| **Total** | **T001–T052** | **52** |

---

## Independent Test Criteria (from spec)

| Story | Independent Test |
|-------|------------------|
| US1 | Drawer strokes + clear locally; guesser read-only; canvas sync ~3s via poll |
| US2 | Trim/case/empty/drawer rules; correct vs incorrect guess outcomes |
| US3 | Scores start at 0; shared history/scores within ~3s; room isolation |
