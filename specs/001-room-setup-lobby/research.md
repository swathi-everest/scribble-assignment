# Research: Scenario 1 — Room Setup & Lobby

**Date**: 2026-05-29  
**Plan**: [plan.md](./plan.md)

## Stack (lab directive)

| Layer | Decision |
|-------|----------|
| Frontend | **React 18** + **TypeScript** + **Vite 5** (existing `frontend/`) |
| Backend | **Node.js** + **Express 4** + **TypeScript** + **Zod** (existing `backend/`) |
| Sync | HTTP **polling** every **2000 ms** on lobby screen only |
| Tests | **Vitest** already configured in both packages (optional RTL for React pages) |

**Rationale**: Matches starter repo and user `/speckit-plan` directive; no new frameworks.

## R1 — Authoritative state location

**Decision**: All room/host/participant/phase state lives in `backend/src/services/roomStore.ts` (`Map<string, Room>`).

**Rationale**: Constitution principle II; starter already uses in-memory store.

**Alternatives considered**: Client-side host flag (rejected — forgeable); Redis (forbidden).

## R2 — Host assignment

**Decision**: On `createRoom`, set `hostParticipantId` to the creator's `participant.id`. Host does not change in Scenario 1.

**Rationale**: FR-002; spec assumes creator is host until a future scenario.

**Alternatives considered**: First joiner becomes host (rejected — contradicts spec).

## R3 — Room code normalization

**Decision**: Store codes uppercase; accept join/fetch/start with case-insensitive match (normalize to uppercase in API layer).

**Rationale**: Spec edge case; starter already uses `code.toUpperCase()` in routes.

**Alternatives considered**: Case-sensitive codes (rejected — worse UX for shared codes).

## R4 — Join validation (empty / unknown)

**Decision**:

- **Client**: `JoinRoomPage` blocks submit when `roomCode.trim() === ""` with inline message.
- **API**: Zod `normalizedRoomCodeSchema` trims and requires `min(1)` on `:code` param.
- **Unknown room**: HTTP **404** with message e.g. `"Unable to join room"` / `"Room not found"`.

**Rationale**: FR-004, FR-005; defense in depth per constitution.

## R5 — Lobby synchronization

**Decision**: `LobbyPage` runs `roomStore.fetchRoom()` on mount and every **2000 ms** via `setInterval` while `room.status === "lobby"`. Clear interval on unmount or status change.

**Rationale**: FR-007, SC-003; replaces manual-only refresh in starter.

**Alternatives considered**: WebSockets (forbidden); manual refresh only (rejected — fails spec).

## R6 — Start game transition

**Decision**: New `POST /api/rooms/:code/start` with body `{ participantId }`. Service `startGame`:

- 404 if room missing
- 403 if `participantId !== hostParticipantId`
- 400 if `participants.length < 2`
- 400 if already `status === "playing"`
- On success: set `status` to `"playing"`, return updated snapshot

Frontend: host-only Start button; disabled when `< 2` participants; on success navigate to `/game`.

**Rationale**: FR-009–FR-012; backend must enforce permissions.

**Alternatives considered**: Client-only navigation to `/game` (rejected — current starter bug).

## R7 — Display names (Scenario 1)

**Decision**: Accept optional `playerName` on create/join; empty/missing → default `"Player"`. Strict trim/reject-empty deferred to **Scenario 2** (spec assumptions).

**Rationale**: Brownfield starter behavior; avoids scope creep.

## R8 — Snapshot shape for UI

**Decision**: Extend `RoomSnapshot` with `hostParticipantId` and per-participant `isHost: boolean` (derived in `toRoomSnapshot`).

**Rationale**: FR-008; simplifies React lobby list without client inferring host.

## R9 — Testing approach

**Decision**:

- Backend: Vitest on `roomStore`, Zod schemas
- Frontend: Vitest on `api.ts`; optional `@testing-library/react` for `LobbyPage` / `JoinRoomPage`
- Manual: two-browser checklist in [quickstart.md](./quickstart.md)

**Rationale**: Constitution requires two-browser validation before scenario complete.

## Resolved unknowns

No `NEEDS CLARIFICATION` items remain for planning. Scenario 2 owns drawer/word after `status === "playing"`.
