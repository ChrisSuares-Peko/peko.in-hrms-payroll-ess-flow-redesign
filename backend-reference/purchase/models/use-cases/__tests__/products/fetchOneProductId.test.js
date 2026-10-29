const { fetchOneProductId } = require("../../products");
const product = require("../../../entities/products");

jest.mock("../../../entities/products", () => ({
  findOne: jest.fn(),
}));

describe("fetchOneProductId function", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return vendor details for a given product ID", async () => {
    // Mock values
    const productId = 1;
    const mockVendorData = {
      id: productId,
      name: "Sample Product",
      vendors: "Vendor A",
      VAT: 15,         // New attribute
      vatType: "GST",  // New attribute
    };

    // Mock implementation
    product.findOne.mockResolvedValue(mockVendorData);

    const result = await fetchOneProductId(productId);

    expect(product.findOne).toHaveBeenCalledWith({
      where: { id: productId },
      attributes: ["vendors", "id", "name"], // Updated attributes list
      raw: true,
    });

    expect(result).toEqual(mockVendorData);
  });

  it("should handle case where no product is found", async () => {
    // Mock values
    const productId = 2;

    // Mock implementation
    product.findOne.mockResolvedValue(null);

    const result = await fetchOneProductId(productId);

    expect(product.findOne).toHaveBeenCalledWith({
      where: { id: productId },
      attributes: ["vendors", "id", "name"], // Updated attributes list
      raw: true,
    });

    expect(result).toBeNull();
  });

  it("should handle errors thrown by the product model", async () => {
    // Mock values
    const productId = 3;
    const errorMessage = "Database error";

    // Mock implementation
    product.findOne.mockRejectedValue(new Error(errorMessage));

    await expect(fetchOneProductId(productId)).rejects.toThrow(errorMessage);

    expect(product.findOne).toHaveBeenCalledWith({
      where: { id: productId },
      attributes: ["vendors", "id", "name"], // Updated attributes list
      raw: true,
    });
  });
});
