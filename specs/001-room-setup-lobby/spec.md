# Feature Specification: Scenario 1 — Room Setup & Lobby

**Feature Branch**: `001-room-setup-lobby`

**Created**: 2026-05-29

**Status**: Draft

**Input**: Scenario 1 — Room Setup & Lobby. Given a player wants to host or join a
drawing game, When they create or join a room via a unique code, Then the creator is
automatically the host; invalid/empty codes are rejected with clear feedback; rooms
are fully isolated; the lobby refreshes via polling (~2s); and only the host can
start the game once at least 2 players are present.

**Constitution**: `.specify/memory/constitution.md` — scenario acceptance criteria and
edge cases belong in this spec, not in the constitution.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a Room as Host (Priority: P1)

A player opens the app, chooses to host a new game, and receives a unique room code.
They are taken to the lobby as the designated host and can see themselves in the
participant list.

**Why this priority**: Hosting is the entry point for every session; without a room
and host, no other lobby behavior can be tested.

**Independent Test**: Create a room in one browser tab; confirm a room code is shown,
the player lands in the lobby, and exactly one participant is listed with host
privileges indicated.

**Acceptance Scenarios**:

1. **Given** a player on the start screen, **When** they create a room, **Then** the
   system assigns a unique room code and navigates them to the lobby.
2. **Given** a room was just created, **When** the creator views the lobby, **Then**
   they are identified as the host and appear in the participant list.
3. **Given** a room was just created, **When** another player has not yet joined,
   **Then** the participant count shows one player.

---

### User Story 2 - Join a Room with Validation (Priority: P2)

A player enters a room code (and optional display name) to join an existing game.
Valid codes add them to the correct lobby; invalid or empty codes are rejected with
clear, user-visible feedback without crashing the app.

**Why this priority**: Multiplayer flow depends on reliable join; validation prevents
confusion and supports isolation testing.

**Independent Test**: With an existing room code, join from a second browser tab and
confirm the new player appears after lobby refresh. Attempt joins with empty and
non-existent codes and confirm errors.

**Acceptance Scenarios**:

1. **Given** an active room with a known code, **When** a second player joins with
   that code, **Then** they enter that room's lobby and appear in the participant
   list.
2. **Given** a player on the join screen, **When** they submit an empty room code,
   **Then** the join is rejected with a clear error message and they remain on the
   join flow.
3. **Given** a player on the join screen, **When** they submit a code that does not
   match any active room, **Then** the join is rejected with a clear error message
   (e.g., room not found) and no lobby session is created for them.
4. **Given** two active rooms with different codes, **When** a player joins room A,
   **Then** they see only room A's participants and never room B's state.

---

### User Story 3 - Live Lobby Updates (Priority: P3)

Players in a lobby see an up-to-date participant list without manually refreshing
the page. When someone joins or leaves (if leave is supported by the starter),
the lobby reflects changes within about two seconds.

**Why this priority**: Coordinated play requires a shared view of who is in the room
before starting.

**Independent Test**: Open two browsers in the same room; join the second player;
within ~2 seconds the first player's lobby list updates to show both participants
without clicking a manual refresh control.

**Acceptance Scenarios**:

1. **Given** a player is in the lobby alone, **When** they remain on the lobby
   screen, **Then** the participant list continues to stay current via automatic
   periodic refresh (approximately every 2 seconds).
2. **Given** two players in the same room lobby, **When** the second player joins,
   **Then** the first player's lobby shows the new participant within approximately
   2 seconds without manual refresh.
3. **Given** two separate rooms each with one player, **When** a third player joins
   only room A, **Then** room B's lobby participant list is unchanged.

---

### User Story 4 - Host Starts the Game (Priority: P4)

When at least two players are in the lobby, the host can start the game. Non-hosts
cannot start. With fewer than two players, start is blocked with clear feedback.

**Why this priority**: Completes Scenario 1 by gating transition out of the lobby
into gameplay (drawer and word rules are defined in Scenario 2).

**Independent Test**: As host with one player, confirm start is disabled or rejected.
Add a second player; host starts successfully. As non-host with two players,
confirm start is not available or is rejected.

**Acceptance Scenarios**:

1. **Given** a lobby with exactly one participant (the host), **When** the host
   attempts to start the game, **Then** start is not allowed and the user receives
   clear feedback that at least two players are required.
2. **Given** a lobby with two or more participants and a designated host, **When**
   the host starts the game, **Then** the room transitions out of the lobby phase
   into an active game phase for all participants in that room.
