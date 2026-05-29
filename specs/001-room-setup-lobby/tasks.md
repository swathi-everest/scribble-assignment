---
description: "Task list for Scenario 1 — Room Setup & Lobby"
---

# Tasks: Scenario 1 — Room Setup & Lobby

**Input**: Design documents in `/specs/001-room-setup-lobby/`  
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/rooms-api.md, research.md, quickstart.md

**Tests**: Vitest tasks included per implementation plan (backend required; frontend page tests optional).

**Organization**: Tasks grouped by user story for independent implementation and validation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete dependencies)
- **[Story]**: Maps to spec user stories US1–US4

## Path Conventions

- Backend: `backend/src/`
- Frontend: `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm brownfield environment and feature context before code changes.

- [x] T001 Verify backend and frontend dev servers start per `specs/001-room-setup-lobby/quickstart.md`
- [x] T002 [P] Review gap analysis in `specs/001-room-setup-lobby/plan.md` against current `backend/src/services/roomStore.ts` and `frontend/src/pages/LobbyPage.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types and snapshot shape required by all user stories. **No user story work until this phase completes.**

**Checkpoint**: Room model supports `hostParticipantId`, `status: "lobby" | "playing"`, and snapshot includes `isHost`.

- [x] T003 Extend `Room`, `RoomSnapshot`, and participant snapshot types with `hostParticipantId` and `status: "lobby" | "playing"` in `backend/src/models/game.ts`
- [x] T004 [P] Mirror `RoomSnapshot` fields (`hostParticipantId`, `status`, participant `isHost`) in `frontend/src/services/api.ts`
- [x] T005 Update `toRoomSnapshot` in `backend/src/services/roomStore.ts` to set `hostParticipantId` and `isHost` on each participant
- [x] T006 Remove debug `console.log` from `backend/src/services/roomStore.ts` if present

---

## Phase 3: User Story 1 — Create a Room as Host (Priority: P1) 🎯 MVP

**Goal**: Creator receives a unique code, lands in lobby, and is shown as host with one participant.

**Independent Test**: Create room in one browser → lobby shows code, host badge on self, count = 1.

### Implementation for User Story 1

- [x] T007 [US1] Set `hostParticipantId` to creator `participant.id` in `createRoom` in `backend/src/services/roomStore.ts`
- [x] T008 [US1] Ensure `POST /` response includes host fields via `toRoomSnapshot` in `backend/src/api/rooms.ts`
- [x] T009 [P] [US1] Add Vitest: create room sets `hostParticipantId` and `isHost` on creator in `backend/src/services/roomStore.test.ts`
- [x] T010 [US1] Show host indicator on participant row in `frontend/src/pages/LobbyPage.tsx` (use `isHost` or `hostParticipantId`)
- [x] T011 [US1] Confirm `frontend/src/pages/CreateRoomPage.tsx` navigates to lobby after create with session in `frontend/src/state/roomStore.ts`

**Checkpoint**: US1 complete — single-tab create → lobby with host label.

---

## Phase 4: User Story 2 — Join a Room with Validation (Priority: P2)

**Goal**: Valid joins succeed; empty/unknown codes rejected with clear feedback; rooms stay isolated.

**Independent Test**: Join valid code from second tab; empty and `ZZZZ` codes show errors; two rooms do not cross-leak.

### Implementation for User Story 2

- [x] T012 [P] [US2] Add `normalizedRoomCodeParamsSchema` (trim, min length 1) in `backend/src/api/schemas.ts`
- [x] T013 [US2] Apply normalized code schema to join and get routes in `backend/src/api/rooms.ts`
- [x] T014 [P] [US2] Add Vitest for empty/whitespace room code rejection in `backend/src/api/schemas.test.ts`
- [x] T015 [US2] Block submit when `roomCode.trim() === ""` with inline error in `frontend/src/pages/JoinRoomPage.tsx`
- [x] T016 [US2] Surface API join errors (404) in `frontend/src/pages/JoinRoomPage.tsx` via `frontend/src/state/roomStore.ts` without crashing
- [x] T017 [P] [US2] Add Vitest: two rooms stay isolated on join in `backend/src/services/roomStore.test.ts`

**Checkpoint**: US2 complete — join validation and multi-room isolation verified.

---

## Phase 5: User Story 3 — Live Lobby Updates (Priority: P3)

**Goal**: Lobby participant list auto-refreshes ~every 2 seconds without manual refresh.

**Independent Test**: Two browsers in same room — host sees guest within ~3s without clicking Refresh.

### Implementation for User Story 3

- [x] T018 [US3] Add `useEffect` interval (2000 ms) calling `roomStore.fetchRoom()` while `room.status === "lobby"` in `frontend/src/pages/LobbyPage.tsx`
- [x] T019 [US3] Clear poll interval on unmount and when status leaves `"lobby"` in `frontend/src/pages/LobbyPage.tsx`
- [x] T020 [US3] Handle poll errors with recoverable message in `frontend/src/pages/LobbyPage.tsx` (keep manual Refresh as fallback)
- [x] T021 [P] [US3] Ensure `fetchRoom` passes `participantId` query in `frontend/src/services/api.ts` and `frontend/src/state/roomStore.ts`

