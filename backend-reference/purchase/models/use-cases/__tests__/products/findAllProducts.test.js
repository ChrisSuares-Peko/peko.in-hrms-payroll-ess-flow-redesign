const { Op } = require("sequelize");
const product = require("../../../entities/products");
const category = require("../../../entities/categories");
const { findAllProducts } = require("../../products");
const { handleSortFields } = require("../../../../utils/sortHandle");

jest.mock("../../../entities/products", () => ({
  findAndCountAll: jest.fn(),
}));

jest.mock("../../../../utils/sortHandle", () => ({
  handleSortFields: jest.fn(),
}));

describe("findAllProducts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch products with search filters and sorting", async () => {
    const mockParams = {
      limit: 10,
      offset: 0,
      searchText: "test",
      sort: "ASC",
      sortField: "name",
      productsOnly: true,
      categoryId: 5,
    };

    const mockOrder = [["name", "ASC"]];
    const mockResponse = {
      count: 2,
      rows: [
        {
          id: 1,
          name: "Test Product 1",
          description: "Test Desc 1",
          price: "100",
          category: { id: 5, categoryName: "Electronics" },
        },
        {
          id: 2,
          name: "Test Product 2",
          description: "Test Desc 2",
          price: "200",
          category: { id: 5, categoryName: "Electronics" },
        },
      ],
    };

    handleSortFields.mockReturnValue(mockOrder);
    product.findAndCountAll.mockResolvedValue(mockResponse);

    const result = await findAllProducts(mockParams);

    expect(handleSortFields).toHaveBeenCalledWith("name", "ASC");
    expect(product.findAndCountAll).toHaveBeenCalledWith({
      include: [
        {
          model: category,
          attributes: ["id", "categoryName"],
          where: { categoryStatus: true },
        },
      ],
      where: {
        [Op.or]: [
          { id: { [Op.like]: "%test%" } },
          { name: { [Op.like]: "%test%" } },
          { description: { [Op.like]: "%test%" } },
          { price: { [Op.like]: "%test%" } },
        ],
        [Op.and]: {
          
          categoryId: 5,
        },
      },
      order: mockOrder,
      limit: 10,
      offset: 0,
      raw: true,
      nest: true,
    });

    expect(result).toEqual(mockResponse);
  });

  it("should handle errors gracefully", async () => {
    product.findAndCountAll.mockRejectedValue(new Error("Database error"));

    await expect(findAllProducts({})).rejects.toEqual({
      message: "Something went wrong",
    });

    expect(product.findAndCountAll).toHaveBeenCalled();
  });
});
