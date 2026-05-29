# REST Contract: Rooms API (Scenario 3 delta)

**Base path**: `/api/rooms`  
**Date**: 2026-05-29  
**Baseline**: [Scenario 2 contract](../../002-game-start-drawer/contracts/rooms-api.md)

Scenario 3 adds **canvas mutations**, **guess submission**, and **playing-state snapshot fields** (`canvas`, `guesses`, `scores`). Scenario 2 rules (trimmed names, drawer-only `secretWord`, roles) remain unchanged.

Errors use `{ "message": string }`.

---

## RoomSnapshot (Scenario 3 fields)

When `status: "playing"`, all viewers receive:

| Field | Type | Notes |
|-------|------|--------|
| `canvas` | `{ strokes: CanvasStroke[] }` | Full drawing; same for drawer and guessers |
| `guesses` | `GuessRecord[]` | Ordered history |
| `scores` | `Record<string, number>` | participantId → score (non-negative) |

`secretWord` remains **drawer-only** (Scenario 2).

### CanvasStroke

```json
{
  "points": [[0.1, 0.2], [0.15, 0.25], [0.2, 0.3]],
  "color": "#000000",
  "lineWidth": 4
}
```

| Field | Rules |
|-------|--------|
| `points` | Array length ≥ 2; each point `[x, y]` with `0 <= x,y <= 1` |
| `color` | Non-empty string |
| `lineWidth` | Positive number (recommend Zod max 32) |

### GuessRecord

```json
{
  "id": "uuid",
  "participantId": "uuid",
  "participantName": "Bob",
  "text": "rocket",
  "isCorrect": true,
  "submittedAt": "2026-05-29T12:05:00.000Z"
}
```

---

## POST /:code/canvas/strokes

Append one stroke to the room canvas.

**Body**

| Field | Type | Required |
|-------|------|----------|
| `participantId` | string | Yes |
| `stroke` | CanvasStroke | Yes |

**Success** `200`

```json
{
  "room": { "...RoomSnapshot with updated canvas..." }
}
```

Uses viewer filter for `participantId` in response (same as GET).

**Errors**

| Status | Condition | Message (example) |
|--------|-----------|-------------------|
| 404 | Unknown room | `Unable to load room` |
| 400 | Not `playing` | `Game is not in progress` |
| 403 | Not drawer | `Only the drawer can draw` |
| 400 | Invalid stroke (Zod) | Validation message |

---

## POST /:code/canvas/clear

Remove all strokes from the room canvas.

**Body**

| Field | Type | Required |
|-------|------|----------|
| `participantId` | string | Yes |

**Success** `200`: `{ "room": RoomSnapshot }` with `canvas.strokes: []`.

**Errors**: Same permission model as append stroke (`403` if not drawer).

**Note**: Does not clear `guesses` or `scores`.

---

## POST /:code/guesses

Submit a guess for the active round.

**Body**

| Field | Type | Required | Rules |
|-------|------|----------|--------|
| `participantId` | string | Yes | Must be guesser |
| `guessText` | string | Yes | Trimmed; min 1 char after trim |

**Success** `200`

```json
{
  "room": { "...RoomSnapshot with new guess and possibly updated scores..." }
}
```

**Errors**

| Status | Condition | Message (example) |
|--------|-----------|-------------------|
| 404 | Unknown room | `Unable to load room` |
| 400 | Not `playing` | `Game is not in progress` |
| 403 | Drawer submits | `The drawer cannot submit guesses` |
| 400 | Empty after trim | `Guess cannot be empty` |

Response never includes the secret word in a separate field; clients infer correctness from `guesses[].isCorrect` and `scores`.

---

## POST /:code/start (behavior delta)

On success, in addition to Scenario 2 fields:

- `canvas.strokes` → `[]`
- `guesses` → `[]`
- `scores` → each participant id mapped to `0`

---

## GET /:code (game poll)

Unchanged URL. Response when `playing` includes `canvas`, `guesses`, `scores` for all viewers.

**Query**: `participantId` still required for correct `secretWord` filtering.

---

## Zod schemas (implementation reference)

| Schema | Purpose |
|--------|---------|
| `canvasStrokeSchema` | points, color, lineWidth |
| `appendStrokeSchema` | participantId + stroke |
| `clearCanvasSchema` | participantId |
| `submitGuessSchema` | participantId + `guessText: z.string().trim().min(1, "Guess cannot be empty")` |

---

## Client usage (React)

| UI action | API call | Notes |
|-----------|----------|--------|
| Drawer stroke end | `POST .../canvas/strokes` | Optimistic local render + POST |
| Drawer clear | `POST .../canvas/clear` | Reset local + server |
| Guesser submit | `POST .../guesses` | Show API error on 400 |
| Game poll (~2s) | `GET ...?participantId=` | Sync canvas, guesses, scores |
| Guesser view | Poll only | No stroke POST |

Frontend: `DrawingCanvas.tsx`, `GuessForm.tsx`, `Scoreboard.tsx`, `ResultPanel.tsx`, `GamePage.tsx`, `api.ts`, `roomStore.ts`.
