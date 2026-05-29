import { describe, expect, it } from "vitest";
import { createRoomSchema, normalizedRoomCodeParamsSchema } from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema accepts a valid body with playerName", () => {
    const result = createRoomSchema.parse({ playerName: "Alice" });

    expect(result.playerName).toBe("Alice");
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
});
