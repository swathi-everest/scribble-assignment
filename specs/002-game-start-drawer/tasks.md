---
description: "Task list for Scenario 2 — Game Start & Drawer Flow"
---

# Tasks: Scenario 2 — Game Start & Drawer Flow

**Input**: Design documents in `/specs/002-game-start-drawer/`  
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/rooms-api.md, research.md, quickstart.md; **Scenario 1 complete**

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

**Purpose**: Confirm brownfield environment and Scenario 2 scope before code changes.

- [x] T001 Verify backend and frontend dev servers start per `specs/002-game-start-drawer/quickstart.md`
- [x] T002 [P] Review gap analysis in `specs/002-game-start-drawer/plan.md` against `backend/src/services/roomStore.ts`, `backend/src/api/schemas.ts`, and `frontend/src/pages/GamePage.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared playing-state types required by US2 and US3. **No user story work until this phase completes.**

**Checkpoint**: `Room` and `RoomSnapshot` types support drawer, roles, and optional viewer-scoped `secretWord`.

- [x] T003 Extend `Room` with `drawerParticipantId?` and `secretWord?` in `backend/src/models/game.ts`
- [x] T004 [P] Extend `ParticipantSnapshot` / `RoomSnapshot` with `role?`, `drawerParticipantId?`, and optional `secretWord?` in `backend/src/models/game.ts`
- [x] T005 [P] Mirror playing-state fields (`drawerParticipantId`, `role`, `secretWord?`) on `RoomSnapshot` and `Participant` in `frontend/src/services/api.ts`
- [x] T006 Export `selectSecretWord(code: string)` using `STARTER_WORDS` from `backend/src/seed/starterData.ts` in `backend/src/services/roomStore.ts` (or colocated helper per plan)
- [x] T007 [P] Add Vitest: `selectSecretWord` returns same word for same code and index in `STARTER_WORDS` in `backend/src/services/roomStore.test.ts`

---

## Phase 3: User Story 1 — Validate Player Names on Entry (Priority: P1) 🎯 MVP

**Goal**: Trim names on create/join; reject empty/whitespace-only with clear errors; store trimmed names.

**Independent Test**: Create/join with `"   "` fails; `"  Alex  "` stores as `Alex` in lobby list.

### Implementation for User Story 1

- [x] T008 [US1] Add `normalizePlayerName` (trim; reject empty) and remove `"Player"` fallback for invalid input in `backend/src/services/roomStore.ts`
- [x] T009 [P] [US1] Require `playerName: z.string().trim().min(1, "Player name is required")` in `createRoomSchema` and `joinRoomSchema` in `backend/src/api/schemas.ts`
- [x] T010 [US1] Map name validation failures to `HttpError(400, ...)` on `POST /` and `POST /:code/join` in `backend/src/api/rooms.ts`
- [x] T011 [P] [US1] Add Vitest: whitespace-only and empty names rejected on create/join in `backend/src/services/roomStore.test.ts`
- [x] T012 [P] [US1] Add Vitest for `playerName` trim/min in `backend/src/api/schemas.test.ts`
- [x] T013 [US1] Block submit when `playerName.trim() === ""` with inline error in `frontend/src/pages/CreateRoomPage.tsx`
- [x] T014 [US1] Block submit when `playerName.trim() === ""` with inline error in `frontend/src/pages/JoinRoomPage.tsx`
- [x] T015 [US1] Surface API 400 name errors from `frontend/src/state/roomStore.ts` on create/join without crashing UI
- [x] T016 [P] [US1] Update `frontend/src/services/api.test.ts` fixtures for required trimmed `playerName` on create/join

**Checkpoint**: US1 complete — invalid names rejected; trimmed names visible in lobby.

---

## Phase 4: User Story 2 — Assign Drawer When the First Round Begins (Priority: P2)

**Goal**: On host start, host becomes drawer; all players see drawer vs guesser roles on game screen.

**Independent Test**: Two browsers after start — host labeled drawer, guest labeled guesser; non-host cannot start.

### Implementation for User Story 2

- [x] T017 [US2] On successful `startGame`, set `drawerParticipantId = hostParticipantId` and `status = "playing"` in `backend/src/services/roomStore.ts`
- [x] T018 [US2] Include `drawerParticipantId` and per-participant `role` (`drawer` | `guesser`) in `toRoomSnapshot` when playing in `backend/src/services/roomStore.ts`
- [x] T019 [P] [US2] Add Vitest: host is drawer after start; guessers have `role: "guesser"` in `backend/src/services/roomStore.test.ts`
- [x] T020 [P] [US2] Add Vitest: non-host start and already-playing guards unchanged in `backend/src/services/roomStore.test.ts`
- [x] T021 [US2] Ensure `POST /:code/start` returns viewer-scoped snapshot via `toRoomSnapshot(room, participantId)` in `backend/src/api/rooms.ts`
- [x] T022 [US2] Show drawer vs guesser labels (e.g. “You are drawing” / “{name} is drawing”) in `frontend/src/pages/GamePage.tsx`
- [x] T023 [P] [US2] Display participant roles in game sidebar or header using `participant.role` in `frontend/src/pages/GamePage.tsx`
- [x] T024 [US2] Confirm `frontend/src/pages/LobbyPage.tsx` still navigates to `/game` when `status === "playing"` after start

**Checkpoint**: US2 complete — roles visible; host is drawer; Scenario 1 start rules still hold.

---

## Phase 5: User Story 3 — Secret Word for Drawer Only (Priority: P3)

**Goal**: Deterministic word from `STARTER_WORDS` at start; only drawer receives `secretWord` in API/UI; game polls every 2s.

**Independent Test**: Drawer sees word; guesser does not; guesser Network response omits `secretWord`; same room code → same word.

### Implementation for User Story 3

- [x] T025 [US3] On `startGame`, set `secretWord = selectSecretWord(room.code)` in `backend/src/services/roomStore.ts`
- [x] T026 [US3] Filter `toRoomSnapshot`: include `secretWord` only when `viewerParticipantId === drawerParticipantId`; omit field for guessers in `backend/src/services/roomStore.ts`
- [x] T027 [P] [US3] Add Vitest: guesser snapshot has no `secretWord`; drawer snapshot includes it in `backend/src/services/roomStore.test.ts`
- [x] T028 [P] [US3] Add Vitest: deterministic word stable for same room code in `backend/src/services/roomStore.test.ts`
- [x] T029 [US3] Pass `participantId` into `toRoomSnapshot` on create, join, get, and start in `backend/src/api/rooms.ts` (verify all routes)
- [x] T030 [US3] Add `useEffect` game poll (2000 ms) calling `roomStore.fetchRoom()` while `room.status === "playing"` in `frontend/src/pages/GamePage.tsx`
- [x] T031 [US3] Clear game poll interval on unmount and when status leaves `"playing"` in `frontend/src/pages/GamePage.tsx`
- [x] T032 [US3] Show **Word to draw** panel when `room.secretWord` is present (drawer session) in `frontend/src/pages/GamePage.tsx`
- [x] T033 [US3] Show guesser placeholder (no secret word) when `secretWord` absent in `frontend/src/pages/GamePage.tsx`
- [x] T034 [P] [US3] Update `frontend/src/services/api.test.ts` for drawer vs guesser snapshot shapes

**Checkpoint**: US3 complete — no word leak to guessers; game page polls; drawer sees word.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Builds, regression checks, manual validation.

- [x] T035 [P] Run `npm test` in `backend/` and fix failures
- [x] T036 [P] Run `npm test` in `frontend/` and fix failures
- [x] T037 [P] Run `npm run build` in `backend/` and `frontend/`
- [x] T038 Execute two-browser checklist in `specs/002-game-start-drawer/quickstart.md` (names, roles, word leak, poll)
- [x] T039 [P] Regression: Scenario 1 lobby poll, host-only start, and join code validation still pass
- [x] T040 [P] Optional: add `frontend/src/pages/GamePage.test.tsx` for drawer word panel vs guesser (Vitest + RTL)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → **Foundational (Phase 2)** → **User Stories (Phases 3–5)** → **Polish (Phase 6)**
- User stories are sequential by priority: **US1 → US2 → US3**

### User Story Dependencies

| Story | Depends on | Notes |
|-------|------------|--------|
| US1 | Foundational (T003–T007) | Name rules on create/join only |
| US2 | US1 + Foundational | Start assigns drawer/roles; needs valid names |
| US3 | US2 | Word + snapshot filter + game poll build on playing state |

### Within Each User Story

- Backend service before API routes
- API/types before frontend pages
- Vitest alongside or immediately after service/schema changes
- Story checkpoint before next story

### Parallel Opportunities

**Phase 2**: T003–T005 parallel after reading `game.ts`; T006–T007 parallel once `selectSecretWord` exists.

**US1**: T009, T011, T012, T016 parallel; T013–T015 sequential on pages.

**US2**: T019, T020, T023 parallel after T017–T018.

**US3**: T027, T028, T034 parallel after T025–T026; T030–T033 sequential on `GamePage.tsx`.

**Polish**: T035–T037, T039–T040 parallel.

---

## Parallel Example: User Story 3

```bash
# After T025–T026 snapshot filter exists, launch in parallel:
# T027 roomStore.test.ts (no leak) | T028 roomStore.test.ts (deterministic) | T034 api.test.ts

