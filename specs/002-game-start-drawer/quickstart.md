# Quickstart: Scenario 2 — Game Start & Drawer Flow

**Prerequisites**: Scenario 1 complete (lobby, host start, isolation). Node 18+, two browsers.

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

Focus: name validation, `selectSecretWord`, snapshot omits `secretWord` for guessers.

## Build gate

```bash
cd backend && npm run build
cd frontend && npm run build
```

## Two-browser validation checklist

### 1. Name validation

- [ ] Create room with name `   ` → error message, stay on create screen
- [ ] Join with whitespace-only name → error, stay on join screen
- [ ] Create with `  Pat  ` → lobby shows **Pat** (no leading/trailing spaces)

### 2. Start and roles

- [ ] Host + guest in lobby (2 valid names) → host **Start** → both on game page
- [ ] Host UI shows drawer role (e.g. “You are drawing”)
- [ ] Guest UI shows host/drawer name as guesser (not drawing)

### 3. Secret word visibility

- [ ] **Drawer browser**: sees **Word to draw** with a word from the starter list
- [ ] **Guesser browser**: does **not** show the secret word anywhere
- [ ] Guesser DevTools → Network → `GET /rooms/...` response JSON has **no** `secretWord` field

### 4. Deterministic word

- [ ] Note room code (e.g. `ABCD`); restart backend if needed, recreate same code is not possible — instead: start game in room A, note word; in a fresh session create until you document word for a fixed code pattern, or run unit test `selectSecretWord`
- [ ] Lab check: run backend test asserting same code → same word

### 5. Game polling

- [ ] On game page, without manual refresh, role labels remain correct after ~2s (no errors in console)
- [ ] Drawer still sees word after poll interval

### 6. Regression (Scenario 1)

- [ ] Empty join code still rejected
- [ ] Non-host cannot start
- [ ] Two rooms remain isolated

## Done when

All checklist items pass and both builds succeed.
