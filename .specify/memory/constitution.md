<!--
Sync Impact Report
- Version change: (template placeholders) → 1.0.0
- Modified principles: initial adoption — all five principles defined
- Added sections: Additional Constraints; Development Workflow (AI Usage + Review Discipline)
- Removed sections: none (initial constitution)
- Templates: plan-template.md ✅ updated | spec-template.md ✅ updated | tasks-template.md ✅ updated | checklist-template.md ⚠ no changes needed | commands/*.md ⚠ none present
- Follow-up TODOs: none
-->

# Scribble Constitution

## Core Principles

### I. Brownfield Incremental Delivery

Extend the existing starter codebase only; do not rewrite or replace working scaffold
structure without explicit lab approval. Implement business scenarios 1→4 in strict
order. Each scenario MUST be validated against its acceptance criteria (defined in
`/speckit-specify`, not here) before starting the next. Commits MUST be granular,
meaningful, and traceable to a spec slice or task.

**Rationale**: The lab evaluates brownfield enhancement discipline and incremental
AI-assisted delivery, not greenfield architecture.

### II. Server-Authoritative Game State

The backend `roomStore` is the single source of truth for all shared game state.
Clients MUST synchronize via HTTP polling only (~2 second interval). WebSockets,
Socket.io, and any real-time push protocol are forbidden. Clients MUST NOT hold
client-authoritative shared state that can diverge from the server.

**Rationale**: Predictable sync model, simpler debugging, and alignment with lab
constraints in `AGENTS.md`.

### III. Deterministic Game Rules

Game behavior MUST be deterministic and backend-enforced:

- Fixed word list (starter seed: `rocket`, `pizza`, `castle`, `guitar`, `sunflower`)
- Deterministic word selection per room/round rules defined in the active scenario spec
- Scoring: 100 points for correct guess, 0 for incorrect; guesses compared
  case-insensitively after trim
- Host and drawer permissions enforced on the backend, not inferred by the client
- Secret word visible to the drawer only; MUST NOT leak to guessers via API or UI

**Rationale**: Fair, testable gameplay with verifiable outcomes across multi-browser
sessions.

### IV. TypeScript-First with Strict Validation

All new and modified code MUST be fully typed TypeScript. Use `unknown` instead of
`any` when types are truly dynamic. Zod MUST validate all API request and response
payloads at boundaries. Inputs MUST be trimmed; empty inputs MUST be rejected with
clear error messages. Prefer immutable data updates where practical.

**Rationale**: Type safety and schema validation catch integration errors early in a
small REST codebase.

### V. Simplicity and Scope Discipline

In-memory storage only; no databases, authentication, sessions, JWT, OAuth, or
deployment infrastructure. Do not introduce new state-management or routing libraries
beyond what the starter provides. Out-of-scope features MUST NOT be added, including
multi-round games, timers, custom word lists, spectators, moderation tools, or full
rewrites. Keep the memory footprint for active rooms minimal; remove inactive rooms
explicitly.

**Rationale**: Scope boundaries keep the lab focused on spec-driven incremental
delivery rather than platform expansion.

## Additional Constraints

### Repository Layout

Follow the existing folder layout without restructuring:

- **Backend**: `backend/src/api`, `backend/src/services`, `backend/src/models`
- **Frontend**: `frontend/src/state` (e.g., `roomStore.ts`), `frontend/src/pages`,
  `frontend/src/services`

### Forbidden Technologies

Match the forbidden list in `AGENTS.md`:

- No WebSockets or real-time push
- No databases (SQL, NoSQL, SQLite, etc.)
- No authentication or session management

### Multi-Room Isolation

Room state MUST be isolated per room code. Operations in one room MUST NOT affect
another room's players, scores, or game phase.

### Error Handling

Backend MUST fail fast with centralized error handling. Frontend MUST handle API
errors gracefully without crashing the UI. Invalid requests MUST return clear,
actionable error responses.

### Runtime Commands

Development commands are defined in `README.md` and `AGENTS.md`:

- Backend: `cd backend && npm run dev`
- Frontend: `cd frontend && npm run dev`

## Development Workflow

### AI Usage Rules

Before writing code, AI assistants and developers MUST read existing code in the
relevant area. Changes MUST be minimal diffs that solve the stated requirement.
Do not suggest or implement out-of-scope features. Backend MUST enforce permissions
and game rules; do not rely on client-side checks alone. Resolve ambiguity via
`/speckit-clarify` before implementing uncertain behavior. Mark a scenario complete
only after two-browser validation and successful builds for both backend and frontend.
Document any deviation from the active scenario spec in the spec or plan artifacts.

### Review Discipline

Every implementation slice MUST be checked against the active scenario acceptance
criteria in the feature spec. Implementation plans MUST include constitution gates
and confirm compliance before design proceeds. Reviews MUST verify no secret word
leakage to non-drawer clients. Commits MUST be meaningful and scoped to a logical
unit of work. Do not batch unrelated changes.

## Governance

This constitution is the authoritative governance document for the Scribble lab.
It supersedes conflicting AI advice, ad-hoc suggestions, and informal conventions.
When `AGENTS.md`, `README.md`, or other guidance conflicts with this constitution,
this document wins.

**Amendment procedure**: Propose changes in writing, bump `CONSTITUTION_VERSION`
using semantic versioning (MAJOR for incompatible principle changes; MINOR for new
principles or material expansions; PATCH for clarifications), update
`LAST_AMENDED_DATE`, and propagate changes to dependent Spec Kit templates.

**Compliance review**: Every spec, plan, task list, and PR MUST verify compliance
with the five core principles and forbidden-technology list. Scenario-specific
acceptance criteria belong in `/speckit-specify` artifacts, not in this constitution.

**Version**: 1.0.0 | **Ratified**: 2026-05-29 | **Last Amended**: 2026-05-29
