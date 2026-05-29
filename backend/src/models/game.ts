export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface ParticipantSnapshot extends Participant {
  isHost: boolean;
  role?: ParticipantRole;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostParticipantId: string;
  drawerParticipantId?: string;
  secretWord?: string;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostParticipantId: string;
  drawerParticipantId?: string;
  secretWord?: string;
  participants: ParticipantSnapshot[];
  availableWords: string[];
  roles: ParticipantRole[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
