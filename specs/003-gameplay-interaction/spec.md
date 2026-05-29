# Feature Specification: Scenario 3 — Gameplay Interaction

**Feature Branch**: `004-gameplay-interaction`

**Created**: 2026-05-29

**Status**: Draft

**Input**: Implement Scenario 3 — Gameplay Interaction. Given a round is active with a
drawer and guessers (all scores start at 0), When the drawer draws/clears the canvas
and guessers submit their guesses, Then the drawing is visible on the drawer's screen;
guesses are trimmed, case-insensitively compared, and empty ones rejected; the guess
history is synced to all players via polling; correct guesses score 100 (incorrect add
0).

**Constitution**: `.specify/memory/constitution.md` — scenario acceptance criteria and
edge cases belong in this spec, not in the constitution.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Drawer Draws and Clears the Canvas (Priority: P1)

While a round is active, the designated drawer can draw on the game canvas and see their
strokes appear on their screen. They can clear the canvas to remove all drawing content
and start over. Only the drawer may draw or clear; guessers cannot modify the canvas.

**Why this priority**: Drawing is the core mechanic that enables guessers to infer the
secret word; without a working canvas the round cannot be played.

**Independent Test**: Start a two-player game; as the drawer, add strokes and confirm
they appear on the drawer screen, clear the canvas and confirm it is empty, then draw
again. As the guesser, confirm drawing actions are rejected.

**Acceptance Scenarios**:

1. **Given** an active round and the viewer is the drawer, **When** they draw on the
   canvas, **Then** the drawing is visible on the drawer's screen without requiring a
   manual page refresh.
2. **Given** an active round and the canvas has drawing content, **When** the drawer
   clears the canvas, **Then** the canvas is empty on the drawer's screen.
3. **Given** an active round and the viewer is a guesser, **When** they attempt to draw
   or clear the canvas, **Then** the action is rejected and the canvas state does not
   change from their input.
4. **Given** an active round with drawing on the canvas, **When** any participant
   receives updated room state through automatic refresh, **Then** they see the current
   drawing consistent with the drawer's canvas (so guessers can see what to guess from).

---

### User Story 2 - Guessers Submit Validated Guesses (Priority: P1)

While a round is active, each guesser can submit a text guess. The system trims leading
and trailing whitespace, rejects guesses that are empty after trimming with a clear
message, and compares the trimmed guess to the secret word without regard to letter
case. The drawer cannot submit guesses.

**Why this priority**: Guessing with fair validation is the other half of gameplay and
directly tied to scoring.

**Independent Test**: As a guesser, submit `"  rocket  "`, `"ROCKET"`, `"  "`, and
`"pizza"` against a known secret word; confirm trim/case behavior, empty rejection, and
correct vs incorrect outcomes.

**Acceptance Scenarios**:

1. **Given** an active round and the viewer is a guesser, **When** they submit a guess
   with leading or trailing spaces around the word, **Then** the guess is evaluated
   using the trimmed text.
2. **Given** an active round and the secret word is `rocket`, **When** a guesser
   submits `Rocket` or `ROCKET` after trimming, **Then** the guess is treated as
   correct.
3. **Given** an active round, **When** a guesser submits a guess that is empty or
   whitespace-only after trimming, **Then** the submission is rejected with a clear
   error message and no new guess is recorded.
4. **Given** an active round and the viewer is the drawer, **When** they attempt to
   submit a guess, **Then** the submission is rejected.
5. **Given** an active round, **When** a guesser submits a guess that does not match
   the secret word (after trim and case-insensitive compare), **Then** the guess is
   recorded as incorrect and does not reveal the secret word beyond normal gameplay.

---

### User Story 3 - Shared Guess History and Scores via Polling (Priority: P2)

All participants in an active round see the same ordered guess history (who guessed what
and whether each guess was correct or incorrect). Player scores start at zero when the
round begins; each correct guess adds 100 points to that guesser's total, and each
incorrect guess adds 0. Updates appear for all players through automatic state refresh
(approximately every 2 seconds, consistent with lobby and game polling).

**Why this priority**: Synchronized history and scoring make multiplayer play fair and
observable; polling is the lab's agreed sync model.

**Independent Test**: Two browsers in the same room; guesser A submits correct and
incorrect guesses; within one refresh cycle both sessions show the same history and
updated scores (100 for correct, 0 change for incorrect).

**Acceptance Scenarios**:

1. **Given** a round has just become active, **When** any participant views scores,
   **Then** every player's score is 0.
2. **Given** an active round, **When** a guesser submits a correct guess, **Then** that
   guesser's score increases by 100 and every participant eventually sees the same
   updated score.
3. **Given** an active round, **When** a guesser submits an incorrect guess, **Then**
   that guesser's score does not change and every participant eventually sees the same
   guess marked incorrect in history.
4. **Given** two or more participants in the same room, **When** any guesser submits a
   guess, **Then** within approximately 3 seconds all participants see the same new
   entry in guess history (guesser identity, guess text as stored after trim, and
   correct/incorrect outcome).
5. **Given** two rooms each in an active round, **When** guesses are submitted in one
   room, **Then** the other room's guess history and scores are unchanged.

---

### Edge Cases

- What happens when the drawer clears the canvas after guessers have started guessing?
  The canvas becomes empty for everyone on the next sync; existing guess history and
  scores are preserved.
- What happens when the same guesser submits multiple guesses in one round? Each
  non-empty submission is recorded in history; each correct submission adds 100 points
  (cumulative per correct guess in this scenario).
