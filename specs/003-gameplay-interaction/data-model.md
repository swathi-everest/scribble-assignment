# Data Model: Scenario 3 — Gameplay Interaction

**Date**: 2026-05-29  
**Spec**: [spec.md](./spec.md)  
**Builds on**: [Scenario 2 data model](../002-game-start-drawer/data-model.md)

## Entity relationship

```text
Room 1──* Participant
Room ── drawerParticipantId ──► Participant
Room ── secretWord (internal, drawer snapshot only)
Room ── canvasStrokes[] (ordered strokes)
Room ── guesses[] (ordered GuessRecord)
Room ── scores{ participantId → number }
```

## Room (extended)

| Field | Type | Rules |
|-------|------|--------|
| `code` | string | Unchanged |
| `status` | `"lobby"` \| `"playing"` | Unchanged |
| `hostParticipantId` | string | Unchanged |
| `drawerParticipantId` | string \| undefined | Set on start (Scenario 2) |
| `secretWord` | string \| undefined | Set on start; never in non-drawer snapshot |
| `participants` | Participant[] | Unchanged |
| `canvasStrokes` | CanvasStroke[] | Init `[]` on start; drawer append/clear only |
| `guesses` | GuessRecord[] | Init `[]` on start; append on each accepted guess |
| `scores` | `Record<string, number>` | Init `0` per participant on start |
| `createdAt` / `updatedAt` | ISO string | Bump on mutations |

**Invariants (playing)**

- Only `drawerParticipantId` may mutate `canvasStrokes`.
- Only non-drawer participants may append to `guesses`.
- `scores[participantId] >= 0` always.
- Each correct guess increases submitter score by exactly **100**; incorrect by **0**.
- `secretWord` never appears in snapshot unless viewer is drawer.

## CanvasStroke

| Field | Type | Rules |
|-------|------|--------|
| `points` | `[number, number][]` | Min 2 points; each coordinate in `[0, 1]` (fraction of canvas) |
| `color` | string | CSS color (e.g. `#000000`) |
| `lineWidth` | number | Positive; max cap in Zod (e.g. 1–32) |

**Snapshot shape**: `canvas: { strokes: CanvasStroke[] }`

## GuessRecord

| Field | Type | Rules |
|-------|------|--------|
| `id` | string (UUID) | Server-generated |
| `participantId` | string | Submitter |
| `participantName` | string | Denormalized from participant at submit time |
| `text` | string | Trimmed guess text stored for history |
| `isCorrect` | boolean | From case-insensitive compare to `secretWord` |
| `submittedAt` | ISO string | Server timestamp |

## Participant / snapshot

Unchanged from Scenario 2 (`role`, `isHost`, etc.).

## RoomSnapshot (playing, extended)

| Field | Type | When | Notes |
|-------|------|------|--------|
| `canvas` | `{ strokes: CanvasStroke[] }` | `playing` | Same for all viewers |
| `guesses` | `GuessRecord[]` | `playing` | Ordered oldest→newest |
| `scores` | `Record<string, number>` | `playing` | Key = participantId |
| `secretWord` | string | `playing` + viewer is drawer | Unchanged Scenario 2 rule |
| `drawerParticipantId` | string | `playing` | Unchanged |

Lobby snapshots omit `canvas`, `guesses`, `scores`.

## State transitions

```text
[Start Game] (Scenario 2 guards)
    → status = playing
    → drawerParticipantId, secretWord set
    → canvasStrokes = []
    → guesses = []
    → scores[each participantId] = 0

[Append Stroke] (drawer, playing)
    → push stroke onto canvasStrokes

[Clear Canvas] (drawer, playing)
    → canvasStrokes = []
    → guesses and scores unchanged

[Submit Guess] (guesser, playing, non-empty trimmed text)
    → append GuessRecord
    → if correct: scores[participantId] += 100

[Submit Guess] (drawer OR empty after trim)
    → rejected; no state change

[GET /rooms/:code?participantId=...] (playing)
    → snapshot includes canvas, guesses, scores
    → secretWord only if viewer is drawer

[Poll ~2s on GamePage]
    → all clients refresh snapshot fields above
```

## Validation rules (summary)

| Action | Validation |
|--------|------------|
| Append stroke | Playing; participant is drawer; stroke schema |
| Clear canvas | Playing; participant is drawer |
| Submit guess | Playing; participant is guesser; trim + min 1 char |
| Compare | `trim(guess).toLowerCase() === secretWord.toLowerCase()` |
| Start | Init canvas/guesses/scores as above |

## Deferred (Scenario 4)

- `status: "result"` or similar
- Clearing round state on host restart
- Revealing `secretWord` to all players at round end
