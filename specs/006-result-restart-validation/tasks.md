---
description: "Task list for Scenario 4 — Result, Restart & Final Validation"
---

# Tasks: Scenario 4 — Result, Restart & Final Validation

**Input**: Design documents in `/specs/006-result-restart-validation/`  
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/rooms-api.md, research.md, quickstart.md; **Scenarios 1–3 complete**

**Tests**: Vitest tasks included per implementation plan (backend required; frontend API tests).

**Organization**: Tasks grouped by user story for independent implementation and validation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete dependencies)
- **[Story]**: Maps to spec user stories US1–US3

## Path Conventions

- Backend: `backend/src/`
- Frontend: `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm brownfield environment and Scenario 4 scope before code changes.

- [x] T001 Verify backend and frontend dev servers start per `specs/006-result-restart-validation/quickstart.md`
- [x] T002 [P] Review gap analysis in `specs/006-result-restart-validation/plan.md` against `backend/src/models/game.ts`, `backend/src/services/roomStore.ts`, and `frontend/src/pages/GamePage.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared `result` status and guards. **No user story work until this phase completes.**

**Checkpoint**: `RoomStatus` includes `"result"`; `startGame` rejects rooms already in `result`; frontend types accept `status: "result"`.

- [x] T003 Add `"result"` to `RoomStatus` in `backend/src/models/game.ts`
- [x] T004 [P] Extend `RoomSnapshot.status` with `"result"` in `frontend/src/services/api.ts`
- [x] T005 Reject `startGame` when `room.status === "result"` (same as `playing`) in `backend/src/services/roomStore.ts`
- [x] T006 [P] Add Vitest: `startGame` fails when room is in `result` in `backend/src/services/roomStore.test.ts`

---

## Phase 3: User Story 1 — Review Complete Round Result (Priority: P1) 🎯 MVP

**Goal**: Host ends the round; all players see the same revealed word, final scores, and full guess history on a result view synced via ~2s poll.

**Independent Test**: Two-browser game; host clicks **End round**; both see matching word, scoreboard, and guess history within ~3s; guesser sees word only after result (not during `playing`).

### Implementation for User Story 1

- [x] T007 [US1] Implement `endRound(code, participantId)` with host + `playing` guards in `backend/src/services/roomStore.ts`
- [x] T008 [P] [US1] Add Vitest: host `endRound` sets `status` to `result` without mutating guesses/scores in `backend/src/services/roomStore.test.ts`
- [x] T009 [P] [US1] Add Vitest: non-host `endRound` rejected; not `playing` returns error in `backend/src/services/roomStore.test.ts`
- [x] T010 [US1] Extend `toRoomSnapshot` to include `secretWord`, `guesses`, and `scores` for **all** viewers when `status === "result"` in `backend/src/services/roomStore.ts`
- [x] T011 [P] [US1] Add Vitest: guesser snapshot includes `secretWord` in `result` but not in `playing` in `backend/src/services/roomStore.test.ts`
- [x] T012 [P] [US1] Add `endRoundSchema` (`participantId`) in `backend/src/api/schemas.ts`
- [x] T013 [US1] Add `POST /:code/end-round` per `specs/006-result-restart-validation/contracts/rooms-api.md` in `backend/src/api/rooms.ts`
- [x] T014 [P] [US1] Map end-round errors to `403` / `400` / `404` in `backend/src/api/rooms.ts`
- [x] T015 [P] [US1] Add `endRound` method in `frontend/src/services/api.ts`
- [x] T016 [US1] Add `endRound` wrapper in `frontend/src/state/roomStore.ts`
- [x] T017 [P] [US1] Update `frontend/src/services/api.test.ts` for `endRound` and `result` snapshot fixture
- [x] T018 [US1] Create `ResultPage.tsx` with revealed word card, `Scoreboard`, `ResultPanel`, and `RESULT_POLL_MS = 2000`
- [x] T019 [US1] Add host-only **End round** button calling `endRound` in `frontend/src/pages/GamePage.tsx`
- [x] T020 [US1] Redirect to `/result` when poll or end-round returns `status === "result"` in `frontend/src/pages/GamePage.tsx`
- [x] T021 [US1] Add `/result` route in `frontend/src/routes/index.tsx`
- [x] T022 [US1] Redirect to `/result` when lobby poll sees `status === "result"` in `frontend/src/pages/LobbyPage.tsx`

**Checkpoint**: US1 complete — host can end round; all clients see consistent result data on `/result`.

---

## Phase 4: User Story 2 — Restart To Clean Lobby (Priority: P1)

**Goal**: Host restarts after results; all players return to lobby with roster preserved and round state cleared.

**Independent Test**: From result, host restarts; both land on lobby; same players; no word/scores/guesses/canvas; host can start a new round.

### Implementation for User Story 2

- [x] T023 [US2] Implement `restartRoom(code, participantId)` clearing round fields and setting `status` to `lobby` in `backend/src/services/roomStore.ts`
- [x] T024 [P] [US2] Add Vitest: restart preserves `participants` ids/names and clears `secretWord`, drawer, canvas, guesses, scores in `backend/src/services/roomStore.test.ts`
- [x] T025 [P] [US2] Add Vitest: lobby snapshot after restart omits round fields in `backend/src/services/roomStore.test.ts`
- [x] T026 [P] [US2] Add `restartSchema` (`participantId`) in `backend/src/api/schemas.ts`
- [x] T027 [US2] Add `POST /:code/restart` per contract in `backend/src/api/rooms.ts`
- [x] T028 [P] [US2] Map restart errors to `403` / `400` / `404` in `backend/src/api/rooms.ts`
- [x] T029 [P] [US2] Add `restartRoom` method in `frontend/src/services/api.ts`
- [x] T030 [US2] Add `restartRoom` wrapper in `frontend/src/state/roomStore.ts`
- [x] T031 [P] [US2] Update `frontend/src/services/api.test.ts` for `restartRoom`
- [x] T032 [US2] Add host-only **Restart** button navigating to `/lobby` in `frontend/src/pages/ResultPage.tsx`
- [x] T033 [US2] Ensure `LobbyPage` shows clean lobby (no stale round UI) after restart poll in `frontend/src/pages/LobbyPage.tsx`

