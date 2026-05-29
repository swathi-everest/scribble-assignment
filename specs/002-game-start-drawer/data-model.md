# Data Model: Scenario 2 — Game Start & Drawer Flow

**Date**: 2026-05-29  
**Spec**: [spec.md](./spec.md)  
**Builds on**: [Scenario 1 data model](../001-room-setup-lobby/data-model.md)

## Entity relationship

```text
Room 1──* Participant
Room ── hostParticipantId ──► Participant (host)
Room ── drawerParticipantId ──► Participant (drawer, when playing)
Room ── secretWord (internal, playing only)
```

## Room (extended)

| Field | Type | Rules |
|-------|------|--------|
| `code` | string | Unchanged; used for deterministic word index |
| `status` | `"lobby"` \| `"playing"` | Unchanged transitions |
| `hostParticipantId` | string | Unchanged; immutable in Scenario 2 |
| `drawerParticipantId` | string \| undefined | Set on start to `hostParticipantId`; round one only |
| `secretWord` | string \| undefined | Set on start from `STARTER_WORDS`; **never** exposed to non-drawer snapshots |
| `participants` | Participant[] | Unchanged storage |
| `createdAt` / `updatedAt` | ISO string | Bump on start |

**Invariants (playing)**

- Exactly one participant has `role === "drawer"` in snapshot (`id === drawerParticipantId`).
- All other participants have `role === "guesser"`.
- `drawerParticipantId === hostParticipantId` for round one.
- `secretWord ∈ STARTER_WORDS`.

## Participant (extended)

| Field | Type | Rules |
|-------|------|--------|
| `id` | string (UUID) | Unchanged |
| `name` | string | **Trimmed**; min length 1 after trim; no `"Player"` auto-fill for empty input |
| `joinedAt` | ISO string | Unchanged |

**Snapshot-only**

| Field | Type | Rules |
|-------|------|--------|
| `isHost` | boolean | Unchanged |
| `role` | `"drawer"` \| `"guesser"` | Present when `room.status === "playing"` |

## RoomSnapshot (viewer-scoped)

| Field | Type | When | Notes |
|-------|------|------|--------|
| `code` | string | Always | |
| `status` | `"lobby"` \| `"playing"` | Always | |
| `hostParticipantId` | string | Always | |
| `drawerParticipantId` | string | `playing` | Same as host in Scenario 2 |
| `secretWord` | string | `playing` + viewer is drawer | **Omitted** for guessers |
| `participants` | array | Always | Includes `role` when playing |
| `availableWords` | string[] | Always | Starter list (public) |
| `roles` | role[] | Always | Metadata |

## State transitions

```text
[Create / Join] (valid trimmed name)
    → participant appended with trimmed name

[Create / Join] (empty or whitespace-only name)
    → rejected; no room change / no new participant

[Start Game] (host, ≥2 players, lobby)
    → status = playing
    → drawerParticipantId = hostParticipantId
    → secretWord = deterministicPick(room.code)
    → participants assigned roles in snapshot

[GET /rooms/:code?participantId=drawerId]
    → snapshot includes secretWord

[GET /rooms/:code?participantId=guesserId]
    → snapshot excludes secretWord
```

## Validation rules (summary)

| Action | Validation |
|--------|------------|
| Create | `playerName` trim + min 1 char |
| Join | Code trim + min 1; `playerName` trim + min 1 |
| Start | Unchanged Scenario 1 guards + sets drawer/word |
| Fetch | Optional `participantId` drives snapshot filter |

## Deterministic word function

```text
index = (Σ charCode(room.code)) mod |STARTER_WORDS|
secretWord = STARTER_WORDS[index]
```

Words: `rocket`, `pizza`, `castle`, `guitar`, `sunflower`.

## Multi-room isolation

Drawer, secret word, and roles are per `Room` map entry. Room A's `secretWord` never appears in Room B's snapshot.
