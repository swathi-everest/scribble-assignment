import { describe, expect, it } from "vitest";
import {
  canvasStrokeSchema,
  createRoomSchema,
  joinRoomSchema,
  normalizedRoomCodeParamsSchema,
  submitGuessSchema
} from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema accepts a valid body with playerName", () => {
    const result = createRoomSchema.parse({ playerName: "Alice" });

    expect(result.playerName).toBe("Alice");
  });

  it("createRoomSchema trims playerName", () => {
    const result = createRoomSchema.parse({ playerName: "  Alex  " });

    expect(result.playerName).toBe("Alex");
  });

  it("createRoomSchema rejects empty and whitespace-only playerName", () => {
    expect(() => createRoomSchema.parse({ playerName: "" })).toThrow();
    expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow();
  });

  it("joinRoomSchema rejects whitespace-only playerName", () => {
    expect(() => joinRoomSchema.parse({ playerName: "   " })).toThrow();
  });

  it("normalizedRoomCodeParamsSchema rejects missing code", () => {
    expect(() => normalizedRoomCodeParamsSchema.parse({})).toThrow();
  });

  it("normalizedRoomCodeParamsSchema rejects empty and whitespace-only codes", () => {
    expect(() => normalizedRoomCodeParamsSchema.parse({ code: "" })).toThrow();
    expect(() => normalizedRoomCodeParamsSchema.parse({ code: "   " })).toThrow();
  });

  it("normalizedRoomCodeParamsSchema trims valid codes", () => {
    const result = normalizedRoomCodeParamsSchema.parse({ code: " abcd " });

    expect(result.code).toBe("abcd");
  });

  it("canvasStrokeSchema validates normalized points", () => {
    const result = canvasStrokeSchema.parse({
      points: [
        [0, 0],
        [1, 1]
      ],
      color: "#000000",
      lineWidth: 4
    });

    expect(result.points).toHaveLength(2);
    expect(() =>
      canvasStrokeSchema.parse({
        points: [[0, 0]],
        color: "#000000",
        lineWidth: 4
      })
    ).toThrow();
  });

  it("submitGuessSchema rejects whitespace-only guessText", () => {
    expect(() =>
      submitGuessSchema.parse({
        participantId: "p1",
        guessText: "   "
      })
    ).toThrow();
  });
});
