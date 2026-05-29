import { describe, expect, it } from "vitest";
import {
  createRoom,
  InvalidPlayerNameError,
  joinRoom,
  normalizePlayerName,
  selectSecretWord,
  startGame,
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
});
