# Checklist: Lobby & Room Setup Requirements Quality

**Purpose**: Validate Scenario 1 spec quality for room creation, join validation, lobby
sync, host-only start, and multi-room isolation—before Scenario 2 planning.

**Created**: 2026-05-29

**Feature**: [spec.md](../spec.md)

**Note**: Items test whether requirements are well-written (unit tests for English), not
whether implementation works.

**Defaults applied** (no `$ARGUMENTS`): Standard depth · PR reviewer audience · Focus:
host/start gates, HTTP polling sync, join validation, room isolation.

---

## Requirement Completeness

- [ ] CHK001 Are requirements defined for room creation including unique code issuance
  and host designation? [Completeness, Spec §US1, FR-001, FR-002]
- [ ] CHK002 Are join-flow requirements documented for valid codes, empty codes, and
  unknown codes separately? [Completeness, Spec §US2, FR-004, FR-005]
- [ ] CHK003 Are automatic lobby refresh requirements specified independently of any
  optional manual refresh? [Completeness, Spec §US3, FR-007, Assumptions]
- [ ] CHK004 Are host-only start requirements defined for both UI affordance and
  server-side rejection paths? [Completeness, Spec §US4, FR-009, FR-012]
- [ ] CHK005 Are minimum player count requirements stated before game phase transition?
  [Completeness, Spec §FR-010, US4]
- [ ] CHK006 Are multi-room isolation requirements explicit for participants, lobby
  data, and phase transitions? [Completeness, Spec §FR-006, US2, US4]
- [ ] CHK007 Are error-handling requirements listed for create, join, refresh, and start
  actions? [Completeness, Spec §FR-013]
- [ ] CHK008 Is the boundary between lobby phase and active game phase defined without
  relying on Scenario 2 gameplay rules? [Completeness, Spec §Assumptions, Out of Scope]

---

## Requirement Clarity

- [ ] CHK009 Is the ~2 second polling interval expressed with an acceptable tolerance
  (e.g., “approximately 2 seconds” vs fixed SLA)? [Clarity, Spec §FR-007, US3]
- [ ] CHK010 Is “clear feedback” for invalid join codes described with expected user
  outcome (stay on join flow, no lobby session)? [Clarity, Spec §US2]
- [ ] CHK011 Is “clear feedback” for blocked start with fewer than two players defined
  for the host (disabled control vs error message)? [Clarity, Spec §US4, FR-010]
- [ ] CHK012 Are host identification requirements specific (badge, label, role field)
  rather than implied? [Clarity, Spec §FR-008, US1]
- [ ] CHK013 Is case-insensitive room code matching documented as a requirement, not
  only an edge-case note? [Clarity, Spec §Edge Cases]
- [ ] CHK014 Is “active game phase” named consistently across user stories, FRs, and
  entities (vs “playing”, “in-game”, etc.)? [Clarity, Spec §Key Entities, FR-011]

---

## Requirement Consistency

- [ ] CHK015 Do polling timing requirements align between FR-007 (~2s) and SC-003
  (within 3s visibility)? [Consistency, Spec §FR-007, SC-003]
- [ ] CHK016 Are host start permissions consistent between FR-009, FR-012, and US4
  acceptance scenarios? [Consistency, Spec §FR-009, FR-012, US4]
- [ ] CHK017 Do out-of-scope declarations (no WebSockets, no DB, no auth) align with
  constitution and README constraints referenced in spec? [Consistency, Spec §Out of Scope]
- [ ] CHK018 Are display-name validation rules consistent between Assumptions (deferred
  to Scenario 2) and join/create flows that mention optional names? [Consistency, Assumption]

---

## Acceptance Criteria Quality

- [ ] CHK019 Can SC-002 (100% empty/unknown join errors) be verified without
  implementation-specific test harness details? [Measurability, Spec §SC-002]
- [ ] CHK020 Can SC-004 (non-host start never changes phase) be verified with explicit
  preconditions (≥2 players present)? [Measurability, Spec §SC-004]
- [ ] CHK021 Does SC-005 define “one action” for host start without ambiguous multi-step
  flows? [Measurability, Spec §SC-005]
- [ ] CHK022 Is SC-006’s “zero cross-room participant leakage” scoped to lobby-visible
  data only? [Measurability, Spec §SC-006]

---

## Scenario Coverage

- [ ] CHK023 Are primary flows covered: create → lobby, join → lobby, poll → updated list,
  host start → phase change? [Coverage, Spec §US1–US4]
- [ ] CHK024 Are alternate flows addressed (e.g., lowercase join code, whitespace-only
  code)? [Coverage, Spec §Edge Cases]
- [ ] CHK025 Are exception flows defined for unknown room, empty code, non-host start,
  and insufficient players? [Coverage, Spec §US2, US4, FR-004–FR-005, FR-010, FR-012]
- [ ] CHK026 Are recovery flows specified for transient polling/network failures without
  app crash? [Coverage, Spec §Edge Cases, FR-013]
- [ ] CHK027 Are concurrent multi-tab join scenarios addressed in requirements (distinct
  participants, shared lobby state)? [Coverage, Spec §Edge Cases]

---

## Edge Case Coverage

- [ ] CHK028 Are requirements defined for player leave during lobby, or is exclusion
  explicitly documented? [Edge Case, Spec §US3, Assumptions, Gap]
- [ ] CHK029 Are requirements defined when host attempts start with exactly one
  participant (solo host)? [Edge Case, Spec §US4-1, FR-010]
- [ ] CHK030 Are requirements defined for sequential creation of multiple rooms without
  cross-contamination? [Edge Case, Spec §Edge Cases]
- [ ] CHK031 Are requirements defined for cross-room isolation when one room transitions
  to active game while another remains in lobby? [Edge Case, Spec §US4-4]

---

## Non-Functional Requirements

- [ ] CHK032 Are synchronization mechanism constraints (HTTP polling only, no push)
  stated in requirements or referenced governance docs? [NFR, Spec §Out of Scope,
  Constitution §II]
- [ ] CHK033 Are performance expectations for lobby visibility after join quantified in
  success criteria? [NFR, Spec §SC-003]
- [ ] CHK034 Are scalability or room-lifecycle cleanup requirements specified or
  intentionally excluded for this scenario? [NFR, Gap, Constitution §V]

---

## Dependencies & Assumptions

- [ ] CHK035 Is the assumption that participant identity persists for the session
  documented with enough detail for join/poll/start authorization? [Assumption, Spec §Assumptions]
- [ ] CHK036 Is deferral of drawer/word/scoring rules to Scenario 2 explicit so Scenario 1
  “start game” is not overloaded? [Dependency, Spec §Assumptions, Out of Scope]
- [ ] CHK037 Are manual vs automatic refresh assumptions reconciled in requirements?
  [Assumption, Spec §Assumptions]

---

## Ambiguities & Conflicts

- [ ] CHK038 Is there a recorded clarification for display-name rules in Scenario 1 vs
  Scenario 2, or is ambiguity acknowledged? [Ambiguity, Spec §Assumptions, Gap]
- [ ] CHK039 Does the spec resolve whether non-hosts see a hidden vs disabled start
  control, or is either acceptable without documenting both? [Ambiguity, Spec §US4, FR-012]
- [ ] CHK040 Are requirements free of conflict between “optional display name” and future
  strict name validation in Scenario 2? [Conflict, Spec §US2, Assumptions]

---

## Notes

- Check items off as completed: `[x]`
- Reference findings inline; link to spec sections when updating requirements
- Pair with [requirements.md](./requirements.md) for generic spec-structure quality
