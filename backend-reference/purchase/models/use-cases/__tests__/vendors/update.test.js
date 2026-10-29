const { update } = require("../../vendors");
const vendor = require("../../../entities/vendor");

jest.mock("../../../entities/vendor", () => ({
  update: jest.fn(),
}));

describe("update Use-Case", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should update a vendor successfully", async () => {
    const mockParams = { id: 1 };
    const mockData = { vendorName: "Updated Vendor" };
    vendor.update.mockResolvedValue([1]); // Sequelize update returns an array where the first element is the number of affected rows

    const result = await update(mockParams, mockData);

    expect(vendor.update).toHaveBeenCalledWith(mockData, {
      where: { id: mockParams.id },
    });
    expect(result).toEqual([1]); // Expect 1 row to be updated
  });

  it("should return 0 when no vendor is updated", async () => {
    const mockParams = { id: 99 }; // Assuming this ID doesn't exist
    const mockData = { vendorName: "Nonexistent Vendor" };
    vendor.update.mockResolvedValue([0]); // 0 rows updated

    const result = await update(mockParams, mockData);

    expect(vendor.update).toHaveBeenCalledWith(mockData, {
      where: { id: mockParams.id },
    });
    expect(result).toEqual([0]); // Expect no rows updated
  });

  it("should handle errors and throw an exception", async () => {
    const mockParams = { id: 1 };
    const mockData = { vendorName: "Error Vendor" };
    const expectedError = new Error("Database update failed");

    vendor.update.mockRejectedValue(expectedError);

    await expect(update(mockParams, mockData)).rejects.toThrow(expectedError);

    expect(vendor.update).toHaveBeenCalledWith(mockData, {
      where: { id: mockParams.id },
    });
  });
});
