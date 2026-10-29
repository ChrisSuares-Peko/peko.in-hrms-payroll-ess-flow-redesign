const category = require("../../../entities/categories");
const vendors = require("../../../entities/vendor");
const { fetchAllCategories } = require("../../products");
const { Op } = require("sequelize");

jest.mock("../../../entities/categories", () => ({
  findAll: jest.fn(),
}));

describe("fetchAllCategories", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch categories with vendor filtering", async () => {
    const mockParams = {
      searchText: "electronics",
    };

    const mockData = [
      {
        id: 1,
        categoryName: "Electronics",
        categoryStatus: true,
        vendors: [{ id: 1, vendorName: "Ecom" }],
      },
      {
        id: 2,
        categoryName: "Subscriptions",
        categoryStatus: true,
        vendors: [{ id: 2, vendorName: "Subscriptions" }],
      },
    ];

    category.findAll.mockResolvedValue(mockData);

    const result = await fetchAllCategories(mockParams);

    expect(category.findAll).toHaveBeenCalledWith({
      include: [
        {
          model: vendors,
          attributes: ["id", "vendorName"],
          where: {
            vendorName: {
              [Op.or]: ["Ecom", "Subscriptions"], // ✅ Use Op.or instead of "$or"
            },
          },
        },
      ],
      where: {
        categoryStatus: true,
        categoryName: { [Op.like]: "%electronics%" }, // ✅ Use Op.like instead of "$like"
      },
    });

    expect(result).toEqual(mockData);
  });

  it("should fetch categories without search filtering", async () => {
    const mockData = [
      {
        id: 3,
        categoryName: "Home Appliances",
        categoryStatus: true,
        vendors: [{ id: 3, vendorName: "Ecom" }],
      },
    ];

    category.findAll.mockResolvedValue(mockData);

    const result = await fetchAllCategories({});

    expect(category.findAll).toHaveBeenCalledWith({
      include: [
        {
          model: vendors,
          attributes: ["id", "vendorName"],
          where: {
            vendorName: {
              [Op.or]: ["Ecom", "Subscriptions"],
            },
          },
        },
      ],
      where: {
        categoryStatus: true,
      },
    });

    expect(result).toEqual(mockData);
  });

  it("should return an empty array if no categories are found", async () => {
    category.findAll.mockResolvedValue([]);

    const result = await fetchAllCategories({ searchText: "nonexistent" });

    expect(category.findAll).toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it("should handle errors gracefully", async () => {
    category.findAll.mockRejectedValue(new Error("Database error"));

    await expect(fetchAllCategories({})).resolves.toBeUndefined();
  });
});