# Then sequentially on GamePage.tsx:
# T030 poll interval → T031 cleanup → T032 drawer word panel → T033 guesser placeholder
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1–2
2. Complete Phase 3 (US1)
3. **STOP and VALIDATE**: Reject `"   "` on create/join; accept trimmed `"Alex"`
4. Demo before drawer/word work

### Incremental Delivery

1. US1 → validate name trim/reject
2. US2 → validate drawer roles after start
3. US3 → validate secret word visibility + game poll
4. Phase 6 → builds + quickstart checklist

### Suggested MVP Scope

**Minimum for first demo**: Phases 1–3 (through T016) — strict player names on create/join.

**Scenario 2 complete**: All phases through T038 quickstart checklist.

---

## Task Summary

| Phase | Task IDs | Count |
|-------|----------|-------|
| Setup | T001–T002 | 2 |
| Foundational | T003–T007 | 5 |
| US1 Name validation | T008–T016 | 9 |
| US2 Drawer assignment | T017–T024 | 8 |
| US3 Secret word + poll | T025–T034 | 10 |
| Polish | T035–T040 | 6 |
| **Total** | **T001–T040** | **40** |

---

## Independent Test Criteria (from spec)

| Story | Independent Test |
|-------|------------------|
| US1 | `"   "` rejected; `"  Alex  "` → `Alex` in participant list |
| US2 | Host start with 2 players → host drawer, guest guesser in both browsers |
| US3 | Drawer sees word; guesser API/UI omit `secretWord`; same code → same word |
