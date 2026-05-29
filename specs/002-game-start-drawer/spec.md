# Feature Specification: Scenario 2 — Game Start & Drawer Flow

**Feature Branch**: `003-game-start-drawer`

**Created**: 2026-05-29

**Status**: Draft

**Input**: Implement scenario 2 - Game Start & Drawer Flow. Given a game is starting and
player names are trimmed (empty/whitespace-only rejected with a message), When the first
round begins, Then the host (or first player) becomes the clearly-identified drawer, and
the secret word (deterministically selected from the starter list) is visible only to
the drawer.

**Constitution**: `.specify/memory/constitution.md` — scenario acceptance criteria and
edge cases belong in this spec, not in the constitution.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Validate Player Names on Entry (Priority: P1)

When hosting or joining a room, a player supplies a display name. The system trims
leading and trailing whitespace and rejects names that are empty or contain only
whitespace, showing a clear, user-visible error. Valid names are stored in trimmed form
so every player appears in the lobby and game with a readable label.

**Why this priority**: Name validation is a precondition stated in the scenario's Given
clause; without it, drawer identification and fair play are ambiguous.

**Independent Test**: Attempt create and join with names such as `"  "`, `""`, and
`"  Alex  "`; confirm rejections for empty/whitespace-only and stored name `Alex` for
the valid trimmed case.

**Acceptance Scenarios**:

1. **Given** a player on the create-room flow, **When** they submit a name that is only
   whitespace, **Then** room creation is rejected with a clear error message and they
   remain on the create flow.
2. **Given** a player on the join-room flow, **When** they submit a name that is only
   whitespace, **Then** the join is rejected with a clear error message and they remain
   on the join flow.
3. **Given** a player on create or join, **When** they submit a name with leading or
   trailing spaces around non-whitespace characters, **Then** the name is accepted and
   stored without those outer spaces.
4. **Given** a player on create or join, **When** they submit a non-empty name after
   trimming, **Then** they proceed into the room flow and appear in the participant
   list with the trimmed name.

---

### User Story 2 - Assign Drawer When the First Round Begins (Priority: P2)

When the host starts the game with at least two players in the lobby, the room enters
the playing phase and exactly one participant is designated as the drawer for round one.
The host (who is also the first player in a newly created room) receives the drawer
role. All participants can see who is drawing; the drawer sees their role reflected in
the game view.

**Why this priority**: Drawer assignment is the core transition from lobby to playable
round and enables the secret-word flow.

**Independent Test**: In a two-player room, host starts the game; verify in both browser
sessions that the host is labeled as drawer and the other player is a guesser.

**Acceptance Scenarios**:

1. **Given** a lobby with at least two validly named players and the host present,
   **When** the host starts the game, **Then** the room status changes to playing for
   all participants in that room.
2. **Given** a game has just started in a room where the creator is still the host,
   **When** any participant views the game screen, **Then** the host is clearly
   identified as the drawer and every other participant is identified as a guesser.
3. **Given** a lobby with two or more players, **When** a non-host attempts to start
   the game, **Then** the start is rejected (per Scenario 1 rules) and no drawer is
   assigned.
4. **Given** a game is already in the playing phase, **When** the host attempts to start
   again, **Then** the start is rejected and drawer assignment does not change.

---

### User Story 3 - Secret Word for Drawer Only (Priority: P3)

At the start of round one, the system selects one secret word from the fixed starter word
list using a deterministic rule tied to the room (so the same room always receives the
same word on its first round). Only the drawer can see that word in the game experience;
guessers see no secret word and receive no word value through shared room state.

**Why this priority**: Fair guessing depends on concealing the word from non-drawers;
deterministic selection keeps outcomes testable across sessions.

**Independent Test**: Start the same room code twice in separate lab runs (or inspect
server state in a controlled test) to confirm the same first-round word; open drawer and
guesser browsers and confirm only the drawer session shows the word.

**Acceptance Scenarios**:

1. **Given** a game has entered the playing phase, **When** the drawer views the game
   screen, **Then** they see the selected secret word clearly labeled as the word to
   draw.
2. **Given** a game has entered the playing phase, **When** a guesser views the game
   screen, **Then** they do not see the secret word (placeholder or instruction to guess
   is acceptable).
3. **Given** two guesser sessions in the same room, **When** they poll for room state,
   **Then** neither receives the secret word value.
4. **Given** the fixed starter word list (`rocket`, `pizza`, `castle`, `guitar`,
   `sunflower`), **When** round one begins for a given room, **Then** the selected word
   is always one of those five words and is the same every time that room's first round
   starts (deterministic for the room).
5. **Given** a drawer session, **When** they refresh or receive automatic game-state
   updates, **Then** they continue to see the same secret word for that round until the
   round ends (out of scope for this scenario).

---

