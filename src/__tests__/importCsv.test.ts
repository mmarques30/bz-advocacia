import { describe, expect, it } from "vitest";
import { parseBRLNumber, parseMesPtBR } from "@/lib/importCsv";

describe("parseMesPtBR", () => {
  it("resolves full Portuguese month names", () => {
    expect(parseMesPtBR("janeiro")).toBe(1);
    expect(parseMesPtBR("Dezembro")).toBe(12);
  });

  it("resolves abbreviations", () => {
    expect(parseMesPtBR("jan")).toBe(1);
    expect(parseMesPtBR("dez")).toBe(12);
  });

  it("resolves numeric months 1..12", () => {
    expect(parseMesPtBR("1")).toBe(1);
    expect(parseMesPtBR("12")).toBe(12);
  });

  it("returns null for invalid inputs", () => {
    expect(parseMesPtBR("foo")).toBeNull();
    expect(parseMesPtBR("0")).toBeNull();
    expect(parseMesPtBR("13")).toBeNull();
    expect(parseMesPtBR("")).toBeNull();
  });
});

describe("parseBRLNumber", () => {
  it("parses Brazilian decimal format", () => {
    expect(parseBRLNumber("1.234,56")).toBe(1234.56);
    expect(parseBRLNumber("1234,5")).toBe(1234.5);
  });

  it("strips R$ prefix and whitespace", () => {
    expect(parseBRLNumber("R$ 1.500,00")).toBe(1500);
    expect(parseBRLNumber("  R$ 99,90 ")).toBe(99.9);
  });

  it("handles plain integers and floats", () => {
    expect(parseBRLNumber("1234")).toBe(1234);
    expect(parseBRLNumber(42)).toBe(42);
  });

  it("returns NaN for nonsense", () => {
    expect(parseBRLNumber("abc")).toBeNaN();
    expect(parseBRLNumber(null)).toBeNaN();
    expect(parseBRLNumber(undefined)).toBeNaN();
  });
});