3. **Given** a lobby with two or more participants, **When** a non-host player
   attempts to start the game, **Then** the action is rejected and the room remains
   in the lobby phase.
4. **Given** the host started the game in room A, **When** players in room B are
   still in their lobby, **Then** room B is unaffected.

---

### Edge Cases

- What happens when a join request uses a code with only whitespace? Treat as empty
  and reject with the same clarity as an empty code.
- What happens when a join code uses different letter casing than issued? Join MUST
  succeed when the code matches the same room (case-insensitive code matching).
- What happens when the same room code is used concurrently in many tabs? Each join
  adds a distinct participant; all see the same room's lobby state when polling.
- What happens when a non-host views the lobby before a second player arrives? Start
  control is unavailable or clearly disabled; no transition to game phase.
- What happens when polling fails temporarily (network error)? The UI shows a
  recoverable error without crashing; the user can retry or re-enter the room flow.
- What happens when creating multiple rooms in sequence? Each creation yields a
  distinct code and isolated lobby; no participant bleed between rooms.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow a player to create a new room and receive a
  unique, shareable room code.
- **FR-002**: The system MUST designate the room creator as the host for that room
  until explicitly changed by a future scenario (not in scope for Scenario 1).
- **FR-003**: The system MUST allow a player to join an existing room by entering
  its room code.
- **FR-004**: The system MUST reject join attempts when the room code is empty or
  whitespace-only, with a clear error message.
- **FR-005**: The system MUST reject join attempts when no active room matches the
  code, with a clear error message.
- **FR-006**: The system MUST keep room state isolated so players and lobby data in
  one room never appear in another room's lobby.
- **FR-007**: The system MUST automatically refresh lobby state for connected players
  on an interval of approximately 2 seconds while they remain on the lobby screen.
- **FR-008**: The system MUST display the current participant list in the lobby,
  including who is the host.
- **FR-009**: Only the host MUST be able to start the game from the lobby.
- **FR-010**: The system MUST prevent starting the game when fewer than two
  participants are in the room, with clear feedback to the host.
- **FR-011**: When start preconditions are met, the host MUST be able to transition
  the room from lobby phase to active game phase for all participants in that room.
- **FR-012**: The system MUST reject non-host attempts to start the game.
- **FR-013**: The system MUST handle errors during create, join, refresh, and start
  actions without breaking the user interface.

### Key Entities

- **Room**: A isolated game session identified by a unique code; has a phase
  (lobby vs active game), a participant list, and exactly one host at a time.
- **Participant**: A player in a room with a stable identity for the session,
  display name, and role indicator (host vs non-host).
- **Host**: The participant authorized to start the game; initially the room
  creator.
- **Lobby**: The pre-game phase where participants gather and the host may start
  once at least two players are present.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new host can create a room and reach the lobby with a visible room
  code in under 30 seconds on a typical lab setup.
- **SC-002**: 100% of join attempts with empty or unknown codes show an explicit
  error message without entering a lobby.
- **SC-003**: When a second player joins an existing lobby, the first player sees
  them in the participant list within 3 seconds without manual refresh.
- **SC-004**: 100% of start attempts by non-hosts with two or more players present
  do not change the room phase.
- **SC-005**: With two players present, the host can start the game in one action
  and all participants in that room leave the lobby phase together.
- **SC-006**: Concurrent rooms (minimum two active codes) show zero cross-room
  participant leakage when verified with separate browser sessions.

## Assumptions

- Players identify themselves with a display name at create/join time; strict
  name trimming and empty-name rejection are scoped to Scenario 2 unless the
  starter already enforces them.
- Room codes are short, human-shareable strings (consistent with the lab starter);
  exact format is an implementation detail as long as codes are unique and
  joinable case-insensitively.
- "Start the game" for Scenario 1 means leaving the lobby phase; drawer assignment,
  secret word visibility, and round rules are specified in Scenario 2.
- Players may remain in the app without accounts; session continuity uses the
  participant identity returned when creating or joining.
- Leaving a room mid-lobby is not required unless already supported by the starter;
  polling and isolation still apply while players remain connected.
- Manual lobby refresh controls may exist in the starter but automatic ~2s refresh
  is required for Scenario 1 completion.

## Out of Scope (Scenario 1)

- Drawer selection, secret word, canvas drawing, guessing, scoring, and round results
  (Scenarios 2–4).
- WebSockets or push-based real-time sync.
- Persistent storage, authentication, timers, multi-round rotation, spectators, or
  custom word lists (per lab README and constitution).
