const nupayBeneficiary = require("../../../entities/nupayBeneficiary");
const useCase = require("../../nupayBeneficiary");

jest.mock("../../../entities/nupayBeneficiary", () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  count: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
}));

describe("nupayBeneficiary use-case", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("create passes data straight to the entity", async () => {
    const data = { corporateId: 1, accountNumber: "123" };
    nupayBeneficiary.create.mockResolvedValue({ id: 9, ...data });
    const result = await useCase.create(data);
    expect(nupayBeneficiary.create).toHaveBeenCalledWith(data);
    expect(result).toEqual({ id: 9, ...data });
  });

  it("findAllByCorporateId scopes to corporate and orders newest first", async () => {
    nupayBeneficiary.findAll.mockResolvedValue([]);
    await useCase.findAllByCorporateId(7);
    expect(nupayBeneficiary.findAll).toHaveBeenCalledWith({
      where: { corporateId: 7 },
      order: [["createdAt", "DESC"]],
    });
  });

  it("findById scopes by id + corporate", async () => {
    await useCase.findById(3, 7);
    expect(nupayBeneficiary.findOne).toHaveBeenCalledWith({ where: { id: 3, corporateId: 7 } });
  });

  it("findDuplicate matches on account number + ifsc within the corporate", async () => {
    await useCase.findDuplicate(7, "123", "HDFC0001");
    expect(nupayBeneficiary.findOne).toHaveBeenCalledWith({
      where: { corporateId: 7, accountNumber: "123", ifscCode: "HDFC0001" },
    });
  });

  it("countActive counts within the corporate", async () => {
    nupayBeneficiary.count.mockResolvedValue(4);
    expect(await useCase.countActive(7)).toBe(4);
    expect(nupayBeneficiary.count).toHaveBeenCalledWith({ where: { corporateId: 7 } });
  });

  it("updateById returns true only when a row was updated", async () => {
    nupayBeneficiary.update.mockResolvedValueOnce([1]);
    expect(await useCase.updateById(3, 7, { name: "x" })).toBe(true);
    nupayBeneficiary.update.mockResolvedValueOnce([0]);
    expect(await useCase.updateById(3, 7, { name: "x" })).toBe(false);
    expect(nupayBeneficiary.update).toHaveBeenLastCalledWith({ name: "x" }, { where: { id: 3, corporateId: 7 } });
  });

  it("deleteById returns true only when a row was removed", async () => {
    nupayBeneficiary.destroy.mockResolvedValueOnce(1);
    expect(await useCase.deleteById(3, 7)).toBe(true);
    nupayBeneficiary.destroy.mockResolvedValueOnce(0);
    expect(await useCase.deleteById(3, 7)).toBe(false);
  });
});
