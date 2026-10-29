const { create } = require("../../vendors");
const vendor = require("../../../entities/vendor");

jest.mock("../../../entities/vendor", () => ({
  create: jest.fn(),
}));

describe("create Use-Case", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create a vendor successfully", async () => {
    const mockParams = { vendorName: "New Vendor", email: "vendor@example.com" };
    const mockCreatedVendor = { id: 1, ...mockParams };

    vendor.create.mockResolvedValue(mockCreatedVendor);

    const result = await create(mockParams);

    expect(vendor.create).toHaveBeenCalledWith(mockParams);
    expect(result).toEqual(mockCreatedVendor);
  });

  it("should handle errors and throw an exception", async () => {
    const mockParams = { vendorName: "Error Vendor" };
    const expectedError = new Error("Database insert failed");

    vendor.create.mockRejectedValue(expectedError);

    await expect(create(mockParams)).rejects.toThrow(expectedError);

    expect(vendor.create).toHaveBeenCalledWith(mockParams);
  });
});
