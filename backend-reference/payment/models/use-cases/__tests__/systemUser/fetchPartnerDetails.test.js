const systemUser = require("../../../entities/systemUser");
const { fetchPartnerDetails } = require("../../systemUser");

jest.mock("../../../../public/partnerLogos", () => [
  {
    logo: "default-logo.png",
    baseUrl: "https://default.com",
    branding: "DefaultBrand",
  }
]);


jest.mock("../../../entities/systemUser", () => ({
  findOne: jest.fn(),
}));

describe("fetchPartnerDetails Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should return partner details when systemUser is found", async () => {
    systemUser.findOne.mockResolvedValue({
      assets: { logo: "logo.png", baseUrl: "https://partner.com" },
      branding: "PartnerBrand",
    });

    const result = await fetchPartnerDetails("CRED123");

    expect(systemUser.findOne).toHaveBeenCalledWith({
      where: { credentialId: "CRED123" },
      attributes: ["assets", "branding", "sharePercentage", "gatewayCharge", "state"],
      nest: true,
      raw: true,
    });

    expect(result).toEqual({
      logo: "logo.png",
      baseUrl: "https://partner.com",
      branding: "PartnerBrand",
    });
  });

  test("should return the share percentage and state of the partner", async () => {
    systemUser.findOne.mockResolvedValue({
      assets: { logo: "logo.png", baseUrl: "https://partner.com" },
      branding: "PartnerBrand",
      sharePercentage: "12.5000",
      state: "Kerala",
    });

    const result = await fetchPartnerDetails("CRED123");

    expect(result).toEqual({
      logo: "logo.png",
      baseUrl: "https://partner.com",
      branding: "PartnerBrand",
      sharePercentage: "12.5000",
      state: "Kerala",
    });
  });

  test("should fallback to partnerLogos[0] when result is null", async () => {
    systemUser.findOne.mockResolvedValue(null);

    const result = await fetchPartnerDetails("CRED999");

    expect(result).toEqual({
      logo: "default-logo.png",
      baseUrl: "https://default.com",
      branding: "DefaultBrand",
    });
  });

  test("should fallback missing asset fields individually", async () => {
    systemUser.findOne.mockResolvedValue({
      assets: { baseUrl: "https://partial.com" },
      branding: null,
    });

    const result = await fetchPartnerDetails("CRED444");

    expect(result).toEqual({
      logo: "default-logo.png",
      baseUrl: "https://partial.com",
      branding: "DefaultBrand",
    });
  });

  test("should fall back to default branding when the database query fails", async () => {
    systemUser.findOne.mockRejectedValue(new Error("DB ERROR"));

    await expect(fetchPartnerDetails("ERR")).resolves.toEqual(
      expect.objectContaining({
        logo: expect.anything(),
        baseUrl: expect.anything(),
        branding: expect.anything(),
      })
    );
  });
});

describe("the partner's gateway charge terms", () => {
    it("carries the terms beside the share and the state", async () => {
        systemUser.findOne.mockResolvedValue({
            assets: {},
            branding: null,
            sharePercentage: "10.0000",
            state: "Kerala",
            gatewayCharge: { percentage: 1.95, fixed: 3 },
        });

        const result = await fetchPartnerDetails(7);

        expect(systemUser.findOne.mock.calls[0][0].attributes).toContain("gatewayCharge");
        expect(result).toMatchObject({
            sharePercentage: "10.0000",
            state: "Kerala",
            gatewayCharge: { percentage: 1.95, fixed: 3 },
        });
    });

    it("carries no terms when the partner has none", async () => {
        systemUser.findOne.mockResolvedValue({
            assets: {},
            branding: null,
            sharePercentage: "10.0000",
            state: "Kerala",
            gatewayCharge: null,
        });

        expect((await fetchPartnerDetails(7)).gatewayCharge).toBeNull();
    });
});
