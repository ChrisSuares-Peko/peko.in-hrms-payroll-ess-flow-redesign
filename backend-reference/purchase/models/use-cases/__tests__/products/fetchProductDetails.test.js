const { Op } = require("sequelize");
const product = require("../../../entities/products");
const { fetchProductDetails } = require("../../products");

jest.mock("../../../entities/products", () => ({
  findAll: jest.fn(),
}));

describe("fetchProductDetails", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch product details based on search query", async () => {
    const query = "test";
    const mockResponse = [
      { id: 1, name: "Test Product 1" },
      { id: 2, name: "Test Product 2" },
    ];

    product.findAll.mockResolvedValue(mockResponse);

    const result = await fetchProductDetails(query);

    expect(product.findAll).toHaveBeenCalledWith({
      where: {
        name: { [Op.like]: `%${query}%` },
      },
      attributes: ["id", "name"],
    });

    expect(result).toEqual(mockResponse);
  });

  it("should return an empty array if no products are found", async () => {
    product.findAll.mockResolvedValue([]);

    const result = await fetchProductDetails("nonexistent");

    expect(product.findAll).toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it("should handle errors gracefully", async () => {
    product.findAll.mockRejectedValue(new Error("Database error"));

    await expect(fetchProductDetails("test")).rejects.toThrow("Database error");
  });
});
