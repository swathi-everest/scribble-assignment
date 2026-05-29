import { z } from "zod";

export const playerNameSchema = z.string().trim().min(1, "Player name is required");

export const createRoomSchema = z.object({
  playerName: playerNameSchema
});

export const joinRoomSchema = z.object({
  playerName: playerNameSchema
});

export const normalizedRoomCodeParamsSchema = z.object({
  code: z.string().trim().min(1, "Room code is required")
});

export const roomCodeParamsSchema = normalizedRoomCodeParamsSchema;

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const startGameSchema = z.object({
  participantId: z.string().min(1, "Participant id is required")
});

export const endRoundSchema = z.object({
  participantId: z.string().min(1, "Participant id is required")
});

export const restartSchema = z.object({
  participantId: z.string().min(1, "Participant id is required")
});

const normalizedPointSchema = z.tuple([
  z.number().min(0).max(1),
  z.number().min(0).max(1)
]);

export const canvasStrokeSchema = z.object({
  points: z.array(normalizedPointSchema).min(2),
  color: z.string().min(1),
  lineWidth: z.number().positive().max(32)
});

export const appendStrokeSchema = z.object({
  participantId: z.string().min(1, "Participant id is required"),
  stroke: canvasStrokeSchema
});

export const clearCanvasSchema = z.object({
  participantId: z.string().min(1, "Participant id is required")
});

export const submitGuessSchema = z.object({
  participantId: z.string().min(1, "Participant id is required"),
  guessText: z.string().trim().min(1, "Guess cannot be empty")
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