### Edge Cases

- What happens when a player omits a name on create/join? Treat omitted name as invalid
  if the flow requires a name, or apply the same trim/empty rules if a default empty
  string is submitted; empty-after-trim MUST be rejected with a message (no silent
  `"Player"` fallback for whitespace-only input).
- What happens when the host is not the chronologically first joiner but remains the
  designated host from room creation? The host participant ID from Scenario 1 is the
  drawer, not merely the earliest `joinedAt` timestamp.
- What happens when game state is polled by guessers during play? Responses MUST NOT
  include the secret word field or equivalent for non-drawer viewers.
- What happens when only one player remains in a playing room? Preserve playing state
  and drawer assignment; recovery or kick rules are out of scope unless already defined
  in Scenario 1.
- What happens across two rooms with the same number of players? Each room's drawer and
  secret word are independent; no cross-room leakage.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST trim leading and trailing whitespace from player display names
  on room create and room join before validation and storage.
- **FR-002**: System MUST reject create and join requests whose name is empty or
  whitespace-only after trimming, returning a clear, user-visible error message.
- **FR-003**: System MUST persist and display participant names in trimmed form in lobby
  and game views.
- **FR-004**: System MUST assign the drawer role for round one to the room host when the
  game transitions from lobby to playing.
- **FR-005**: System MUST assign guesser role to every other participant when round one
  begins.
- **FR-006**: System MUST expose drawer vs guesser role to all participants in a way that
  allows each player to see who is drawing (e.g., labels or badges on the game screen
  and/or participant list).
- **FR-007**: System MUST select the round-one secret word from the fixed starter list
  (`rocket`, `pizza`, `castle`, `guitar`, `sunflower`) using a deterministic rule based
  on the room identity so repeated first-round starts for the same room yield the same
  word.
- **FR-008**: System MUST provide the secret word only to the drawer's view of game
  state; guessers MUST NOT receive the secret word value.
- **FR-009**: System MUST keep all other Scenario 1 behaviors: host-only start, minimum
  two players, room isolation, and polling-based sync (~2 seconds) while in the game
  phase.
- **FR-010**: Frontend MUST handle name-validation and start-game errors without crashing
  the UI.

### Key Entities

- **Participant**: A player in a room with a trimmed display name, host flag, and
  assigned role (`drawer` or `guesser`) once the game is playing.
- **Room (playing)**: A room in `playing` status with round-one drawer assigned, secret
  word chosen, and per-viewer game state that omits the word for guessers.
- **Secret word**: The single word the drawer must depict for round one; chosen
  deterministically from the starter list; not shared with guessers.
- **Starter word list**: Fixed set of five words used for deterministic selection (lab
  seed list).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of create/join attempts with whitespace-only names are rejected with
  an explicit error message visible to the user.
- **SC-002**: 100% of accepted names appear in the participant list without leading or
  trailing spaces.
- **SC-003**: After a successful host start with two or more players, both (or all)
  participants see playing status and correct drawer/guesser labels within 3 seconds
  without manual refresh.
- **SC-004**: In a two-browser test, 0% of guesser sessions display or receive the
  secret word value while the drawer session does display it.
- **SC-005**: Starting the first round for the same room code in repeated test runs
  selects the same secret word 100% of the time.
- **SC-006**: Drawer and guesser states in one room never appear in another room's
  sessions (isolation carried forward from Scenario 1).

## Assumptions

- Scenario 1 (room setup, lobby polling, host-only start, two-player minimum, room
  isolation) is complete or will be complete before Scenario 2 implementation.
- The room host is the participant who created the room (`hostParticipantId`); that
  participant becomes the round-one drawer when the game starts.
- Round one is the only round in scope; drawer rotation, additional rounds, timers, and
  end-of-round results belong to later scenarios.
- The fixed starter word list matches the lab seed: `rocket`, `pizza`, `castle`, `guitar`,
  `sunflower`. No custom or user-supplied words.
- Deterministic word selection is defined by room identity (e.g., room code) so testers
  can predict the word for a known room without randomness.
- Interactive canvas drawing, guess submission, scoring, guess history sync, and round
  results are Scenario 3–4; this scenario may show placeholders on the game screen for
  those features.
- Players continue to use HTTP polling (~2s) for game-state sync; no real-time push.
- Display names are required at create/join for this scenario; omitting a name is treated
  as empty and rejected rather than defaulting to a generic label when validation applies.

## Out of Scope (Scenario 2)

- Canvas drawing, clear-canvas, guess input, guess history, and scoring (Scenario 3).
- Round end, results panel content, restart-to-lobby, and clearing round state
  (Scenario 4).
- Drawer rotation or multiple rounds per session.
- Timers, countdowns, spectators, custom word lists, authentication, persistence, and
  WebSockets (per lab README and constitution).
