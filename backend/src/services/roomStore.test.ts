import { describe, expect, it } from "vitest";
import {
  appendStroke,
  clearCanvas,
  createRoom,
  GameplayError,
  getRoom,
  InvalidGuessError,
  InvalidPlayerNameError,
  joinRoom,
  normalizePlayerName,
  selectSecretWord,
  startGame,
  submitGuess,
  toRoomSnapshot
} from "./roomStore.js";
import { STARTER_WORDS } from "../seed/starterData.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("createRoom sets hostParticipantId to the creator", () => {
    const result = createRoom("Alice");

    expect(result.room.hostParticipantId).toBe(result.participantId);
  });

  it("trims player names on create", () => {
    const result = createRoom("  Alex  ");

    expect(result.room.participants[0].name).toBe("Alex");
  });

  it("rejects whitespace-only names on create", () => {
    expect(() => createRoom("   ")).toThrow(InvalidPlayerNameError);
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("rejects whitespace-only names on join", () => {
    const host = createRoom("Alice");

    expect(() => joinRoom(host.room.code, "   ")).toThrow(InvalidPlayerNameError);
  });

  it("joinRoom is case-insensitive for existing rooms", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code.toLowerCase(), "Bob");

    expect(guest).not.toBeNull();
    expect(guest?.room.participants).toHaveLength(2);
  });

  it("keeps rooms isolated when joining different codes", () => {
    const roomA = createRoom("Alice");
    const roomB = createRoom("Bob");

    joinRoom(roomA.room.code, "Carol");

    expect(roomB.room.participants).toHaveLength(1);
    expect(roomA.room.code).not.toBe(roomB.room.code);
  });

  it("startGame rejects when fewer than two players", () => {
    const host = createRoom("Alice");
    const result = startGame(host.room.code, host.participantId);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("NOT_ENOUGH_PLAYERS");
    }
  });

  it("startGame rejects non-host participants", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");

    expect(guest).not.toBeNull();

    const result = startGame(host.room.code, guest!.participantId);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("NOT_HOST");
    }
  });

  it("startGame transitions room to playing for host with two players", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");

    const result = startGame(host.room.code, host.participantId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.room.status).toBe("playing");
    }
  });

  it("assigns host as drawer with roles after start", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");

    expect(guest).not.toBeNull();

    const result = startGame(host.room.code, host.participantId);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.room.drawerParticipantId).toBe(host.participantId);

    const drawerSnapshot = toRoomSnapshot(result.room, host.participantId);
    const guesserSnapshot = toRoomSnapshot(result.room, guest!.participantId);

    expect(drawerSnapshot.participants.find((p) => p.id === host.participantId)?.role).toBe("drawer");
    expect(guesserSnapshot.participants.find((p) => p.id === guest!.participantId)?.role).toBe("guesser");
  });

  it("includes secretWord only for drawer snapshot", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");

    expect(guest).not.toBeNull();

    const result = startGame(host.room.code, host.participantId);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const drawerSnapshot = toRoomSnapshot(result.room, host.participantId);
    const guesserSnapshot = toRoomSnapshot(result.room, guest!.participantId);

    expect(drawerSnapshot.secretWord).toBeDefined();
    expect(STARTER_WORDS).toContain(drawerSnapshot.secretWord);
    expect(guesserSnapshot.secretWord).toBeUndefined();
  });

  it("selectSecretWord is deterministic for the same room code", () => {
    const host = createRoom("Alice");
    const first = selectSecretWord(host.room.code);
    const second = selectSecretWord(host.room.code);

    expect(first).toBe(second);
    expect(STARTER_WORDS).toContain(first);
  });

  it("normalizePlayerName trims and rejects empty values", () => {
    expect(normalizePlayerName("  Pat  ")).toBe("Pat");
    expect(() => normalizePlayerName("   ")).toThrow(InvalidPlayerNameError);
  });

  it("startGame initializes canvas, guesses, and zero scores", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");

    expect(guest).not.toBeNull();

    const result = startGame(host.room.code, host.participantId);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.room.canvasStrokes).toEqual([]);
    expect(result.room.guesses).toEqual([]);
    expect(result.room.scores?.[host.participantId]).toBe(0);
    expect(result.room.scores?.[guest!.participantId]).toBe(0);

    const snapshot = toRoomSnapshot(result.room, guest!.participantId);
    expect(snapshot.canvas?.strokes).toEqual([]);
    expect(snapshot.guesses).toEqual([]);
    expect(snapshot.scores?.[guest!.participantId]).toBe(0);
  });

  it("appendStroke allows drawer and rejects guesser", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");

    expect(guest).not.toBeNull();
    startGame(host.room.code, host.participantId);

    const stroke = {
      points: [
        [0.1, 0.1],
        [0.2, 0.2]
      ] as [number, number][],
      color: "#000000",
      lineWidth: 4
    };

    const updated = appendStroke(host.room.code, host.participantId, stroke);
    expect(updated.canvasStrokes).toHaveLength(1);

    expect(() => appendStroke(host.room.code, guest!.participantId, stroke)).toThrow(GameplayError);
  });

  it("clearCanvas preserves guesses and scores", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");

    expect(guest).not.toBeNull();
    startGame(host.room.code, host.participantId);

    appendStroke(host.room.code, host.participantId, {
      points: [
        [0.1, 0.1],
        [0.2, 0.2]
      ],
      color: "#000000",
      lineWidth: 4
    });

    submitGuess(host.room.code, guest!.participantId, "wrong");

    const cleared = clearCanvas(host.room.code, host.participantId);
    expect(cleared.canvasStrokes).toEqual([]);
    expect(cleared.guesses).toHaveLength(1);
    expect(cleared.scores?.[guest!.participantId]).toBe(0);
  });

  it("submitGuess trims, compares case-insensitively, and scores", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");

    expect(guest).not.toBeNull();
    const started = startGame(host.room.code, host.participantId);

    expect(started.ok).toBe(true);
    if (!started.ok) {
      return;
    }

    const secretWord = started.room.secretWord ?? "";
    const wrong = submitGuess(host.room.code, guest!.participantId, "pizza");
    expect(wrong.guesses?.[0]?.isCorrect).toBe(false);
    expect(wrong.scores?.[guest!.participantId]).toBe(0);

    const correct = submitGuess(host.room.code, guest!.participantId, `  ${secretWord.toUpperCase()}  `);
    expect(correct.guesses).toHaveLength(2);
    expect(correct.guesses?.[1]?.text).toBe(secretWord.toUpperCase());
    expect(correct.guesses?.[1]?.isCorrect).toBe(true);
    expect(correct.scores?.[guest!.participantId]).toBe(100);
  });

  it("submitGuess rejects empty and drawer submissions", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");

    expect(guest).not.toBeNull();
    startGame(host.room.code, host.participantId);

    expect(() => submitGuess(host.room.code, guest!.participantId, "   ")).toThrow(InvalidGuessError);
    expect(() => submitGuess(host.room.code, host.participantId, "rocket")).toThrow(GameplayError);
  });

  it("submitGuess adds cumulative score for multiple correct guesses", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");

    expect(guest).not.toBeNull();
    const started = startGame(host.room.code, host.participantId);

    expect(started.ok).toBe(true);
    if (!started.ok) {
      return;
    }

    const secretWord = started.room.secretWord ?? "";

    submitGuess(host.room.code, guest!.participantId, secretWord);
    const second = submitGuess(host.room.code, guest!.participantId, secretWord);

    expect(second.scores?.[guest!.participantId]).toBe(200);
  });

  it("keeps gameplay state isolated between rooms", () => {
    const roomA = createRoom("Alice");
    const roomB = createRoom("Bob");
    const guestA = joinRoom(roomA.room.code, "Carol");
    const guestB = joinRoom(roomB.room.code, "Dana");

    expect(guestA).not.toBeNull();
    expect(guestB).not.toBeNull();
    startGame(roomA.room.code, roomA.participantId);
    startGame(roomB.room.code, roomB.participantId);

    submitGuess(roomA.room.code, guestA!.participantId, "test");

    const roomBState = getRoom(roomB.room.code);
    expect(roomBState).not.toBeNull();

    const snapshotB = toRoomSnapshot(roomBState!, roomB.participantId);
    expect(snapshotB.guesses).toEqual([]);
    expect(snapshotB.scores?.[roomB.participantId]).toBe(0);
  });
});
