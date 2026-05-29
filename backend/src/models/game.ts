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

export interface CanvasStroke {
  points: [number, number][];
  color: string;
  lineWidth: number;
}

export interface GuessRecord {
  id: string;
  participantId: string;
  participantName: string;
  text: string;
  isCorrect: boolean;
  submittedAt: string;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostParticipantId: string;
  drawerParticipantId?: string;
  secretWord?: string;
  participants: Participant[];
  canvasStrokes?: CanvasStroke[];
  guesses?: GuessRecord[];
  scores?: Record<string, number>;
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
  canvas?: { strokes: CanvasStroke[] };
  guesses?: GuessRecord[];
  scores?: Record<string, number>;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
