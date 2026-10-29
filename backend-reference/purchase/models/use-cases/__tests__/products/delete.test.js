const product = require("../../../entities/products");
const { Delete } = require("../../products");

jest.mock("../../../entities/products", () => ({
  destroy: jest.fn(),
}));

describe("delete product by productCode", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should delete a product successfully", async () => {
    product.destroy.mockResolvedValue(1); // 1 indicates a row was deleted

    const result = await Delete({ productCode: 123 });

    expect(product.destroy).toHaveBeenCalledWith({
      where: { id: 123 },
    });
    expect(result).toBe(1);
  });

  it("should return 0 if no product is found", async () => {
    product.destroy.mockResolvedValue(0); // 0 indicates no rows were deleted

    const result = await Delete({ productCode: 999 });

    expect(product.destroy).toHaveBeenCalledWith({
      where: { id: 999 },
    });
    expect(result).toBe(0);
  });

  it("should handle database errors gracefully", async () => {
    product.destroy.mockRejectedValue(new Error("Database error"));

    await expect(Delete({ productCode: 123 })).rejects.toThrow("Database error");

    expect(product.destroy).toHaveBeenCalledWith({
      where: { id: 123 },
    });
  });
});
