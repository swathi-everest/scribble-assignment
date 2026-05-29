import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";

const rooms = new Map<string, Room>();

export type StartGameFailure = "NOT_FOUND" | "NOT_HOST" | "NOT_ENOUGH_PLAYERS" | "ALREADY_PLAYING";

export class InvalidPlayerNameError extends Error {
  constructor(message = "Player name is required") {
    super(message);
    this.name = "InvalidPlayerNameError";
  }
}

function now() {
  return new Date().toISOString();
}

function generateCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let index = 0; index < 4; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return code;
}

function generateUniqueCode() {
  let code = generateCode();

  while (rooms.has(code)) {
    code = generateCode();
  }

  return code;
}

export function normalizePlayerName(name: string): string {
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    throw new InvalidPlayerNameError();
  }

  return trimmed;
}

function createParticipant(name: string): Participant {
  return {
    id: randomUUID(),
    name: normalizePlayerName(name),
    joinedAt: now()
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

export function listWords() {
  return [...STARTER_WORDS];
}

export function selectSecretWord(code: string): string {
  let sum = 0;

  for (const char of code) {
    sum += char.charCodeAt(0);
  }

  const index = sum % STARTER_WORDS.length;
  return STARTER_WORDS[index] ?? STARTER_WORDS[0];
}

export function createRoom(playerName: string) {
  const participant = createParticipant(playerName);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostParticipantId: participant.id,
    participants: [participant],
    createdAt: now(),
    updatedAt: now()
  };

  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function joinRoom(code: string, playerName: string) {
  const room = rooms.get(code.toUpperCase());

  if (!room) {
    return null;
  }

  const participant = createParticipant(playerName);
  room.participants.push(participant);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function getRoom(code: string) {
  const room = rooms.get(code.toUpperCase());
  return room ? cloneRoom(room) : null;
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

export function startGame(
  code: string,
  participantId: string
): { ok: true; room: Room } | { ok: false; reason: StartGameFailure } {
  const room = rooms.get(code.toUpperCase());

  if (!room) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  if (room.status === "playing") {
    return { ok: false, reason: "ALREADY_PLAYING" };
  }

  if (room.hostParticipantId !== participantId) {
    return { ok: false, reason: "NOT_HOST" };
  }

  if (room.participants.length < 2) {
    return { ok: false, reason: "NOT_ENOUGH_PLAYERS" };
  }

  room.status = "playing";
  room.drawerParticipantId = room.hostParticipantId;
  room.secretWord = selectSecretWord(room.code);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true, room: cloneRoom(room) };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const snapshot: RoomSnapshot = {
    code: room.code,
    status: room.status,
    hostParticipantId: room.hostParticipantId,
    participants: room.participants.map((participant) => {
      const participantSnapshot = {
        ...participant,
        isHost: participant.id === room.hostParticipantId
      };

      if (room.status === "playing" && room.drawerParticipantId) {
        return {
          ...participantSnapshot,
          role: participant.id === room.drawerParticipantId ? ("drawer" as const) : ("guesser" as const)
        };
      }

      return participantSnapshot;
    }),
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };

  if (room.status === "playing" && room.drawerParticipantId) {
    snapshot.drawerParticipantId = room.drawerParticipantId;

    if (viewerParticipantId === room.drawerParticipantId && room.secretWord) {
      snapshot.secretWord = room.secretWord;
    }
  }

  return snapshot;
}