- What happens when a guesser submits the correct word with extra internal spaces (e.g.
  `"roc ket"`)? After outer trim only, internal spaces remain; comparison is against the
  full trimmed string, so this is incorrect unless the secret word itself contains those
  spaces (starter words do not).
- What happens when game state is polled during play? Guess history, scores, and canvas
  drawing are included for all participants; the secret word remains visible only to the
  drawer (per Scenario 2).
- What happens if a participant refreshes the browser mid-round? They receive the
  current canvas, guess history, and scores on the next successful state fetch.
- What happens when only one player remains in a playing room? Preserve playing state;
  drawing and guessing rules still apply for roles present; round end and restart are
  Scenario 4.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow only the drawer to add or modify drawing strokes on the
  round canvas during an active round.
- **FR-002**: System MUST allow only the drawer to clear the canvas during an active
  round, removing all drawing content for the room.
- **FR-003**: System MUST persist canvas drawing state per room so it can be retrieved
  by all participants in that room during play.
- **FR-004**: System MUST show the drawer their drawing on the game screen as they draw
  (immediate local feedback).
- **FR-005**: System MUST synchronize canvas state to all participants in the room
  through periodic state refresh so guessers see the current drawing.
- **FR-006**: System MUST initialize every participant's score to 0 when the round
  enters the active playing state.
- **FR-007**: System MUST allow only guessers (non-drawer participants) to submit text
  guesses during an active round.
- **FR-008**: System MUST trim leading and trailing whitespace from guess text before
  validation and comparison.
- **FR-009**: System MUST reject guess submissions that are empty or whitespace-only
  after trimming, with a clear user-visible error message.
- **FR-010**: System MUST compare trimmed guesses to the round secret word using a
  case-insensitive match.
- **FR-011**: System MUST award 100 points to the submitting guesser's total score when
  a guess is correct, and 0 points when incorrect.
- **FR-012**: System MUST append each accepted guess to the room's guess history with
  enough information for all players to see who guessed, the stored guess text (trimmed),
  and whether it was correct or incorrect.
- **FR-013**: System MUST expose guess history and scores to all participants in the
  room through the same polling-based sync used for other game state (~2 seconds).
- **FR-014**: System MUST continue to enforce Scenario 1 and 2 rules: room isolation,
  host-only start, drawer assignment, drawer-only secret word visibility, and trimmed
  player names.
- **FR-015**: System MUST reject drawer attempts to guess and non-drawer attempts to
  draw or clear, with clear errors and no state corruption.
- **FR-016**: Frontend MUST handle guess-validation and permission errors without
  crashing the UI.

### Key Entities

- **Canvas state**: The current drawing for the active round in a room; owned by the
  drawer's actions; visible to all participants once synced.
- **Guess**: A single submission by a guesser containing trimmed text, submitter
  identity, timestamp or order, and outcome (correct or incorrect).
- **Guess history**: Ordered list of guesses for the current round, shared identically
  across all participants in the room.
- **Score**: Non-negative integer per participant for the current round; starts at 0;
  increases by 100 per correct guess attributed to that participant.
- **Active round**: Room in playing status with assigned drawer, secret word, canvas,
  guess history, and scores as defined in prior scenarios.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a two-browser test, 100% of drawer stroke and clear actions appear on
  the drawer's screen without manual refresh.
- **SC-002**: In a two-browser test, guessers see canvas updates consistent with the
  drawer within 3 seconds of a change (polling cadence).
- **SC-003**: 100% of whitespace-only or empty-after-trim guess submissions are rejected
  with a visible error and do not appear in guess history.
- **SC-004**: 100% of correct guesses (matching secret word after trim and
  case-insensitive compare) increase the guesser's score by exactly 100; 100% of
  incorrect guesses leave the score unchanged.
- **SC-005**: After any guess is accepted, all participants in the room show the same
  guess history entry within 3 seconds.
- **SC-006**: When a round becomes active, 100% of participants display score 0 before
  any guesses are scored.
- **SC-007**: 0% of guesser sessions can draw, clear, or receive points for drawer-only
  actions; 0% of drawer sessions can submit guesses.
- **SC-008**: Guess history and scores in one room never appear in another room's state
  (isolation carried forward from Scenario 1).

## Assumptions

- Scenarios 1 and 2 are complete: rooms, lobby polling, host-only start, drawer
  assignment, deterministic secret word, drawer-only word visibility, and trimmed
  player names.
- An "active round" means the room is in playing status with a designated drawer and
  secret word for round one.
- All participants use automatic state refresh at approximately 2-second intervals
  during the game phase (same cadence as lobby).
- Drawing is represented as stroke or path data sufficient to reproduce the canvas on
  other clients after sync; exact capture format is an implementation detail.
- Guessers need a visible synced canvas to play; Scenario 3's explicit "drawer's screen"
  requirement is satisfied by immediate drawer feedback plus synced canvas for all
  players.
- Multiple guesses per guesser per round are allowed unless a later scenario restricts
  them; each correct guess adds 100 points.
- Round end, results display, host restart, and clearing round state belong to Scenario
  4; this scenario does not require transitioning to a result phase.
- No timers, drawer rotation, multiple rounds, spectators, custom word lists,
  authentication, persistence beyond process memory, or real-time push protocols.

## Out of Scope (Scenario 3)

- Result phase UI, revealing the word to all players at round end, and host restart to
  lobby (Scenario 4).
- Drawer rotation, additional rounds, timers, countdowns, speed bonuses, or custom word
  packs.
- Ending the round automatically when someone guesses correctly (unless already defined
  elsewhere; round lifecycle end is Scenario 4).
- WebSockets, databases, authentication, and deployment work (per lab README and
  constitution).
