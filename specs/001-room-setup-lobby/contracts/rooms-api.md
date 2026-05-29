# REST Contract: Rooms API

**Base path**: `/api/rooms` (mounted under Express app)  
**Date**: 2026-05-29  
**Content-Type**: `application/json`

Errors use `{ "message": string }` unless noted.

## POST /

Create a room. Creator becomes host.

**Request body**

```json
{
  "playerName": "Alice"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|--------|
| `playerName` | string | No | Defaults to `"Player"` if omitted/empty in service |

**Response** `201`

```json
{
  "participantId": "uuid",
  "room": { /* RoomSnapshot */ }
}
```

**RoomSnapshot** (Scenario 1 fields)

```json
{
  "code": "ABCD",
  "status": "lobby",
  "hostParticipantId": "uuid",
  "participants": [
    {
      "id": "uuid",
      "name": "Alice",
      "joinedAt": "2026-05-29T12:00:00.000Z",
      "isHost": true
    }
  ],
  "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
  "roles": ["drawer", "guesser"]
}
```

---

## POST /:code/join

Join an existing room. `:code` is case-insensitive (normalized uppercase).

**Request body**

```json
{
  "playerName": "Bob"
}
```

**Response** `200`

```json
{
  "participantId": "uuid",
  "room": { /* RoomSnapshot */ }
}
```

**Errors**

| Status | Condition | Message (example) |
|--------|-----------|-------------------|
| 400 | Empty/whitespace code after trim | `Invalid request payload` (Zod) |
| 404 | Room not found | `Unable to join room` |

---

## GET /:code

Fetch current room snapshot (lobby poll target).

**Query**

| Param | Required | Notes |
|-------|----------|--------|
| `participantId` | No | Reserved for viewer-scoped fields in later scenarios |

**Response** `200`

```json
{
  "room": { /* RoomSnapshot */ }
}
```

**Errors**

| Status | Condition |
|--------|-----------|
| 400 | Invalid code param |
| 404 | Room not found |

---

## POST /:code/start *(new — Scenario 1)*

Host starts the game. Transitions room to `playing`.

**Request body**

```json
{
  "participantId": "uuid"
}
```

| Field | Type | Required |
|-------|------|----------|
| `participantId` | string | Yes |

**Response** `200`

```json
{
  "room": { /* RoomSnapshot with status "playing" */ }
}
```

**Errors**

| Status | Condition | Message (example) |
|--------|-----------|-------------------|
| 400 | Fewer than 2 participants | `At least two players are required` |
| 400 | Already playing | `Game has already started` |
| 400 | Invalid body (Zod) | `Invalid request payload` |
| 403 | Caller is not host | `Only the host can start the game` |
| 404 | Room not found | `Unable to load room` |

---

## Zod schemas (implementation reference)

| Schema | Purpose |
|--------|---------|
| `createRoomSchema` | Optional `playerName` |
| `joinRoomSchema` | Optional `playerName` |
| `normalizedRoomCodeParamsSchema` | Trim `:code`, min length 1 |
| `startGameSchema` | `{ participantId: string().min(1) }` |
| `roomViewerQuerySchema` | Optional `participantId` on GET |

---

## Client usage (React + Vite)

| UI action | API call |
|-----------|----------|
| Create room | `POST /rooms` |
| Join room | `POST /rooms/:code/join` |
| Lobby poll (~2s) | `GET /rooms/:code?participantId=...` |
| Host start | `POST /rooms/:code/start` |

Frontend module: `frontend/src/services/api.ts`  
State: `frontend/src/state/roomStore.ts`
