import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { warnIfTruncated } from "@/lib/queryGuards";

describe("warnIfTruncated", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("does not warn when data is below the limit", () => {
    const data = new Array(9_999).fill({ id: 1 });
    warnIfTruncated(data, "useFoo");
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("warns when data length equals the limit (likely truncated)", () => {
    const data = new Array(10_000).fill({ id: 1 });
    warnIfTruncated(data, "useFoo");
    expect(warnSpy).toHaveBeenCalledOnce();
    const msg = String(warnSpy.mock.calls[0][0]);
    expect(msg).toContain("useFoo");
    expect(msg).toContain("10000");
  });

  it("warns when data length exceeds the limit (defensive)", () => {
    const data = new Array(15_000).fill({ id: 1 });
    warnIfTruncated(data, "useBar");
    expect(warnSpy).toHaveBeenCalledOnce();
  });

  it("handles null/undefined without warning or throwing", () => {
    expect(() => warnIfTruncated(null, "useFoo")).not.toThrow();
    expect(() => warnIfTruncated(undefined, "useFoo")).not.toThrow();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("respects a custom limit", () => {
    const data = new Array(500).fill({ id: 1 });
    warnIfTruncated(data, "useFoo", 500);
    expect(warnSpy).toHaveBeenCalledOnce();
  });

  it("returns the same data reference for chaining", () => {
    const data = [{ id: 1 }, { id: 2 }];
    expect(warnIfTruncated(data, "useFoo")).toBe(data);
  });
});
