# Data Model: Scenario 4 — Result, Restart & Final Validation

**Date**: 2026-05-29  
**Spec**: [spec.md](./spec.md)  
**Builds on**: [Scenario 3 data model](../003-gameplay-interaction/data-model.md)

## Entity relationship

```text
Room 1──* Participant
Room ── hostParticipantId ──► Participant
Room ── drawerParticipantId ──► Participant (playing only)
Room ── secretWord (internal; drawer-only in playing, all viewers in result)
Room ── canvasStrokes[], guesses[], scores (playing; cleared on restart)
```

## RoomStatus (extended)

| Value | Meaning |
|-------|---------|
| `lobby` | Waiting; no active round data |
| `playing` | Round in progress (Scenario 3 rules) |
| `result` | Round ended; frozen outcome visible to all |

## Room (extended)

| Field | Type | Rules |
|-------|------|--------|
| `status` | `RoomStatus` | Now includes `"result"` |
| `secretWord` | string \| undefined | Set on start; visible to all in `result` snapshot; cleared on restart |
| `drawerParticipantId` | string \| undefined | Set on start; cleared on restart |
| `canvasStrokes` | CanvasStroke[] | Playing only; cleared on restart |
| `guesses` | GuessRecord[] | Playing + frozen in result; cleared on restart |
| `scores` | `Record<string, number>` | Playing + frozen in result; cleared on restart |

**Invariants (result)**

- No append to `guesses`, no score changes, no canvas mutations.
- `secretWord` MUST appear in every viewer’s snapshot.
- `guesses` order is immutable copy of final playing order.

**Invariants (lobby after restart)**

- No `secretWord`, `drawerParticipantId`, `canvasStrokes`, `guesses`, or `scores` in snapshot or internal room.
- `participants` unchanged from pre-restart roster (same ids).

## RoomSnapshot (result)

| Field | Type | When | Notes |
|-------|------|------|--------|
| `status` | `"result"` | result | |
| `secretWord` | string | result | **All** viewers (FR-002) |
| `guesses` | GuessRecord[] | result | Full ordered history |
| `scores` | `Record<string, number>` | result | Final scoreboard |
| `participants` | ParticipantSnapshot[] | result | No `role` required (round over) |
| `canvas` | — | omitted | Not required for result display |

## RoomSnapshot (playing) — unchanged

- `secretWord` only for drawer viewer.
- `canvas`, `guesses`, `scores` for all viewers.

## State transitions

```text
lobby ──startGame(host)──► playing
playing ──endRound(host)──► result
result ──restartRoom(host)──► lobby
```

**Invalid transitions** (reject, no mutation):

```text
lobby ──endRound──► ✗
lobby ──restart──► ✗
playing ──restart──► ✗
result ──endRound──► ✗
result ──startGame──► ✗ (use restart then start)
playing ──startGame──► ✗ (already playing)
result ──appendStroke/submitGuess──► ✗
```

## Service operations

### `endRound(code, participantId)`

| Precondition | Postcondition |
|--------------|---------------|
| Room exists | `status = "result"` |
| `status === "playing"` | `guesses`, `scores`, `secretWord` unchanged |
| Caller is host | |

### `restartRoom(code, participantId)`

| Precondition | Postcondition |
|--------------|---------------|
| Room exists | `status = "lobby"` |
| `status === "result"` | Round fields cleared (see R3 in research.md) |
| Caller is host | Participants preserved |

## Key entities (spec mapping)

| Spec entity | Implementation |
|-------------|----------------|
| Room Result Snapshot | `toRoomSnapshot` when `status === "result"` |
| Player Roster | `room.participants` preserved across restart |
| Round State | Fields cleared on `restartRoom` |
| Restart Action | `POST /restart` + `restartRoom` service |
