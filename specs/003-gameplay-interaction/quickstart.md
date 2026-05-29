# Quickstart: Scenario 3 — Gameplay Interaction

**Prerequisites**: Scenarios 1–2 complete (lobby, start, drawer word, 2s game poll). Node 18+, two browsers.

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

Focus: drawer-only canvas, guess trim/case/scoring, snapshot fields, room isolation.

## Build gate

```bash
cd backend && npm run build
cd frontend && npm run build
```

## Two-browser validation checklist

### Setup

- [ ] Host creates room; guest joins; host starts → both on game page
- [ ] Note secret word on **drawer** browser only (from Scenario 2)

### 1. Canvas — drawer

- [ ] Drawer draws strokes → visible immediately on drawer screen (no manual refresh)
- [ ] Drawer clicks **Clear** → canvas empty on drawer screen
- [ ] Drawer draws again after clear

### 2. Canvas — guesser & sync

- [ ] Guesser cannot draw (no stroke sent / read-only canvas)
- [ ] After drawer draws, guesser sees matching drawing within ~3s (poll)
- [ ] After drawer clears, guesser sees empty canvas within ~3s; guess history unchanged

### 3. Guesses — validation

- [ ] Guesser submits `  rocket  ` (matching word) → correct in history; score +100
- [ ] Guesser submits `ROCKET` → correct; cumulative +100 if allowed again
- [ ] Guesser submits `   ` → error message; no new history row
- [ ] Guesser submits wrong word → incorrect in history; score unchanged

### 4. Guesses — permissions

- [ ] Drawer cannot submit guess (UI hidden or API 403)
- [ ] Guesser DevTools: guess `POST` as drawer returns 403

### 5. Shared state

- [ ] Immediately after start, both browsers show all scores **0**
- [ ] After guess, both show same history entry (name, trimmed text, correct/incorrect) within ~3s
- [ ] After correct guess, both show same updated score within ~3s

### 6. Secret word & isolation

- [ ] Guesser poll JSON still has **no** `secretWord`
- [ ] Second room in playing state unchanged when first room submits guesses

### 7. Regression (Scenarios 1–2)

- [ ] Whitespace-only player name still rejected on create/join
- [ ] Non-host cannot start
- [ ] Drawer still sees word after poll

## Done when

All checklist items pass and both builds succeed.
