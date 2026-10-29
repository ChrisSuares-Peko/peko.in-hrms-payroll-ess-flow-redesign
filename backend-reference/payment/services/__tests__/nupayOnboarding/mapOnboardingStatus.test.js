const { mapOnboardingStatus } = require("../../nupayOnboarding");

describe("mapOnboardingStatus", () => {
  it("maps NuPay onboarding codes to the record status enum", () => {
    expect(mapOnboardingStatus("NP2000")).toBe("active");
    expect(mapOnboardingStatus("NP5000")).toBe("rejected");
    expect(mapOnboardingStatus("NP6000")).toBe("on_hold");
  });

  it("is case-insensitive", () => {
    expect(mapOnboardingStatus("np2000")).toBe("active");
    expect(mapOnboardingStatus("np5000")).toBe("rejected");
  });

  it("defaults pending / unknown codes to approval-pending", () => {
    expect(mapOnboardingStatus("NP1000")).toBe("approval-pending");
    expect(mapOnboardingStatus("SOMETHING")).toBe("approval-pending");
    expect(mapOnboardingStatus("")).toBe("approval-pending");
    expect(mapOnboardingStatus(null)).toBe("approval-pending");
    expect(mapOnboardingStatus(undefined)).toBe("approval-pending");
  });
});
