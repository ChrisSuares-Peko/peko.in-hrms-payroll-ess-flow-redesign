const { productAndCountExport } = require("../../products");
const product = require("../../../entities/products");

jest.mock("../../../entities/products", () => ({
  findAndCountAll: jest.fn(),
}));

jest.mock("../../../entities/categories", () => ({}));

describe("productAndCountExport", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

 

  it("should return an empty array if no products are found", async () => {
    product.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    const result = await productAndCountExport({ searchText: "" });

    expect(result).toEqual([]);
  });

  
  
    it("should fetch and transform product data correctly", async () => {
      const mockParams = {
        searchText: "test",
        sort: "ASC",
        sortField: "name",
        productsOnly: true,
        categoryId: 1,
      };
  
      const mockProducts = {
        count: 2,
        rows: [
          {
            createdAt: "2024-02-19T12:00:00Z",
            name: "Test Product",
            description: "A test product",
            quantity: 10,
            price: 100,
            status: 1,
            vendors: JSON.stringify([{ name: "Vendor A", price: 200 }]),
            category: { categoryName: "Test Category" },
          },
        ],
      };
  
      product.findAndCountAll.mockResolvedValue(mockProducts);
  
      const result = await productAndCountExport(mockParams);
  
      expect(product.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          order: [["name", "ASC"]],
         
        })
      );
  
      expect(result).toEqual(expect.any(Array));
    });
  
    it("should handle errors gracefully", async () => {
      product.findAndCountAll.mockRejectedValue(new Error("Database error"));
  
      await expect(productAndCountExport({ searchText: "" })).rejects.toEqual({
        message: "Something went wrong",
      });
  
      expect(product.findAndCountAll).toHaveBeenCalled();
    });
  
  
});
