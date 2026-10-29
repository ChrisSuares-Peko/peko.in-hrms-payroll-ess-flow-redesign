const product = require("../../../entities/products");
const { find } = require("../../products");

jest.mock("../../../entities/products", () => ({
  findOne: jest.fn(),
}));

describe("find product by name", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return a product if found", async () => {
    const mockProduct = { id: 1, name: "Test Product" };
    product.findOne.mockResolvedValue(mockProduct);

    const result = await find("Test Product");

    expect(product.findOne).toHaveBeenCalledWith({
      where: { name: "Test Product" },
    });
    expect(result).toEqual(mockProduct);
  });

  it("should return null if no product is found", async () => {
    product.findOne.mockResolvedValue(null);

    const result = await find("Nonexistent Product");

    expect(product.findOne).toHaveBeenCalledWith({
      where: { name: "Nonexistent Product" },
    });
    expect(result).toBeNull();
  });

  it("should handle database errors gracefully", async () => {
    product.findOne.mockRejectedValue(new Error("Database error"));

    await expect(find("Test Product")).rejects.toThrow("Database error");

    expect(product.findOne).toHaveBeenCalledWith({
      where: { name: "Test Product" },
    });
  });
});
