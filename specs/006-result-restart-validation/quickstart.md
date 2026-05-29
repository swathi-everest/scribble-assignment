# Quickstart: Scenario 4 — Result, Restart & Final Validation

**Prerequisites**: Scenarios 1–3 complete (lobby, start, drawer word, canvas, guesses, scores, 2s game poll). Node 18+, two browsers.

## Run locally

**Terminal 1 — backend**

```bash
cd backend && npm install && npm run dev
```

**Terminal 2 — frontend**

```bash
cd frontend && npm install && npm run dev
```

## Automated tests

```bash
cd backend && npm test
cd frontend && npm test
```

Focus: `endRound`/`restartRoom` permissions, result snapshot reveals word to guesser, restart clears round fields, roster preserved.

## Build gate

```bash
cd backend && npm run build
cd frontend && npm run build
```

## Two-browser validation checklist

### Setup

- [ ] Host creates room; guest joins; host starts → both on **game** page
- [ ] Play briefly: drawer draws; guesser submits at least one correct and one incorrect guess
- [ ] Confirm guesser does **not** see secret word during `playing`

### 1. End round → result

- [ ] Host clicks **End round** (or equivalent)
- [ ] Both browsers land on **result** view within ~3s (poll or navigation)
- [ ] **Both** see the same revealed correct word
- [ ] **Both** see matching final scoreboard
- [ ] **Both** see full guess history (same rows, order, outcomes)
- [ ] Empty-history case (optional): end round with no guesses → explicit empty history message

### 2. Result sync

- [ ] Refresh or wait one poll cycle — values unchanged (frozen)
- [ ] Guesser cannot restart (no button or API 403)
- [ ] Non-host calling restart API returns 403 without state change

### 3. Restart → lobby

- [ ] Host clicks **Restart**
- [ ] Both browsers return to **lobby** within ~3s
- [ ] Same player names/ids present (roster preserved)
- [ ] Lobby shows no secret word, scores, guesses, or canvas data
- [ ] Host can **Start game** again for a fresh round (optional smoke)

### 4. Invalid transitions

- [ ] `restart` from lobby or playing → 400, no mutation
- [ ] `end-round` from lobby or result → 400, no mutation
- [ ] Canvas/guess POST while in `result` → 400

### 5. Multi-room isolation (spot check)

- [ ] Second room in lobby unaffected when first room ends/restarts

## Success criteria mapping

| Criterion | Checklist section |
|-----------|-------------------|
| SC-001 | §1 Result parity (word, scores, history) |
| SC-002 | §3 Restart → lobby timing |
| SC-003 | §2–§4 Permission and phase guards |
| SC-004 | §3 Roster preserved + round data cleared |

## Next step

Run **`/speckit-tasks`** to generate implementation tasks from [plan.md](./plan.md).
