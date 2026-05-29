# Data Model: Scenario 1 — Room Setup & Lobby

**Date**: 2026-05-29  
**Spec**: [spec.md](./spec.md)

## Entity relationship

```text
Room 1──* Participant
Room ── hostParticipantId ──► Participant (exactly one host)
```

## Room

| Field | Type | Rules |
|-------|------|--------|
| `code` | string | Unique; 4 chars from starter alphabet; stored uppercase |
| `status` | `"lobby"` \| `"playing"` | `lobby` until host starts; `playing` after successful start |
| `hostParticipantId` | string | Set on create to creator's id; immutable in Scenario 1 |
| `participants` | Participant[] | Ordered list; append on join |
| `createdAt` | ISO string | Set on create |
| `updatedAt` | ISO string | Bump on join, start, save |

**Invariants**

- Exactly one participant where `id === hostParticipantId` while in lobby.
- `participants.length >= 1` after create.
- Rooms keyed by `code` in isolated map entries (FR-006).

## Participant

| Field | Type | Rules |
|-------|------|--------|
| `id` | string (UUID) | Stable for session; returned at create/join |
| `name` | string | Display name; default `"Player"` if omitted (Scenario 1) |
| `joinedAt` | ISO string | Set at join/create |

**Snapshot-only (API response)**

| Field | Type | Rules |
|-------|------|--------|
| `isHost` | boolean | `participant.id === room.hostParticipantId` |

## RoomSnapshot (client-facing)

Extends public room view for lobby/game shell:

| Field | Type | Notes |
|-------|------|--------|
| `code` | string | |
| `status` | `"lobby"` \| `"playing"` | |
| `hostParticipantId` | string | For permission checks in UI |
| `participants` | Participant + `isHost`[] | |
| `availableWords` | string[] | Starter seed (unchanged Scenario 1) |
| `roles` | `("drawer"\|"guesser")[]` | Placeholder for later scenarios |

**Scenario 1**: Do not expose secret word or scores in snapshot.

## State transitions

```text
[Create Room]
    → status = lobby, host = creator, participants = [creator]

[Join Room] (valid code)
    → append participant (status unchanged)

[Start Game] (host, participants.length >= 2, status = lobby)
    → status = playing

[Start Game] (non-host OR < 2 players OR already playing)
    → no transition; error returned
```

## Validation rules (summary)

| Action | Validation |
|--------|------------|
| Create | Optional `playerName` → default name |
| Join | Code trim + non-empty; room must exist |
| Fetch | Code + optional `participantId` query |
| Start | Host id required; min 2 participants; lobby only |

## Multi-room isolation

Each `code` maps to one `Room` instance. No shared participant arrays across codes. Operations on code `A` never read/write map entry for code `B`.
