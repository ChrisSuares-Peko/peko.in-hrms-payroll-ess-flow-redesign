const category = require("../../../entities/categories");
const vendors = require("../../../entities/vendor");
const { findAllCategories } = require("../../edocs");

jest.mock("../../../entities/categories", () => ({
  findAll: jest.fn(),
}));

jest.mock("../../../entities/vendor", () => ({
  belongsTo: jest.fn(),
}));

describe("findAllCategories", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return categories with vendor include", async () => {
    const categoryAttributes = ["id", "categoryName"];
    const vendorAttributes = ["id", "vendorName"];

    const mockData = [
      {
        id: 1,
        categoryName: "Documents",
        vendor: { id: 10, vendorName: "edocs" },
      },
    ];

    category.findAll.mockResolvedValue(mockData);

    const result = await findAllCategories(categoryAttributes, vendorAttributes);

    expect(category.findAll).toHaveBeenCalledWith({
      attributes: categoryAttributes,
      include: [
        {
          model: vendors,
          where: { vendorName: "edocs" },
          attributes: vendorAttributes,
        },
      ],
      where: { categoryStatus: true },
    });

    expect(result).toEqual(mockData);
  });

  it("should pass undefined attributes when none are provided", async () => {
    category.findAll.mockResolvedValue([]);

    await findAllCategories();

    expect(category.findAll).toHaveBeenCalledWith({
      attributes: undefined,
      include: [
        {
          model: vendors,
          where: { vendorName: "edocs" },
          attributes: undefined,
        },
      ],
      where: { categoryStatus: true },
    });
  });

  it("should return empty array when no categories found", async () => {
    category.findAll.mockResolvedValue([]);

    const result = await findAllCategories(["id"], ["vendorName"]);

    expect(result).toEqual([]);
  });

  it("should return undefined when DB throws error", async () => {
    category.findAll.mockRejectedValue(new Error("DB error"));

    const result = await findAllCategories(["id"], ["vendorName"]);

    expect(result).toBeUndefined();
  });

  it("should correctly filter categories with categoryStatus = true", async () => {
    category.findAll.mockResolvedValue([]);

    await findAllCategories();

    expect(category.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { categoryStatus: true },
      })
    );
  });

  it("should include vendor filter vendorName='edocs'", async () => {
    category.findAll.mockResolvedValue([]);

    await findAllCategories();

    expect(category.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.arrayContaining([
          expect.objectContaining({
            model: vendors,
            where: { vendorName: "edocs" },
          }),
        ]),
      })
    );
  });
});
