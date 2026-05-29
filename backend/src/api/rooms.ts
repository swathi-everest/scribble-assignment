import { Router } from "express";
import {
  appendStrokeSchema,
  clearCanvasSchema,
  createRoomSchema,
  HttpError,
  joinRoomSchema,
  normalizedRoomCodeParamsSchema,
  roomViewerQuerySchema,
  startGameSchema,
  submitGuessSchema
} from "./schemas.js";
import {
  appendStroke,
  clearCanvas,
  createRoom,
  GameplayError,
  getRoom,
  InvalidGuessError,
  InvalidPlayerNameError,
  joinRoom,
  startGame,
  submitGuess,
  toRoomSnapshot
} from "../services/roomStore.js";

function mapGameplayError(error: GameplayError) {
  switch (error.code) {
    case "NOT_FOUND":
      return new HttpError(404, error.message);
    case "NOT_PLAYING":
      return new HttpError(400, error.message);
    case "NOT_DRAWER":
    case "DRAWER_CANNOT_GUESS":
      return new HttpError(403, error.message);
    case "NOT_PARTICIPANT":
      return new HttpError(400, error.message);
    default:
      return new HttpError(400, error.message);
  }
}

export function createRoomsRouter() {
  const router = Router();

  router.post("/", (request, response, next) => {
    try {
      const { playerName } = createRoomSchema.parse(request.body);
      const result = createRoom(playerName);

      response.status(201).json({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId)
      });
    } catch (error) {
      if (error instanceof InvalidPlayerNameError) {
        next(new HttpError(400, error.message));
        return;
      }
      next(error);
    }
  });

  router.post("/:code/join", (request, response, next) => {
    try {
      const { code } = normalizedRoomCodeParamsSchema.parse(request.params);
      const { playerName } = joinRoomSchema.parse(request.body);
      const result = joinRoom(code.toUpperCase(), playerName);

      if (!result) {
        throw new HttpError(404, "Unable to join room");
      }

      response.json({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId)
      });
    } catch (error) {
      if (error instanceof InvalidPlayerNameError) {
        next(new HttpError(400, error.message));
        return;
      }
      next(error);
    }
  });

  router.get("/:code", (request, response, next) => {
    try {
      const { code } = normalizedRoomCodeParamsSchema.parse(request.params);
      const { participantId } = roomViewerQuerySchema.parse(request.query);
      const room = getRoom(code.toUpperCase());

      if (!room) {
        throw new HttpError(404, "Unable to load room");
      }

      response.json({
        room: toRoomSnapshot(room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/start", (request, response, next) => {
    try {
      const { code } = normalizedRoomCodeParamsSchema.parse(request.params);
      const { participantId } = startGameSchema.parse(request.body);
      const result = startGame(code.toUpperCase(), participantId);

      if (!result.ok) {
        switch (result.reason) {
          case "NOT_FOUND":
            throw new HttpError(404, "Unable to load room");
          case "NOT_HOST":
            throw new HttpError(403, "Only the host can start the game");
          case "NOT_ENOUGH_PLAYERS":
            throw new HttpError(400, "At least two players are required");
          case "ALREADY_PLAYING":
            throw new HttpError(400, "Game has already started");
          default:
            throw new HttpError(400, "Unable to start game");
        }
      }

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/canvas/strokes", (request, response, next) => {
    try {
      const { code } = normalizedRoomCodeParamsSchema.parse(request.params);
      const { participantId, stroke } = appendStrokeSchema.parse(request.body);
      const room = appendStroke(code.toUpperCase(), participantId, stroke);

      response.json({
        room: toRoomSnapshot(room, participantId)
      });
    } catch (error) {
      if (error instanceof GameplayError) {
        next(mapGameplayError(error));
        return;
      }
      next(error);
    }
  });

  router.post("/:code/canvas/clear", (request, response, next) => {
    try {
      const { code } = normalizedRoomCodeParamsSchema.parse(request.params);
      const { participantId } = clearCanvasSchema.parse(request.body);
      const room = clearCanvas(code.toUpperCase(), participantId);

      response.json({
        room: toRoomSnapshot(room, participantId)
      });
    } catch (error) {
      if (error instanceof GameplayError) {
        next(mapGameplayError(error));
        return;
      }
      next(error);
    }
  });

  router.post("/:code/guesses", (request, response, next) => {
    try {
      const { code } = normalizedRoomCodeParamsSchema.parse(request.params);
      const { participantId, guessText } = submitGuessSchema.parse(request.body);
      const room = submitGuess(code.toUpperCase(), participantId, guessText);

      response.json({
        room: toRoomSnapshot(room, participantId)
      });
    } catch (error) {
      if (error instanceof InvalidGuessError) {
        next(new HttpError(400, error.message));
        return;
      }
      if (error instanceof GameplayError) {
        next(mapGameplayError(error));
        return;
      }
      next(error);
    }
  });

  return router;
}