**Checkpoint**: US3 complete — automatic lobby sync works for host and guest.

---

## Phase 6: User Story 4 — Host Starts the Game (Priority: P4)

**Goal**: Host-only start when ≥2 players; room transitions to `playing`; non-host and early start blocked.

**Independent Test**: Start disabled with 1 player; host starts with 2; guest cannot start; other rooms unaffected.

### Implementation for User Story 4

- [x] T022 [US4] Implement `startGame(code, participantId)` with host, min-players, and already-playing guards in `backend/src/services/roomStore.ts`
- [x] T023 [P] [US4] Add `startGameSchema` and export typed errors for API in `backend/src/api/schemas.ts`
- [x] T024 [US4] Add `POST /:code/start` handler per `specs/001-room-setup-lobby/contracts/rooms-api.md` in `backend/src/api/rooms.ts`
- [x] T025 [P] [US4] Add Vitest for start authorization, min players, and status transition in `backend/src/services/roomStore.test.ts`
- [x] T026 [P] [US4] Add `startGame(code, participantId)` to `frontend/src/services/api.ts`
- [x] T027 [US4] Add `startGame()` with loading/error handling in `frontend/src/state/roomStore.ts`
- [x] T028 [P] [US4] Add Vitest for start request URL/body in `frontend/src/services/api.test.ts`
- [x] T029 [US4] Show Start only to host; disable when `participants.length < 2` with helper text in `frontend/src/pages/LobbyPage.tsx`
- [x] T030 [US4] Wire Start button to `roomStore.startGame()` and navigate to `/game` on `status === "playing"` in `frontend/src/pages/LobbyPage.tsx`
- [x] T031 [US4] Hide or disable Start for non-host participants in `frontend/src/pages/LobbyPage.tsx`
- [x] T032 [US4] Redirect to lobby if `room.status !== "playing"` in `frontend/src/pages/GamePage.tsx` (or route guard)

**Checkpoint**: US4 complete — authoritative start flow end-to-end.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Builds, optional UI tests, manual validation, cleanup.

- [x] T033 [P] Run `npm test` in `backend/` and fix failures
- [x] T034 [P] Run `npm test` in `frontend/` and fix failures
- [x] T035 [P] Run `npm run build` in `backend/` and `frontend/`
- [x] T036 Execute two-browser checklist in `specs/001-room-setup-lobby/quickstart.md`
- [x] T037 [P] Optional: add `frontend/src/pages/JoinRoomPage.test.tsx` for empty-code validation (Vitest + RTL)
- [x] T038 [P] Optional: add `frontend/src/pages/LobbyPage.test.tsx` for host-only disabled start (Vitest + RTL)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → **Foundational (Phase 2)** → **User Stories (Phases 3–6)** → **Polish (Phase 7)**
- User stories are sequential by priority: **US1 → US2 → US3 → US4**

### User Story Dependencies

| Story | Depends on | Notes |
|-------|------------|--------|
| US1 | Foundational (T003–T006) | MVP: create + host lobby |
| US2 | US1 + Foundational | Needs existing create/join API |
| US3 | US1, US2 | Poll shows joins from US2 |
| US4 | US1–US3 | Start needs live lobby + 2 players |

### Within Each User Story

- Backend service before API routes
- API before frontend `api.ts` / `roomStore.ts`
- State/API before page UI
- Story checkpoint before next story

### Parallel Opportunities

**Phase 2**: T003 and T004 in parallel after reading models.

**US2**: T012, T014, T017 parallel; T015–T016 sequential on JoinRoomPage.

**US4**: T023, T025, T026, T028 parallel after T022; T029–T031 sequential on LobbyPage.

**Polish**: T033–T035, T037–T038 parallel.

---

## Parallel Example: User Story 4

```bash
# After T022 startGame service exists, launch in parallel:
# T023 schemas.ts | T025 roomStore.test.ts | T026 api.ts | T028 api.test.ts

# Then sequentially on LobbyPage.tsx:
# T029 host-only disabled start → T030 wire startGame → T031 non-host hide
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1–2
2. Complete Phase 3 (US1)
3. **STOP and VALIDATE**: Create room → lobby with host badge
4. Demo before join/poll/start work

### Incremental Delivery

1. US1 → validate create/host lobby
2. US2 → validate join + errors + isolation
3. US3 → validate 2s poll without manual refresh
4. US4 → validate start gates + `playing` transition
5. Phase 7 → builds + quickstart checklist

### Suggested MVP Scope

**Minimum for first demo**: Phases 1–3 (through T011) — create room as host in lobby.

**Scenario 1 complete**: All phases through T036 quickstart checklist.

---

## Task Summary

| Phase | Task IDs | Count |
|-------|----------|-------|
| Setup | T001–T002 | 2 |
| Foundational | T003–T006 | 4 |
| US1 Create/host | T007–T011 | 5 |
| US2 Join/validation | T012–T017 | 6 |
| US3 Lobby poll | T018–T021 | 4 |
| US4 Start game | T022–T032 | 11 |
| Polish | T033–T038 | 6 |
| **Total** | **T001–T038** | **38** |
