import { describe, it, expect } from "bun:test";

describe("example", () => {
  it("should pass a basic assertion", () => {
    expect(1 + 1).toBe(2);
  });

  it("should handle string operations", () => {
    expect("hello world").toContain("hello");
  });
});
