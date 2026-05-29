# Research: Scenario 2 — Game Start & Drawer Flow

**Date**: 2026-05-29  
**Plan**: [plan.md](./plan.md)

## Stack (lab directive)

| Layer | Decision |
|-------|----------|
| Frontend | **React 18** + **TypeScript** + **Vite 5** — extend `GamePage`, create/join pages |
| Backend | **Node.js** + **Express 4** + **TypeScript** + **Zod** — extend `roomStore`, schemas |
| Sync | HTTP polling **2000 ms** on `GamePage` (same as lobby) |
| Tests | **Vitest** in both packages |

**Rationale**: User `/speckit-plan` directive; brownfield extension of Scenario 1.

## R1 — Player name validation

**Decision**:

- **Zod**: `z.string().trim().min(1, "Player name is required")` for `playerName` on create and join (required in body).
- **Service**: `normalizePlayerName(input)` trims; if length 0 after trim, reject before persisting.
- **Client**: Optional pre-submit `trim() === ""` message; always surface API `message` on failure.
- Remove Scenario 1 default `"Player"` for omitted/whitespace names.

**Rationale**: FR-001–FR-003; spec rejects whitespace-only and stores trimmed names.

**Alternatives considered**: Client-only validation (rejected — forgeable); keep `"Player"` default (rejected — contradicts Scenario 2 spec).

## R2 — Drawer assignment on start

**Decision**: On successful `startGame`, set `drawerParticipantId = hostParticipantId`. Every other participant is a guesser. Expose `role` on each participant in snapshot when `status === "playing"`.

**Rationale**: FR-004–FR-006; spec: host becomes drawer for round one.

**Alternatives considered**: First joiner by `joinedAt` (rejected — spec names host); random drawer (rejected — non-deterministic).

## R3 — Deterministic secret word

**Decision**: At start, `secretWord = STARTER_WORDS[sum(charCodeAt(c) for c in room.code) % STARTER_WORDS.length]`.

Example: code `ABCD` → same word on every first start for that room.

**Rationale**: FR-007, SC-005; testable without RNG; uses fixed starter list from `starterData.ts`.

**Alternatives considered**: `Math.random()` (rejected — fails SC-005); always first word (rejected — poor distribution across rooms).

## R4 — Viewer-filtered snapshots (secret word)

**Decision**: `toRoomSnapshot(room, viewerParticipantId?)`:

- Include `drawerParticipantId` when playing.
- Set `secretWord` on snapshot **only when** `viewerParticipantId === drawerParticipantId`.
- For guessers or missing viewer id during playing, **omit** `secretWord` from JSON.

All room routes pass viewer id: create/join/start use acting `participantId`; GET uses `?participantId=` query.

**Rationale**: FR-008, constitution principle III; prevents guesser poll from receiving the word.

**Alternatives considered**: Send word encrypted client-side (rejected — security theater); send `null` for guessers (acceptable but omit field is clearer for leak tests).

## R5 — Game page polling

**Decision**: `GamePage` `useEffect` with `setInterval(2000)` calling `roomStore.fetchRoom()` while `room?.status === "playing"`, with cleanup on unmount.

**Rationale**: FR-009, user directive; keeps roles/word visibility in sync if state changes (future scenarios).

**Alternatives considered**: Poll only lobby (rejected — guessers would not refresh game shell).

## R6 — UI word and role display

**Decision**:

- Header/sidebar shows **You are drawing** vs **{name} is drawing** using `role` and `drawerParticipantId`.
- Drawer panel: labeled **Word to draw** showing `room.secretWord` when present on snapshot.
- Guessers: canvas placeholder + guess UI shell without word.

**Rationale**: FR-006, acceptance scenarios US2–US3.

## R7 — Testing approach

**Decision**:

- Backend Vitest: name rejection, `selectSecretWord` stability, `toRoomSnapshot` drawer-only word, host drawer on start.
- Frontend Vitest: API types; optional `GamePage` poll test with fake timers.
- Manual: two browsers per [quickstart.md](./quickstart.md); Network tab confirms guesser responses lack `secretWord`.

**Rationale**: Constitution two-browser + no-leak review discipline.

## Resolved unknowns

No `NEEDS CLARIFICATION` items remain. Scenario 3 owns canvas, guesses, and scoring.
