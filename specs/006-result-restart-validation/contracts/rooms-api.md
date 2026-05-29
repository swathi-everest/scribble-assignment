# REST Contract: Rooms API (Scenario 4 delta)

**Base path**: `/api/rooms`  
**Date**: 2026-05-29  
**Baseline**: [Scenario 3 contract](../../003-gameplay-interaction/contracts/rooms-api.md)

Scenario 4 adds **`result` room status**, **end round**, and **restart** endpoints. Scenario 3 canvas/guess rules remain; they return **400** when `status !== "playing"`.

Errors use `{ "message": string }`.

---

## RoomStatus (extended)

```ts
type RoomStatus = "lobby" | "playing" | "result";
```

---

## RoomSnapshot (Scenario 4 — `result`)

When `status: "result"`, **all** viewers receive:

| Field | Type | Notes |
|-------|------|--------|
| `secretWord` | string | Revealed correct word (FR-002) |
| `guesses` | `GuessRecord[]` | Complete ordered history |
| `scores` | `Record<string, number>` | Final scoreboard |

`secretWord` is **not** included for non-drawer viewers when `status: "playing"` (Scenario 2/3 unchanged).

`canvas` is omitted in `result` snapshots.

### Example (result)

```json
{
  "code": "ABCD",
  "status": "result",
  "hostParticipantId": "uuid-host",
  "participants": [
    { "id": "uuid-host", "name": "Alice", "isHost": true, "joinedAt": "..." },
    { "id": "uuid-guest", "name": "Bob", "isHost": false, "joinedAt": "..." }
  ],
  "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
  "roles": ["drawer", "guesser"],
  "secretWord": "rocket",
  "guesses": [
    {
      "id": "guess-1",
      "participantId": "uuid-guest",
      "participantName": "Bob",
      "text": "car",
      "isCorrect": false,
      "submittedAt": "2026-05-29T12:05:00.000Z"
    }
  ],
  "scores": {
    "uuid-host": 0,
    "uuid-guest": 100
  }
}
```

---

## POST /:code/end-round

Host ends the active round and moves the room to **result**.

**Body**

| Field | Type | Required |
|-------|------|----------|
| `participantId` | string | Yes |

**Success** `200`

```json
{
  "room": { "...RoomSnapshot with status result, secretWord revealed..." }
}
```

**Errors**

| Status | Condition | Message (example) |
|--------|-----------|-------------------|
| 404 | Unknown room | `Unable to load room` |
| 403 | Not host | `Only the host can end the round` |
| 400 | Not `playing` | `Game is not in progress` |

**Side effects**: `status` → `"result"`; `guesses`, `scores`, `secretWord`, `canvasStrokes` unchanged (frozen).

---

## POST /:code/restart

Host resets the room to **lobby** after results.

**Body**

| Field | Type | Required |
|-------|------|----------|
| `participantId` | string | Yes |

**Success** `200`

```json
{
  "room": { "...RoomSnapshot with status lobby, no round fields..." }
}
```

**Errors**

| Status | Condition | Message (example) |
|--------|-----------|-------------------|
| 404 | Unknown room | `Unable to load room` |
| 403 | Not host | `Only the host can restart the game` |
| 400 | Not `result` | `Room is not in result state` |

**Side effects**:

- `status` → `"lobby"`
- Clear: `secretWord`, `drawerParticipantId`, `canvasStrokes`, `guesses`, `scores`
- Preserve: `code`, `hostParticipantId`, `participants`

---

## GET /:code (poll)

Unchanged URL. When `status: "result"`, response includes revealed `secretWord`, `guesses`, `scores` for all viewers.

**Query**: `participantId` still accepted (consistent with existing API).

---

## POST /:code/start (behavior delta)

Reject start when `status === "result"` (same as already-playing):

| Status | Condition | Message (example) |
|--------|-----------|-------------------|
| 400 | `playing` or `result` | `Game has already started` |

---

## Scenario 3 endpoints (unchanged paths, stricter phase)

| Endpoint | Valid when |
|----------|------------|
| `POST .../canvas/strokes` | `playing` only |
| `POST .../canvas/clear` | `playing` only |
| `POST .../guesses` | `playing` only |

When `status === "result"`, return **400** `Game is not in progress`.

---

## Zod schemas (implementation reference)

| Schema | Purpose |
|--------|---------|
| `endRoundSchema` | `{ participantId: z.string().uuid() }` (or existing id pattern) |
| `restartSchema` | `{ participantId: z.string().uuid() }` |

---

## Client usage (React)

| UI action | API call | Route |
|-----------|----------|--------|
| Host End round | `POST .../end-round` | `/game` |
| Result poll (~2s) | `GET ...?participantId=` | `/result` |
| Host Restart | `POST .../restart` | `/result` |
| Lobby poll | `GET` | `/lobby` |

Frontend files: `ResultPage.tsx`, `GamePage.tsx`, `LobbyPage.tsx`, `api.ts`, `roomStore.ts`, `routes/index.tsx`.
