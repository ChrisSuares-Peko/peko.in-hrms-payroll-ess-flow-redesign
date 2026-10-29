const { Op } = require("sequelize");
const pkgModel = require("../../../entities/package");
const { findAllPartnerPackage } = require("../../../use-cases/package");

jest.mock("../../../entities/package", () => ({
  findAll: jest.fn(),
}));

describe("findAllPartnerPackage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return matching partner packages when packageIds are provided", async () => {
    const packageIds = [1, 2, 3];
    const mockResponse = [
      { id: 1, name: "Package A", type: 1 },
      { id: 2, name: "Package B", type: 1 },
    ];

    pkgModel.findAll.mockResolvedValue(mockResponse);

    const result = await findAllPartnerPackage({}, packageIds);

    expect(pkgModel.findAll).toHaveBeenCalledWith({
      where: {
        type: 1,
        id: {
          [Op.in]: packageIds,
        },
      },
      raw: true,
    });
    expect(result).toEqual(mockResponse);
  });

  it("should return an empty array if no matching packages are found", async () => {
    const packageIds = [99, 100];

    pkgModel.findAll.mockResolvedValue([]);

    const result = await findAllPartnerPackage({}, packageIds);

    expect(pkgModel.findAll).toHaveBeenCalledWith({
      where: {
        type: 1,
        id: {
          [Op.in]: packageIds,
        },
      },
      raw: true,
    });
    expect(result).toEqual([]);
  });

  it("should return undefined and log an error if findAll fails", async () => {
    const packageIds = [1, 2, 3];
    const errorMessage = new Error("Database error");

    console.log = jest.fn(); // Mock console.log
    pkgModel.findAll.mockRejectedValue(errorMessage);

    const result = await findAllPartnerPackage({}, packageIds);

    expect(pkgModel.findAll).toHaveBeenCalledWith({
      where: {
        type: 1,
        id: {
          [Op.in]: packageIds,
        },
      },
      raw: true,
    });
    expect(console.log).toHaveBeenCalledWith(errorMessage);
    expect(result).toBeUndefined(); // or return `false` if function behavior is modified
  });
});
