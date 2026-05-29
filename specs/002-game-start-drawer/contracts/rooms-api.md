# REST Contract: Rooms API (Scenario 2 delta)

**Base path**: `/api/rooms`  
**Date**: 2026-05-29  
**Baseline**: [Scenario 1 contract](../../001-room-setup-lobby/contracts/rooms-api.md)

Scenario 2 changes **player name rules**, **playing-state snapshot fields**, and **viewer-scoped `secretWord`**. Start-game authorization rules are unchanged from Scenario 1.

Errors use `{ "message": string }`.

---

## Shared: `playerName` validation

Applies to **POST /** and **POST /:code/join**.

| Field | Type | Required | Rules |
|-------|------|----------|--------|
| `playerName` | string | **Yes** | Trimmed; minimum 1 character after trim |

**Errors**

| Status | Condition | Message (example) |
|--------|-----------|-------------------|
| 400 | Missing, empty, or whitespace-only after trim | `Player name is required` |

**Example valid body**

```json
{
  "playerName": "  Alex  "
}
```

Stored name: `"Alex"`.

---

## RoomSnapshot (Scenario 2 fields)

All endpoints returning `room` use **viewer-scoped** snapshots when `participantId` is supplied (create/join/start body; GET query).

### Lobby (`status: "lobby"`)

Same as Scenario 1. No `drawerParticipantId`, `secretWord`, or participant `role`.

### Playing (`status: "playing"`)

**Always present**

| Field | Type | Notes |
|-------|------|--------|
| `drawerParticipantId` | string | Host participant id for round one |
| `participants[].role` | `"drawer"` \| `"guesser"` | Derived per participant |

**Viewer-dependent**

| Field | Type | Visible to |
|-------|------|------------|
| `secretWord` | string | **Drawer only** (`participantId === drawerParticipantId`) |

Guessers MUST NOT receive `secretWord` in the JSON payload (field absent).

**Example — drawer response**

```json
{
  "code": "ABCD",
  "status": "playing",
  "hostParticipantId": "host-uuid",
  "drawerParticipantId": "host-uuid",
  "secretWord": "rocket",
  "participants": [
    {
      "id": "host-uuid",
      "name": "Alex",
      "joinedAt": "2026-05-29T12:00:00.000Z",
      "isHost": true,
      "role": "drawer"
    },
    {
      "id": "guest-uuid",
      "name": "Bob",
      "joinedAt": "2026-05-29T12:01:00.000Z",
      "isHost": false,
      "role": "guesser"
    }
  ],
  "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
  "roles": ["drawer", "guesser"]
}
```

**Example — guesser response** (same room; note missing `secretWord`)

```json
{
  "code": "ABCD",
  "status": "playing",
  "hostParticipantId": "host-uuid",
  "drawerParticipantId": "host-uuid",
  "participants": [ "... same with roles ..." ],
  "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
  "roles": ["drawer", "guesser"]
}
```

---

## POST /:code/start (behavior delta)

On success, in addition to `status: "playing"`:

1. `drawerParticipantId` ← `hostParticipantId`
2. `secretWord` ← deterministic pick from `STARTER_WORDS` using room `code`
3. Participant roles assigned in snapshot

Response uses viewer filter for requesting `participantId`.

**Errors**: Unchanged from Scenario 1 (403 non-host, 400 &lt;2 players, etc.).

---

## GET /:code (game poll)

**Query**

| Param | Required | Notes |
|-------|----------|--------|
| `participantId` | **Strongly recommended** | Required for correct `secretWord` filtering in Scenario 2 |

**Response** `200`: `{ "room": RoomSnapshot }` per viewer rules above.

---

## Zod schemas (implementation reference)

| Schema | Scenario 2 change |
|--------|-------------------|
| `createRoomSchema` | `playerName: z.string().trim().min(1, "Player name is required")` |
| `joinRoomSchema` | Same as create |
| Others | Unchanged |

---

## Client usage (React)

| UI action | API call | Notes |
|-----------|----------|--------|
| Create room | `POST /rooms` | Required trimmed name |
| Join room | `POST /rooms/:code/join` | Required trimmed name |
| Game poll (~2s) | `GET /rooms/:code?participantId=...` | **Must** pass viewer id |
| Host start | `POST /rooms/:code/start` | Returns filtered snapshot |

Frontend: `frontend/src/services/api.ts`, `frontend/src/state/roomStore.ts`, `frontend/src/pages/GamePage.tsx`.
