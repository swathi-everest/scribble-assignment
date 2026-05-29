# Feature Specification: Result Restart Validation

**Feature Branch**: `006-result-restart-validation`

**Created**: 2026-05-29

**Status**: Draft

**Input**: User description: "Create spec file for Scenario 4 — Result, Restart & Final Validation Given a round has ended, When the result state is displayed and the host restarts, Then all players see the correct word, final scores, and full guess history; on restart, everyone returns to the lobby with players preserved and all round state cleared."

**Constitution**: `.specify/memory/constitution.md` — scenario acceptance criteria and
edge cases belong in this spec, not in the constitution.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Review Complete Round Result (Priority: P1)

As a player at the end of a round, I can review a complete and consistent result view so I understand what happened before the next round decision is made.

**Why this priority**: The round result is the main closure event; if it is incomplete or inconsistent, players cannot verify fairness or trust scores.

**Independent Test**: Can be fully tested by ending a round with guesses and scores, opening the result state for all players, and confirming every player sees the same winning word, final score table, and full guess history.

**Acceptance Scenarios**:

1. **Given** a round has ended with a resolved secret word, **When** the result state loads, **Then** every connected player sees the same revealed correct word.
2. **Given** a round has ended with score updates, **When** the result state loads, **Then** every connected player sees one shared final scoreboard that matches the round outcome.
3. **Given** guesses were submitted during the round, **When** the result state loads, **Then** every connected player can view the complete ordered guess history for that round.

---

### User Story 2 - Restart To Clean Lobby (Priority: P1)

As the host, I can restart after results so the game returns to lobby state with the same players and no leftover round data.

**Why this priority**: Restart behavior controls continuity between rounds; stale data after restart causes incorrect gameplay and confusion.

**Independent Test**: Can be fully tested by ending a round, entering result state, triggering host restart, and verifying all clients transition to lobby with unchanged player roster and fully reset round fields.

**Acceptance Scenarios**:

1. **Given** the room is in result state, **When** the host triggers restart, **Then** all connected clients transition to the lobby view.
2. **Given** players are present in result state, **When** restart completes, **Then** the same players remain in the room roster with their identities preserved.
3. **Given** round-specific data exists (word, drawing state, guesses, per-round status), **When** restart completes, **Then** all round-specific data is cleared and unavailable in lobby state.

---

### User Story 3 - Reject Invalid Restart Attempts (Priority: P2)

As a non-host player, I cannot force a restart, and as any player, I cannot restart from an invalid game phase.

**Why this priority**: Authorization and state-boundary checks protect game flow integrity and prevent accidental or malicious state resets.

**Independent Test**: Can be fully tested by attempting restart as a non-host and from non-result phases and verifying no state transition occurs.

**Acceptance Scenarios**:

1. **Given** a non-host player in result state, **When** they attempt restart, **Then** restart is denied and room state remains unchanged.
2. **Given** the host is in lobby or active-round state, **When** they attempt restart, **Then** restart is denied and room state remains unchanged.

---

### Edge Cases

- A player reconnects during result display and must still receive the same revealed word, final scores, and full guess history as existing players.
- No guesses were submitted in the round; result state still renders an explicit empty guess history instead of missing content.
- A restart request is sent more than once in rapid succession; only one restart transition is applied and room state remains consistent.
- A player disconnects exactly during restart; remaining players still transition to a clean lobby and the disconnected player can rejoin without stale round data.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST expose a result state immediately after round completion before any restart can occur.
- **FR-002**: System MUST display the round’s correct word to all players while the room is in result state.
- **FR-003**: System MUST display a single authoritative final scoreboard for the completed round to all players in result state.
- **FR-004**: System MUST display the complete ordered guess history from the completed round to all players in result state.
- **FR-005**: System MUST allow only the host to trigger restart while the room is in result state.
- **FR-006**: System MUST reject restart attempts from non-host players without changing room state.
- **FR-007**: System MUST reject restart attempts made outside result state without changing room state.
- **FR-008**: On successful restart, system MUST transition the room state from result to lobby for all currently connected players.
- **FR-009**: On successful restart, system MUST preserve the existing player roster and player identities in the room.
- **FR-010**: On successful restart, system MUST clear all round-specific state, including secret word, drawing artifacts, per-round guesses, and round outcome status.
- **FR-011**: On successful restart, system MUST ensure no client can read stale round-specific data while in lobby state.

### Key Entities *(include if feature involves data)*

- **Room Result Snapshot**: Shared end-of-round state visible to all players, including revealed correct word, final scoreboard, and ordered guess history.
- **Player Roster**: Collection of active room participants with stable identity attributes that survive restart.
- **Round State**: Round-scoped data set (word, drawing content, guesses, round status) that must be fully cleared when returning to lobby.
- **Restart Action**: Host-initiated state transition request that is valid only during result state and atomically resets round state while preserving roster.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In validation runs, 100% of players connected at result time see matching values for revealed word, final scores, and guess history content.
- **SC-002**: In validation runs, host-triggered restart returns all connected clients to lobby state within 3 seconds.
- **SC-003**: In validation runs, 100% of restart attempts from non-host users or invalid room phases are rejected with no unintended state change.
- **SC-004**: In validation runs, 100% of successful restarts preserve the pre-restart player roster and remove all round-specific data from lobby-visible state.

## Assumptions

- A single designated host exists per room and host identity is known before result state begins.
- Final scores and guess history are finalized at round end and are not mutable during result display.
- Returning to lobby prepares the room for a future round but does not automatically start that round.
- Validation focuses on players connected at the time of restart; disconnected players may rejoin through existing room rejoin behavior.
