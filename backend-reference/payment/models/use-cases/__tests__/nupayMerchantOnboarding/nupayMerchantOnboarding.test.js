const nupayMerchantOnboarding = require("../../../entities/nupayMerchantOnboarding");
const useCase = require("../../nupayMerchantOnboarding");

jest.mock("../../../entities/nupayMerchantOnboarding", () => ({
  create: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
}));

describe("nupayMerchantOnboarding use-case", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("create forwards data to the entity", async () => {
    const data = { corporateId: 1, nupayRefNo: "REF1" };
    nupayMerchantOnboarding.create.mockResolvedValue({ id: 5, ...data });
    const result = await useCase.create(data);
    expect(nupayMerchantOnboarding.create).toHaveBeenCalledWith(data);
    expect(result).toMatchObject({ id: 5 });
  });

  it("findByCorporateId returns the latest record for the corporate", async () => {
    await useCase.findByCorporateId(7);
    expect(nupayMerchantOnboarding.findOne).toHaveBeenCalledWith({
      where: { corporateId: 7 },
      order: [["createdAt", "DESC"]],
    });
  });

  it("findByNupayRefNo looks up by NuPay reference number", async () => {
    await useCase.findByNupayRefNo("REF1");
    expect(nupayMerchantOnboarding.findOne).toHaveBeenCalledWith({ where: { nupayRefNo: "REF1" } });
  });

  it("updateByNupayRefNo returns true only when a row changed", async () => {
    nupayMerchantOnboarding.update.mockResolvedValueOnce([1]);
    expect(await useCase.updateByNupayRefNo("REF1", { status: "active" })).toBe(true);
    expect(nupayMerchantOnboarding.update).toHaveBeenCalledWith(
      { status: "active" },
      { where: { nupayRefNo: "REF1" } }
    );

    nupayMerchantOnboarding.update.mockResolvedValueOnce([0]);
    expect(await useCase.updateByNupayRefNo("REF1", { status: "active" })).toBe(false);
  });
});