**Checkpoint**: US2 complete — full round lifecycle: play → result → restart → lobby.

---

## Phase 5: User Story 3 — Reject Invalid Restart Attempts (Priority: P2)

**Goal**: Non-host cannot restart; restart/end-round blocked outside valid phases; gameplay mutations blocked in `result`.

**Independent Test**: Non-host restart API returns 403 with no state change; host restart from lobby/playing returns 400; canvas/guess POST in `result` returns 400.

### Implementation for User Story 3

- [x] T034 [P] [US3] Add Vitest: `restartRoom` non-host rejected; from `lobby`/`playing` returns `NOT_IN_RESULT` in `backend/src/services/roomStore.test.ts`
- [x] T035 [P] [US3] Add Vitest: `endRound` from `lobby`/`result` rejected in `backend/src/services/roomStore.test.ts`
- [x] T036 [P] [US3] Add Vitest: `appendStroke` / `submitGuess` return not-playing when `status === "result"` in `backend/src/services/roomStore.test.ts`
- [x] T037 [P] [US3] Add Vitest: second `restartRoom` while already `lobby` is rejected without roster corruption in `backend/src/services/roomStore.test.ts`
- [x] T038 [US3] Hide **Restart** control for non-host in `frontend/src/pages/ResultPage.tsx`
- [x] T039 [US3] Surface API error messages for invalid restart/end-round without UI crash in `frontend/src/pages/ResultPage.tsx` and `frontend/src/pages/GamePage.tsx`

**Checkpoint**: US3 complete — authorization and phase guards enforced server-side and reflected in UI.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Builds, regression, manual Scenario 4 validation.

- [x] T040 [P] Run `npm test` in `backend/` and fix failures
- [x] T041 [P] Run `npm test` in `frontend/` and fix failures
- [x] T042 [P] Run `npm run build` in `backend/` and `frontend/`
- [x] T043 Execute two-browser checklist in `specs/006-result-restart-validation/quickstart.md`
- [x] T044 [P] Regression: Scenario 3 canvas/guess/scoring and drawer-only word during `playing` still pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → **Foundational (Phase 2)** → **User Stories (Phases 3–5)** → **Polish (Phase 6)**
- User stories sequential by priority: **US1 → US2 → US3**

### User Story Dependencies

| Story | Depends on | Notes |
|-------|------------|--------|
| US1 | Foundational (T003–T006) | End round + result UI; MVP |
| US2 | US1 | Restart requires `result` state |
| US3 | US2 | Guard tests validate restart/end-round APIs exist |

### Within Each User Story

- Backend service before API routes
- API/types before frontend pages
- Vitest alongside or immediately after service changes
- Story checkpoint before next story

### Parallel Opportunities

**Phase 2**: T004 parallel with T003; T006 after T005.

**US1**: T008–T009, T011–T012, T014–T015, T017 parallel after T007; T018–T022 sequential on pages/routes.

**US2**: T024–T026, T028–T029, T031 parallel after T023; T032–T033 sequential on `ResultPage.tsx` / `LobbyPage.tsx`.

**US3**: T034–T037 parallel; T038–T039 sequential on UI.

**Polish**: T040–T042, T044 parallel.

---

## Parallel Example: User Story 1

```bash
# After T007 endRound exists, launch in parallel:
# T008–T009 roomStore.test.ts | T012 schemas.ts | T015 api.ts | T017 api.test.ts

# Then sequentially:
# T010 toRoomSnapshot → T013 rooms.ts → T016 roomStore.ts → T018–T022 pages/routes
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1–2
2. Complete Phase 3 (US1)
3. **STOP and VALIDATE**: Host end round; both browsers see result parity (word, scores, history)
4. Demo before restart flow

### Incremental Delivery

1. US1 → validate result display and sync
2. US2 → validate restart to clean lobby
3. US3 → validate permission and phase guards
4. Phase 6 → builds + quickstart checklist

### Suggested MVP Scope

**Minimum for first demo**: Phases 1–3 (through T022) — end round and shared result view.

**Scenario 4 complete**: All phases through T043 quickstart checklist.

---

## Task Summary

| Phase | Task IDs | Count |
|-------|----------|-------|
| Setup | T001–T002 | 2 |
| Foundational | T003–T006 | 4 |
| US1 Result | T007–T022 | 16 |
| US2 Restart | T023–T033 | 11 |
| US3 Guards | T034–T039 | 6 |
| Polish | T040–T044 | 5 |
| **Total** | **T001–T044** | **44** |

---

## Independent Test Criteria (from spec)

| Story | Independent Test |
|-------|------------------|
| US1 | End round → all players see same word, scores, full guess history |
| US2 | Restart → lobby with roster preserved; round fields cleared |
| US3 | Non-host / wrong-phase restart and end-round rejected; no stale mutations in `result` |
