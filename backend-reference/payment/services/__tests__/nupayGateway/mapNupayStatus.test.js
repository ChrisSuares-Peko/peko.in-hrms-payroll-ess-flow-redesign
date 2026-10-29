const { mapNupayStatus } = require("../../nupayGateway");

describe("mapNupayStatus", () => {
  it("maps success code/status to SUCCESS", () => {
    expect(mapNupayStatus("NP2000")).toBe("SUCCESS");
    expect(mapNupayStatus("SUCCESS")).toBe("SUCCESS");
  });

  it("maps failure/rejection codes to FAILED", () => {
    expect(mapNupayStatus("NP5000")).toBe("FAILED");
    expect(mapNupayStatus("NP3000")).toBe("FAILED");
    expect(mapNupayStatus("FAILED")).toBe("FAILED");
    expect(mapNupayStatus("REJECTED")).toBe("FAILED");
  });

  it("is case-insensitive", () => {
    expect(mapNupayStatus("np2000")).toBe("SUCCESS");
    expect(mapNupayStatus("success")).toBe("SUCCESS");
    expect(mapNupayStatus("np5000")).toBe("FAILED");
  });

  it("defaults everything else to PENDING", () => {
    expect(mapNupayStatus("NP1000")).toBe("PENDING");
    expect(mapNupayStatus("NP4005")).toBe("PENDING");
    expect(mapNupayStatus("")).toBe("PENDING");
    expect(mapNupayStatus(null)).toBe("PENDING");
    expect(mapNupayStatus(undefined)).toBe("PENDING");
  });
});
