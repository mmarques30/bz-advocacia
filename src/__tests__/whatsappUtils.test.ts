import { describe, expect, it } from "vitest";
import { formatPhoneForWhatsApp } from "@/lib/whatsappUtils";

describe("formatPhoneForWhatsApp", () => {
  it("returns empty string for empty input", () => {
    expect(formatPhoneForWhatsApp("")).toBe("");
  });

  it("strips non-digits", () => {
    expect(formatPhoneForWhatsApp("(11) 98765-4321")).toBe("5511987654321");
  });

  it("prefixes BR country code (55) when missing", () => {
    expect(formatPhoneForWhatsApp("11987654321")).toBe("5511987654321");
  });

  it("does NOT double-prefix when 55 already present", () => {
    expect(formatPhoneForWhatsApp("5511987654321")).toBe("5511987654321");
  });

  it("does not double-prefix even with formatting noise", () => {
    expect(formatPhoneForWhatsApp("+55 (11) 98765-4321")).toBe("5511987654321");
  });

  it("handles landline (10 digits)", () => {
    expect(formatPhoneForWhatsApp("1134567890")).toBe("551134567890");
  });
});
