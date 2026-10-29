const partnerPermission = require("../../../entities/partnerPermission");
const { findPartnerPermissions } = require("../../../use-cases/package");

// Mock the `partnerPermission` model
jest.mock("../../../entities/partnerPermission", () => ({
  findOne: jest.fn(),
}));

describe("findPartnerPermissions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn(); // Mock console.log to track logs
  });

  it("should return partner permissions when found", async () => {
    const partnerId = 123;
    const mockResponse = { permissions: { view: true, edit: false } };

    partnerPermission.findOne.mockResolvedValue(mockResponse);

    const result = await findPartnerPermissions(partnerId);

    expect(partnerPermission.findOne).toHaveBeenCalledWith({
      where: { registeredBy: partnerId },
      attributes: { exclude: ["id"] },
      raw: true,
    });
    expect(result).toEqual(mockResponse);
    expect(console.log).toHaveBeenCalledWith("FIND PARTNER PERMISSION ROUTE CALLED");
  });

  it("should return undefined and log an error if findOne fails", async () => {
    const partnerId = 456;
    const errorMessage = new Error("Database error");

    partnerPermission.findOne.mockRejectedValue(errorMessage);

    const result = await findPartnerPermissions(partnerId);

    expect(partnerPermission.findOne).toHaveBeenCalledWith({
      where: { registeredBy: partnerId },
      attributes: { exclude: ["id"] },
      raw: true,
    });
    expect(console.log).toHaveBeenCalledWith(errorMessage);
    expect(console.log).toHaveBeenCalledWith("FIND PARTNER PERMISSION ROUTE CALLED");
    expect(result).toBeUndefined();
  });
});
