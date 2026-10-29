const { generateClientReferenceId } = require("../../nupayGateway");

describe("generateClientReferenceId", () => {
  it("returns a 12-char lowercase alphanumeric id", () => {
    const ref = generateClientReferenceId();
    expect(ref).toMatch(/^[a-z0-9]{12}$/);
  });

  it("satisfies NuPay's 8-14 alphanumeric client_reference_id rule", () => {
    const ref = generateClientReferenceId();
    expect(ref.length).toBeGreaterThanOrEqual(8);
    expect(ref.length).toBeLessThanOrEqual(14);
  });

  it("produces distinct ids across calls", () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateClientReferenceId()));
    expect(ids.size).toBe(50);
  });
});
