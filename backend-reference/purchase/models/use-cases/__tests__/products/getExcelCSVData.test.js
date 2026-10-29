const { Op } = require("sequelize");
const product = require("../../../entities/products");
const category = require("../../../entities/categories");
const { getExcelCSVData } = require("../../products");

jest.mock("../../../entities/products", () => ({
  findAll: jest.fn(),
}));

describe("getExcelCSVData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch product data and format it correctly", async () => {
    const mockParams = {
      categoryId: 1,
      searchText: "test",
    };

    const mockData = [
      {
        id: 1,
        name: "Product A",
        status: true,
        description: "Description A",
        vendorPrice: 100,
        skuCode: "SKU001",
        productImage: "imageA.jpg",
        price: 150,
        quantity: 10,
        category: { categoryName: "Electronics" },
      },
      {
        id: 2,
        name: null,
        status: false,
        description: "Description B",
        vendorPrice: null,
        skuCode: null,
        productImage: "imageB.jpg",
        price: null,
        quantity: null,
        category: { categoryName: "Appliances" },
      },
    ];

    product.findAll.mockResolvedValue(mockData);

    const result = await getExcelCSVData(mockParams);

    expect(product.findAll).toHaveBeenCalledWith({
      include: [
        {
          model: category,
          as: "",
          attributes: ["categoryName"],
        },
      ],
      attributes: [
        "id",
        "name",
        "status",
        "description",
        "vendorPrice",
        "skuCode",
        "productImage",
        "price",
        "quantity",
      ],
      where: {
        "$category.categoryName$": { [Op.ne]: "Subscriptions" },
        categoryId: { [Op.eq]: 1 },
        [Op.or]: [
          { id: { [Op.like]: "%test%" } },
          { name: { [Op.like]: "%test%" } },
          { description: { [Op.like]: "%test%" } },
        ],
      },
      order: [["createdAt", "DESC"]],
      raw: true,
      nest: true,
    });

    expect(result).toEqual([
      {
        "Product Code": undefined,
        "Product Name": "Product A",
        Status: "Available",
        "SKU Code": "SKU001",
        Price: "150INR",
        "Vendor Price": "100INR",
        Quantity: 10,
        "Category Name": "Electronics",
      },
      {
        "Product Code": undefined,
        "Product Name": "Not Available",
        Status: "Not Available",
        "SKU Code": "Not Available",
        Price: "Not Available",
        "Vendor Price": "Not Available",
        Quantity: "Not Available",
        "Category Name": "Appliances",
      },
    ]);
  });

  it("should return an empty array if no products are found", async () => {
    product.findAll.mockResolvedValue([]);

    const result = await getExcelCSVData({});

    expect(product.findAll).toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it("should handle errors gracefully", async () => {
    product.findAll.mockRejectedValue(new Error("Database error"));

    await expect(getExcelCSVData({})).rejects.toThrow("Database error");
  });
});
